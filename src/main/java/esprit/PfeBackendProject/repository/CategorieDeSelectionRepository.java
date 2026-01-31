package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.CategorieDeSelection;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CategorieDeSelectionRepository extends MongoRepository<CategorieDeSelection,String> {
}
