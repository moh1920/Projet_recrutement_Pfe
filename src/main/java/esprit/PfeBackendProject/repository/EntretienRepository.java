package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.Entretien;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface EntretienRepository extends MongoRepository<Entretien,String> {
}
