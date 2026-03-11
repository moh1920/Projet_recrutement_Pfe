package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.dto.UserDTO;
import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.entity.UserDetais;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserDetaisRepository extends MongoRepository<UserDetais,String> {

  //  Optional<UserDTO> findByKeycloakId(String keycloakId);


}
