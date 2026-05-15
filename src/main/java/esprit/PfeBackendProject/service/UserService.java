package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.configuration.UserMapper;
import esprit.PfeBackendProject.dto.UserDTO;
import esprit.PfeBackendProject.entity.StatusUser;
import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.entity.UserDetais;
import esprit.PfeBackendProject.repository.UserDetaisRepository;
import esprit.PfeBackendProject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository ;
    private final UserMapper userMapper ;
    private final UserDetaisRepository userDetaisRepository ;
    private final KeycloakAdminService keycloakAdminService ;


    public List<UserDTO> getAllUser() {

        List<User> users = userRepository.findAll()
                .stream()
                .filter(user -> !"CANDIDAT".equals(user.getRole()))
                .toList();

        List<String> detailsIds = users.stream()
                .map(User::getIdDetaisUsers)
                .toList();

        Map<String, UserDetais> detailsMap =
                userDetaisRepository.findAllById(detailsIds)
                        .stream()
                        .collect(Collectors.toMap(UserDetais::getId, d -> d));

        return users.stream()
                .map(user -> {
                    UserDetais details = detailsMap.get(user.getIdDetaisUsers());

                    // Récupérer le statut depuis Keycloak
                    StatusUser status = keycloakAdminService.getStatusFromKeycloak(user.getKeycloakId());

                    // Mettre à jour le statut en BDD si différent (optionnel)
                    if (details != null && !status.equals(details.getStatusUser())) {
                        details.setStatusUser(status);
                        userDetaisRepository.save(details);
                    }

                    return userMapper.mapToDTOWithStatus(user, details, status);
                })
                .toList();
    }

    public UserDTO getUserById(String keycloakId){
         User user = userRepository.findByKeycloakId(keycloakId).orElseThrow(() -> new RuntimeException("user not found"));
         UserDetais userDetais =  userDetaisRepository.findById(user.getIdDetaisUsers()).orElse(null);
         return userMapper.mapToDTO(user,userDetais);

    }


    public UserDTO updateUser(String keycloakId, UserDTO userDTO) {
        // Find existing user
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update User entity fields
        if (userDTO.getEmail() != null) user.setEmail(userDTO.getEmail());
        if (userDTO.getFirstName() != null) user.setFirstName(userDTO.getFirstName());
        if (userDTO.getLastName() != null) user.setLastName(userDTO.getLastName());
        if (userDTO.getRole() != null) user.setRole(userDTO.getRole());

        userRepository.save(user);

        // Update UserDetais entity fields
        UserDetais userDetais;
        if (user.getIdDetaisUsers() != null) {
            // Details already exist → fetch and update
            userDetais = userDetaisRepository.findById(user.getIdDetaisUsers())
                    .orElseThrow(() -> new RuntimeException("UserDetais not found"));

            if (userDTO.getDepartment() != null) userDetais.setDepartment(userDTO.getDepartment());
            if (userDTO.getStatusUser() != null) userDetais.setStatusUser(userDTO.getStatusUser());
            if (userDTO.getPhone() != null) userDetais.setPhone(userDTO.getPhone());

        } else {
            // Details don't exist yet → create new
            userDetais = new UserDetais();
            userDetais.setDepartment(userDTO.getDepartment());
            userDetais.setStatusUser(userDTO.getStatusUser());
            userDetais.setPhone(userDTO.getPhone());
            userDetais.setDateDeCreation(LocalDate.now());
        }

        userDetais = userDetaisRepository.save(userDetais);
        user.setIdDetaisUsers(userDetais.getId()); // ✅ use saved ID, not DTO id
        userRepository.save(user);                 // ✅ persist the new reference

        return userMapper.mapToDTO(user, userDetais);
    }

    public void updateStatusUser(String id, StatusUser status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getIdDetaisUsers() == null) {
            throw new RuntimeException("UserDetais not found for this user");
        }

        UserDetais userDetais = userDetaisRepository.findById(user.getIdDetaisUsers())
                .orElseThrow(() -> new RuntimeException("UserDetais not found"));

        userDetais.setStatusUser(status);
        userDetaisRepository.save(userDetais);
    }






}
