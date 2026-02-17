package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User,String> {
    Optional<User> findByKeycloakId(String keycloakId);

}
