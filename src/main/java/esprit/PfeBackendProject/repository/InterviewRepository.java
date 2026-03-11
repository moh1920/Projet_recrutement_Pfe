package esprit.PfeBackendProject.repository;

// InterviewRepository.java

import esprit.PfeBackendProject.entity.Interview;
import esprit.PfeBackendProject.entity.InterviewStatus;
import esprit.PfeBackendProject.entity.InterviewType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;



@Repository
public interface InterviewRepository extends MongoRepository<Interview, String> {

    // Find by status
    List<Interview> findByStatus(InterviewStatus status);

    // Find by type
    List<Interview> findByType(InterviewType type);

    // Find by date
    List<Interview> findByDate(LocalDate date);
    List<Interview> findByCandidateEmail(String email);

    // Find by date range
    List<Interview> findByDateBetween(LocalDate startDate, LocalDate endDate);

    // Find by candidate
    List<Interview> findByCandidateId(String candidateId);
    List<Interview> findByCandidateNameContainingIgnoreCase(String candidateName);

    // Find by position
    List<Interview> findByPositionContainingIgnoreCase(String position);

    // Find by department
    List<Interview> findByDepartment(String department);

    // Find by jury member
    @Query("{ 'juryIds': ?0 }")
    List<Interview> findByJuryMemberId(String juryMemberId);

    @Query("{ 'juryIds': { $in: ?0 } }")
    List<Interview> findByJuryMemberIds(List<String> juryMemberIds);

    // Find by date and status
    List<Interview> findByDateAndStatus(LocalDate date, InterviewStatus status);

    // Find upcoming interviews (today and future)
    @Query("{ 'date': { $gte: ?0 }, 'status': { $ne: 'ANNULE' } }")
    List<Interview> findUpcoming(LocalDate fromDate);

    // Find today's interviews
    @Query("{ 'date': ?0, 'status': { $ne: 'ANNULE' } }")
    List<Interview> findTodayInterviews(LocalDate today);

    // Find by room and date (for conflict detection)
    @Query("{ 'room': ?0, 'date': ?1, 'status': { $ne: 'ANNULE' } }")
    List<Interview> findByRoomAndDate(String room, LocalDate date);

    // Count by status
    long countByStatus(InterviewStatus status);

    // Count by type
    long countByType(InterviewType type);

    // Count by date range
    long countByDateBetween(LocalDate startDate, LocalDate endDate);

    // Complex query for filtering
    @Query("{ " +
            "$and: [ " +
            "  { $or: [ { 'status': { $exists: false } }, { 'status': { $in: ?0 } } ] }, " +
            "  { $or: [ { 'type': { $exists: false } }, { 'type': { $in: ?1 } } ] }, " +
            "  { $or: [ { 'date': { $exists: false } }, { 'date': { $gte: ?2, $lte: ?3 } } ] } " +
            "] }")
    List<Interview> findWithFilters(
            List<InterviewStatus> statuses,
            List<InterviewType> types,
            LocalDate dateFrom,
            LocalDate dateTo
    );
}