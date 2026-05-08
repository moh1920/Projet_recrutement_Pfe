package esprit.PfeBackendProject.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import esprit.PfeBackendProject.dto.N8nScoringResponse;
import esprit.PfeBackendProject.entity.Offre;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.logging.Logger;

@Service
@Slf4j
@RequiredArgsConstructor
public class N8nRecrutementService {


    // Configurable dans application.properties
    @Value("${n8n.webhook.url}")
    private String webhookUrl;



    @Autowired
    private ObjectMapper objectMapper;  // Injecté par Spring avec SNAKE_CASE




    private final @Qualifier("n8nRestTemplate")
    RestTemplate n8nRestTemplate;


    public N8nScoringResponse lancerScoring(Offre offre) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<Offre> request = new HttpEntity<>(offre, headers);

        try {
            ResponseEntity<String> rawResponse = n8nRestTemplate.exchange(
                    webhookUrl,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            log.info("Status n8n : {}", rawResponse.getStatusCode());

            String body = rawResponse.getBody();
            log.info("Body brut n8n : [{}]", body);

            if (body == null) {
                throw new N8nException("n8n a retourné un body NULL - status: " + rawResponse.getStatusCode());
            }

            if (body.isBlank()) {
                throw new N8nException("n8n a retourné un body vide (blank) - status: " + rawResponse.getStatusCode());
            }

            // ✅ Utilise l'ObjectMapper de Spring (avec SNAKE_CASE configuré)
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            body = body.trim();

            if (body.startsWith("[")) {
                N8nScoringResponse[] arr = objectMapper.readValue(body, N8nScoringResponse[].class);
                if (arr.length == 0) {
                    throw new N8nException("n8n a retourné un tableau vide");
                }
                return arr[0];
            }

            return objectMapper.readValue(body, N8nScoringResponse.class);

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("Erreur HTTP n8n : {} - Body erreur : {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new N8nException("Erreur HTTP n8n : " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Erreur désérialisation réponse n8n : {}", e.getMessage(), e);
            throw new N8nException("Impossible de parser la réponse n8n : " + e.getMessage(), e);
        }
    }    // ── Exception métier ──────────────────────────────────────
    public static class N8nException extends RuntimeException {
        public N8nException(String message)            { super(message); }
        public N8nException(String message, Throwable cause) { super(message, cause); }
    }
}
