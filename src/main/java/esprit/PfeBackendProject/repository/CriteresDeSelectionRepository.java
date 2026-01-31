package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.CriteresDeSelection;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CriteresDeSelectionRepository extends MongoRepository<CriteresDeSelection,String> {
}
