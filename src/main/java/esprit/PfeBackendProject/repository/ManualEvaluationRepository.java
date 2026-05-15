package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.ManualEvaluation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ManualEvaluationRepository
        extends MongoRepository<ManualEvaluation, String> {

    List<ManualEvaluation> findByOffreId(String offreId);
    Optional<ManualEvaluation> findByCandidatId(String candidatId);
    Optional<ManualEvaluation> findByOffreIdAndCandidatId(String offreId, String candidatId);
    boolean existsByOffreIdAndCandidatId(String offreId, String candidatId);
}