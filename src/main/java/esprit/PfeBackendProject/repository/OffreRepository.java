package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.Offre;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OffreRepository extends MongoRepository<Offre,String> {
}
