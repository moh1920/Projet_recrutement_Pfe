package esprit.PfeBackendProject.repository;


import esprit.PfeBackendProject.entity.Permission;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PermissionRepository extends MongoRepository<Permission, String> {

    Optional<Permission> findByRole(String role);

    boolean existsByRole(String role);

    void deleteByRole(String role);
}