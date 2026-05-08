package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.dto.UserDTO;
import esprit.PfeBackendProject.entity.Offre;
import esprit.PfeBackendProject.entity.StatusUser;
import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.entity.UserDetais;
import esprit.PfeBackendProject.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/userAdminController")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;



    @GetMapping("getAllUser")
    public ResponseEntity<?> getAllUser(
    ) {
        try {
            return ResponseEntity.ok(userService.getAllUser());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des useres" + e.getMessage());
        }
    }


    @GetMapping("getUserById/{keycloakId}")
    public UserDTO getUserById(@PathVariable String keycloakId){
        return userService.getUserById(keycloakId);
    }


    @PutMapping("updateUser/{keycloakId}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable String keycloakId,
            @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(userService.updateUser(keycloakId, userDTO));
    }

    @PutMapping("updateStatusUser/{id}/{status}")
    public void updateStatusUser(@PathVariable String id,@PathVariable StatusUser status) {
        try {
            userService.updateStatusUser(id, status);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

}
