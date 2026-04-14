package esprit.PfeBackendProject.service;

import ch.qos.logback.classic.Logger;
import esprit.PfeBackendProject.dto.CreateUserRequest;
import esprit.PfeBackendProject.dto.UserDTO;
import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.entity.UserDetais;
import esprit.PfeBackendProject.repository.UserDetaisRepository;
import esprit.PfeBackendProject.repository.UserRepository;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class
KeycloakAdminService {

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
        user.setEmailVerified(true);

        Response response = keycloak.realm(realm).users().create(user);
        String responseBody = response.readEntity(String.class);
        log.info("Keycloak status: " + response.getStatus());
        log.info("Keycloak body: " + responseBody);

        if (response.getStatus() != 201 || response.getLocation() == null) {
            throw new RuntimeException("Erreur Keycloak " + response.getStatus() + " : " + responseBody);
        }

        String keycloakId = response.getLocation().getPath()
                .replaceAll(".*/([^/]+)$", "$1");

        // 2️⃣ Définir mot de passe
        try {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(request.getPassword());
            credential.setTemporary(false);
            keycloak.realm(realm).users().get(keycloakId).resetPassword(credential);
        } catch (Exception e) {
            log.info("Erreur mot de passe : " + e.getMessage());
        }

        // 3️⃣ Assigner rôle ✅ protégé
        try {
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
        } catch (Exception e) {
            log.error("Rôle introuvable : " + request.getRole());
        }



        // 5️⃣ Créer UserDetais MongoDB
        UserDetais details = UserDetais.builder()
                .department(request.getDepartment())
                .phone(request.getPhone())
                .statusUser(request.getStatusUser())
                .dateDeCreation(LocalDate.now())
                .build();
        details = userDetaisRepository.save(details);

        // 6️⃣ Créer User MongoDB
        User newUser = User.builder()
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .keycloakId(keycloakId)
                .idDetaisUsers(details.getId())
                .build();
        newUser = userRepository.save(newUser);
log.info("✅ User sauvegardé MongoDB id: " + newUser.getId());

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
    @Transactional
    public List<UserDTO> syncUsersFromMongo() {
        List<User> allUsers = userRepository.findAll();
        List<UserDTO> synced = new ArrayList<>();

        for (User user : allUsers) {
            if (shouldSyncUser(user)) {
                UserDTO dto = syncSingleUser(user);
                if (dto != null) {
                    synced.add(dto);
                }
            }
        }

        return synced;
    }

    private boolean shouldSyncUser(User user) {
        if (user.getEmail() == null) return false;

        List<UserRepresentation> existing = keycloak.realm(realm)
                .users()
                .search(null, null, null, user.getEmail(), 0, 1);

        return existing.isEmpty();
    }

    private UserDTO syncSingleUser(User user) {
        UserRepresentation kcUser = buildKeycloakUser(user);
        Response response = keycloak.realm(realm).users().create(kcUser);

        if (response.getStatus() != 201 || response.getLocation() == null) {
            return null;
        }

        String newKeycloakId = response.getLocation().getPath()
                .replaceAll(".*/([^/]+)$", "$1");

        assignTemporaryPassword(newKeycloakId);
        assignRole(newKeycloakId, user.getRole());
        sendVerificationEmail(newKeycloakId, user.getEmail());

        user.setKeycloakId(newKeycloakId);
        userRepository.save(user);

        return buildUserDTO(user);
    }

    private UserRepresentation buildKeycloakUser(User user) {
        UserRepresentation kcUser = new UserRepresentation();
        kcUser.setEmail(user.getEmail());
        kcUser.setFirstName(user.getFirstName());
        kcUser.setLastName(user.getLastName());
        kcUser.setUsername(user.getEmail());
        kcUser.setEnabled(true);
        kcUser.setEmailVerified(false);
        return kcUser;
    }

    private void assignTemporaryPassword(String keycloakId) {
        CredentialRepresentation cred = new CredentialRepresentation();
        cred.setType(CredentialRepresentation.PASSWORD);
        cred.setValue("Temp1234!");
        cred.setTemporary(true);
        keycloak.realm(realm).users().get(keycloakId).resetPassword(cred);
    }

    private void assignRole(String keycloakId, String role) {
        if (role == null) return;
        try {
            RoleRepresentation roleRep = keycloak.realm(realm)
                    .roles().get(role).toRepresentation();
            keycloak.realm(realm).users().get(keycloakId)
                    .roles().realmLevel().add(List.of(roleRep));
        } catch (Exception e) {
            log.error("Rôle introuvable : {}", role);
        }
    }

    private void sendVerificationEmail(String keycloakId, String email) {
        try {
            keycloak.realm(realm).users().get(keycloakId).sendVerifyEmail();
        } catch (Exception e) {
            log.error("Email de vérification non envoyé pour {} : {}", email, e.getMessage());
        }
    }

    private UserDTO buildUserDTO(User user) {
        UserDetais details = null;
        if (user.getIdDetaisUsers() != null) {
            details = userDetaisRepository.findById(user.getIdDetaisUsers()).orElse(null);
        }

        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .department(details != null ? details.getDepartment() : null)
                .phone(details != null ? details.getPhone() : null)
                .statusUser(details != null ? details.getStatusUser() : null)
                .dateDeCreation(details != null ? details.getDateDeCreation() : null)
                .fullName(user.getFirstName() + " " + user.getLastName())
                .build();
    }
}
