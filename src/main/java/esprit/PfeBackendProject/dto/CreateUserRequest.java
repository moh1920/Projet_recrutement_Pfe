package esprit.PfeBackendProject.dto;

import esprit.PfeBackendProject.entity.StatusUser;
import lombok.Data;

@Data
public class CreateUserRequest {
    private String firstName;
    private String userName;
    private String lastName;


    private String email;
    private String password;
    private String role;

    // UserDetais
    private String department;
    private String phone;
    private StatusUser statusUser;
}

