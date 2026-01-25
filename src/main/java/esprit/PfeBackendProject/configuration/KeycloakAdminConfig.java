package esprit.PfeBackendProject.configuration;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakAdminConfig {

    @Bean
    public Keycloak keycloakAdmin(
            @Value("${keycloak-admin.server-url}") String serverUrl,
            @Value("${keycloak-admin.username}") String username,
            @Value("${keycloak-admin.password}") String password,
            @Value("${keycloak-admin.client-id}") String clientId
    ) {
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm("master")        // 🔥 OBLIGATOIRE
                .clientId(clientId)     // admin-cli
                .username(username)     // spring-admin
                .password(password)
                .grantType(OAuth2Constants.PASSWORD)
                .build();
    }

}
