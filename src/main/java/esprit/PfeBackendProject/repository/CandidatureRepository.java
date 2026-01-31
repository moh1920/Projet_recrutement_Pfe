package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.Candidature;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CandidatureRepository extends MongoRepository<Candidature,String> {
}
