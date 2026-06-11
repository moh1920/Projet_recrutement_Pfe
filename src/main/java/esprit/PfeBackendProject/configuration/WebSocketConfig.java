package esprit.PfeBackendProject.configuration;


import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration WebSocket/STOMP pour la signalisation WebRTC.
 *
 * COMPATIBLE avec votre Keycloak OAuth2 existant.
 * Le token Keycloak sera transmis dans le header STOMP lors du CONNECT.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Broker en mémoire pour diffuser aux clients abonnés
        // /topic  → broadcast (tous les membres d'un salon)
        // /queue  → message privé (un seul destinataire)
        config.enableSimpleBroker("/topic", "/queue");

        // Préfixe pour les messages envoyés vers vos @MessageMapping
        config.setApplicationDestinationPrefixes("/app");

        // Préfixe pour les destinations utilisateur individuelles
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
                .addEndpoint("/ws-meeting")
                // Adaptez à votre URL Angular (port 4200 en dev)
                .setAllowedOriginPatterns(
                        "http://localhost:4200",
                        "https://pfe-frontend.graymoss-d46652df.francecentral.azurecontainerapps.io",
                        "https://pfe-frontend.orangesand-21e6d03b.germanywestcentral.azurecontainerapps.io"
                )
                .withSockJS(); // Fallback pour anciens navigateurs
    }
}
