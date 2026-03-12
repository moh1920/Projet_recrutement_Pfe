package esprit.PfeBackendProject.configuration;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Sécurité WebSocket : valide le token Keycloak lors du CONNECT STOMP.
 *
 * Côté Angular, envoyer le token dans le header CONNECT :
 *   const headers = { Authorization: 'Bearer ' + keycloakToken };
 *   client.connect(headers, ...);
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtDecoder jwtDecoder; // Fourni automatiquement par votre config Keycloak OAuth2

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                // Valider uniquement à la connexion STOMP
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            // Décoder et valider avec Keycloak (via votre JwtDecoder existant)
                            Jwt jwt = jwtDecoder.decode(token);
                            JwtAuthenticationToken authentication =
                                    new JwtAuthenticationToken(jwt);
                            accessor.setUser(authentication);
                        } catch (Exception e) {
                            throw new IllegalArgumentException("Token Keycloak invalide : " + e.getMessage());
                        }
                    }
                }
                return message;
            }
        });
    }
}