package esprit.PfeBackendProject.repository;


import esprit.PfeBackendProject.entity.JuryMember;
import esprit.PfeBackendProject.entity.JuryRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JuryMemberRepository extends MongoRepository<JuryMember, String> {

    // Find by email
    Optional<JuryMember> findByEmail(String email);

    // Find by name
    List<JuryMember> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName
    );

    // Find by department
    List<JuryMember> findByDepartment(String department);

    // Find by role
    List<JuryMember> findByRole(JuryRole role);

    // Find active members
    List<JuryMember> findByActiveTrue();

    // Find by expertise
    @Query("{ 'expertise': { $in: ?0 } }")
    List<JuryMember> findByExpertise(List<String> expertise);

    // Find available members
    @Query("{ 'active': true, 'availability.available': true }")
    List<JuryMember> findAvailableMembers();
}