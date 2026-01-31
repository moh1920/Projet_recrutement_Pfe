package esprit.PfeBackendProject.service;

import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KeycloakAdminService {

    private final Keycloak keycloak;

    @Value("${keycloak-admin.realm}")
    private String realm;

    public String createUser(String username, String email, String password, String role) {

        if (!keycloak.realm(realm).users().search(username).isEmpty()) {
            throw new RuntimeException("Utilisateur existe déjà");
        }

        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setEnabled(true);
        user.setEmailVerified(false);

        Response response = keycloak.realm(realm).users().create(user);

        if (response.getStatus() != 201 || response.getLocation() == null) {
            throw new RuntimeException("Erreur Keycloak : " + response.getStatus());
        }

        String userId = response.getLocation().getPath()
                .replaceAll(".*/([^/]+)$", "$1");

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(false);

        keycloak.realm(realm)
                .users()
                .get(userId)
                .resetPassword(credential);

        RoleRepresentation roleRep = keycloak.realm(realm)
                .roles()
                .get(role)
                .toRepresentation();

        keycloak.realm(realm)
                .users()
                .get(userId)
                .roles()
                .realmLevel()
                .add(List.of(roleRep));

        keycloak.realm(realm)
                .users()
                .get(userId)
                .sendVerifyEmail();

        return userId;
    }
}
