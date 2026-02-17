package esprit.PfeBackendProject.dto;


import esprit.PfeBackendProject.entity.StatusUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

    private String id;

    // Infos User
    private String keycloakId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;

    // Infos UserDetails
    private String department;
    private StatusUser statusUser;
    private LocalDate dateDeCreation;
    private String phone;

    private String fullName;
}
