package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.ProfileDetails;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProfileRepository extends MongoRepository<ProfileDetails,String> {

    Optional<ProfileDetails> findByUserId(String userId);
}
