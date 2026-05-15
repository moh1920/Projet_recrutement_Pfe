package esprit.PfeBackendProject.configuration;


import esprit.PfeBackendProject.dto.UserDTO;
import esprit.PfeBackendProject.entity.StatusUser;
import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.entity.UserDetais;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UserMapper {

    public UserDTO mapToDTO(User user, UserDetais details) {

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
    public UserDTO mapToDTOWithStatus(User user, UserDetais details, StatusUser statusFromKeycloak) {

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
                .statusUser(statusFromKeycloak)
                .build();
    }


}
