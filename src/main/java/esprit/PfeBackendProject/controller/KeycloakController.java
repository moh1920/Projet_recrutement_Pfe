package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.dto.CreateUserRequest;
import esprit.PfeBackendProject.dto.UserDTO;
import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.service.KeycloakAdminService;
import esprit.PfeBackendProject.service.UserSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class KeycloakController {
    private final UserSyncService userSyncService;

    @GetMapping
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Hello!");
    }

    @GetMapping("/user")
    public ResponseEntity<String> helloUser() {
        return ResponseEntity.ok("Hello From User!");
    }

    @GetMapping("/admin")
    public ResponseEntity<String> helloAdmin() {
        return ResponseEntity.ok("Hello From Admin!");
    }



    @GetMapping("/syncUser")
    public User getAuthenticatedUser(@AuthenticationPrincipal Jwt jwt) {

        return userSyncService.syncUser(jwt);
    }


    private final KeycloakAdminService service;


    @PostMapping("/createUser")
    public ResponseEntity<?> create(@RequestBody CreateUserRequest req) {
        try {
            UserDTO result = service.createUser(req);
            return ResponseEntity.ok("Utilisateur créé dans Keycloak : " + result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/sync")
    public ResponseEntity<List<UserDTO>> syncUsers() {
        return ResponseEntity.ok(service.syncUsersFromMongo());
    }
}