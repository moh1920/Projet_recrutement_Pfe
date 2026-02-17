package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.UserDetais;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserDetaisRepository extends MongoRepository<UserDetais,String> {
}
