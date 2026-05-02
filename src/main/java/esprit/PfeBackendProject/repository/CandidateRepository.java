package esprit.PfeBackendProject.repository;


import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.entity.CandidateStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends MongoRepository<Candidate, String> {

    // Find by email
    Optional<Candidate> findByEmail(String email);

    boolean existsByIdProfileAndIdOffre(String idProfile, String idOffre);

    // Find by name
    List<Candidate> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName
    );

    // Find by status
    List<Candidate> findByStatus(CandidateStatus status);
    List<Candidate> findByIdOffre(String idOffre);
    List<Candidate> findByIdProfile(String idProfile);

    // Find by applied position
    List<Candidate> findByAppliedPositionContainingIgnoreCase(String position);

    // Find by skills
    @Query("{ 'skills': { $in: ?0 } }")
    List<Candidate> findBySkills(List<String> skills);

    // Count by status
    long countByStatus(CandidateStatus status);
}