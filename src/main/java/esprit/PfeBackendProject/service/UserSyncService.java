package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserSyncService {

    private final UserRepository userRepository;



    public User syncUser(Jwt jwt) {

        String keycloakId = jwt.getSubject();

        return userRepository.findByKeycloakId(keycloakId)
                .orElseGet(() -> {
                    User user = new User();
                    user.setKeycloakId(keycloakId);
                    user.setEmail(jwt.getClaim("email"));
                    user.setFirstName(jwt.getClaim("given_name"));
                    user.setLastName(jwt.getClaim("family_name"));
                    Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                    if (realmAccess != null) {
                        List<String> roles = (List<String>) realmAccess.get("roles");
                        user.setRole(roles.get(0));
                    }
                    return userRepository.save(user);
                });
    }
}
