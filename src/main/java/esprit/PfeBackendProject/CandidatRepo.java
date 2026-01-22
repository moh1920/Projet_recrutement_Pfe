package esprit.PfeBackendProject;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface CandidatRepo extends MongoRepository<Candidat,Long> {
}
