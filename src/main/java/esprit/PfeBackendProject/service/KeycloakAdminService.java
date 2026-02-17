package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.dto.CreateUserRequest;
import esprit.PfeBackendProject.dto.UserDTO;
import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.entity.UserDetais;
import esprit.PfeBackendProject.repository.UserDetaisRepository;
import esprit.PfeBackendProject.repository.UserRepository;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KeycloakAdminService {

    private final Keycloak keycloak;
    private final UserDetaisRepository userDetaisRepository;
    private final UserRepository userRepository;

    @Value("${keycloak-admin.realm}")
    private String realm;

    @Transactional
    public UserDTO createUser(CreateUserRequest request) {

        // 🔎 Vérifier existence dans Keycloak
        if (!keycloak.realm(realm).users().search(request.getUserName()).isEmpty()) {
            throw new RuntimeException("Utilisateur existe déjà dans Keycloak");
        }

        // 1️⃣ Création Keycloak
        UserRepresentation user = new UserRepresentation();
        user.setUsername(request.getUserName());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setEnabled(true);
        user.setEmailVerified(false);

        Response response = keycloak.realm(realm).users().create(user);

        if (response.getStatus() != 201 || response.getLocation() == null) {
            throw new RuntimeException("Erreur Keycloak : " + response.getStatus());
        }

        String keycloakId = response.getLocation().getPath()
                .replaceAll(".*/([^/]+)$", "$1");

        // 2️⃣ Définir mot de passe
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        credential.setTemporary(false);

        keycloak.realm(realm)
                .users()
                .get(keycloakId)
                .resetPassword(credential);

        // 3️⃣ Assigner rôle
        RoleRepresentation roleRep = keycloak.realm(realm)
                .roles()
                .get(request.getRole())
                .toRepresentation();

        keycloak.realm(realm)
                .users()
                .get(keycloakId)
                .roles()
                .realmLevel()
                .add(List.of(roleRep));

        // 4️⃣ Envoyer mail vérification
        keycloak.realm(realm)
                .users()
                .get(keycloakId)
                .sendVerifyEmail();

        // ===============================
        // 🔥 Partie MongoDB
        // ===============================

        // 5️⃣ Créer UserDetais
        UserDetais details = UserDetais.builder()
                .department(request.getDepartment())
                .phone(request.getPhone())
                .statusUser(request.getStatusUser())
                .dateDeCreation(LocalDate.now())
                .build();

        details = userDetaisRepository.save(details);

        // 6️⃣ Créer User
        User newUser = User.builder()
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .keycloakId(keycloakId)
                .idDetaisUsers(details.getId())
                .build();

        newUser = userRepository.save(newUser);

        // 7️⃣ Retourner DTO
        return UserDTO.builder()
                .id(newUser.getId())
                .email(newUser.getEmail())
                .firstName(newUser.getFirstName())
                .lastName(newUser.getLastName())
                .role(newUser.getRole())
                .department(details.getDepartment())
                .phone(details.getPhone())
                .statusUser(details.getStatusUser())
                .dateDeCreation(details.getDateDeCreation())
                .fullName(newUser.getFirstName() + " " + newUser.getLastName())
                .build();
    }
}
