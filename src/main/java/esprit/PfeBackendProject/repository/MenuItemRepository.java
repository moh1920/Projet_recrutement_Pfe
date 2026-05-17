package esprit.PfeBackendProject.repository;


import esprit.PfeBackendProject.entity.MenuItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MenuItemRepository extends MongoRepository<MenuItem, String> {

    List<MenuItem> findAllByOrderBySortOrderAsc();

    List<MenuItem> findByParentIdIsNullOrderBySortOrderAsc();

    List<MenuItem> findByParentIdOrderBySortOrderAsc(String parentId);
}