package esprit.PfeBackendProject.repository;



import esprit.PfeBackendProject.entity.Meeting;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeetingRepository extends MongoRepository<Meeting, String> {

    Optional<Meeting> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);
}
