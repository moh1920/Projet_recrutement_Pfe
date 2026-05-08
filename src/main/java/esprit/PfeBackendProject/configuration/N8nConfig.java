package esprit.PfeBackendProject.configuration;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

/**
 * Configuration Spring Boot pour l'intégration n8n.
 *
 * Configure RestTemplate avec un timeout adapté au workflow n8n
 * (le scoring IA peut prendre 30-60 secondes selon le nombre de profils).
 */
@Configuration
public class N8nConfig {

    // Timeout configurable dans application.properties
    @Value("${n8n.webhook.connect-timeout:10000}")
    private int connectTimeout;

    @Value("${n8n.webhook.read-timeout:120000}")
    private int readTimeout;

    @Bean
    public RestTemplate n8nRestTemplate() {
        // Buffering permet de lire le body plusieurs fois (pour logs + parsing)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        BufferingClientHttpRequestFactory bufferingFactory = new BufferingClientHttpRequestFactory(factory);

        RestTemplate restTemplate = new RestTemplate(bufferingFactory);

        // Ajouter un interceptor pour logger les requêtes/réponses
        restTemplate.setInterceptors(Collections.singletonList((request, body, execution) -> {
            ClientHttpResponse response = execution.execute(request, body);
            // Forcer la lecture du body pour qu'il soit bufferisé
            return response;
        }));

        return restTemplate;
    }
}