package esprit.PfeBackendProject.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import esprit.PfeBackendProject.entity.Offre;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiOffreGeneratorService {

    @Value("${groq.api.key}")
    private String groqKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public Offre generateAndStructure(Offre rawOffre) {
        String prompt = buildPrompt(rawOffre);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "llama-3.3-70b-versatile"); // ✅ modèle actuel gratuit
        body.put("max_tokens", 1024);
        body.put("temperature", 0.7);
        body.put("messages", List.of(
                Map.of("role", "system", "content",
                        "Tu es un expert RH. Réponds UNIQUEMENT en JSON valide, sans texte avant ou après."),
                Map.of("role", "user", "content", prompt)
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(groqKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.groq.com/openai/v1/chat/completions",
                    request, Map.class
            );
            String aiText = extractText(response.getBody());
            return parseAiResponse(aiText, rawOffre);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Erreur Groq : " + e.getResponseBodyAsString());
        }
    }

    private String buildPrompt(Offre offre) {
        return """
            Génère une offre d'emploi structurée et professionnelle.
            
            Données brutes :
            - Titre : %s
            - Description : %s
            - Type : %s
            - Niveau : %s
            
            Réponds UNIQUEMENT en JSON avec ce format exact :
            {
              "title": "titre optimisé",
              "description": "description enrichie 150-200 mots",
              "requirements": "compétences requises",
              "benefits": "avantages du poste",
              "linkedinText": "texte accrocheur pour LinkedIn max 1300 chars"
            }
            """.formatted(
                offre.getTitle(),
                offre.getDescription(),
                offre.getType(),
                offre.getRequiredLevel()
        );
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map body) {
        List<Map<String, Object>> choices =
                (List<Map<String, Object>>) body.get("choices");
        Map<String, Object> message =
                (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }

    private Offre parseAiResponse(String json, Offre original) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            // Nettoyer si Llama ajoute des backticks
            String cleaned = json.replaceAll("(?s)```json|```", "").trim();
            Map<String, String> data = mapper.readValue(cleaned, Map.class);

            original.setTitle(data.getOrDefault("title", original.getTitle()));
            original.setDescription(data.getOrDefault("description", original.getDescription()));
            return original;
        } catch (Exception e) {
            // Fallback si parsing échoue
            System.err.println("Parse error: " + e.getMessage());
            return original;
        }
    }
}