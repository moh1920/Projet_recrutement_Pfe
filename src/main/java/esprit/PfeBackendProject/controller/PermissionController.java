package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.entity.Permission;
import esprit.PfeBackendProject.service.PermissionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    // -------------------------------------------------------
    // GET /api/permissions
    // Toutes les permissions (pour affichage admin)
    // -------------------------------------------------------
    @GetMapping
    public ResponseEntity<List<Permission>> getAll() {
        return ResponseEntity.ok(permissionService.findAll());
    }

    // -------------------------------------------------------
    // GET /api/permissions/{role}
    // Permissions d'un rôle spécifique
    // -------------------------------------------------------
    @GetMapping("/{role}")
    public ResponseEntity<Permission> getByRole(@PathVariable String role) {
        return permissionService.findByRole(role)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------
    // POST /api/permissions
    // Sauvegarder ou remplacer les permissions d'un rôle
    // Body: { "role": "RH", "menuItemIds": ["id1", "id2", ...] }
    // -------------------------------------------------------
    @PostMapping
    public ResponseEntity<Permission> saveOrUpdate(@RequestBody PermissionRequest request) {
        Permission saved = permissionService.saveOrUpdate(request.getRole(), request.getMenuItemIds());
        return ResponseEntity.ok(saved);
    }

    // -------------------------------------------------------
    // DELETE /api/permissions/{role}
    // Supprimer toutes les permissions d'un rôle
    // -------------------------------------------------------
    @DeleteMapping("/{role}")
    public ResponseEntity<Void> deleteByRole(@PathVariable String role) {
        permissionService.deleteByRole(role);
        return ResponseEntity.noContent().build();
    }

    // DTO interne
    @Data
    static class PermissionRequest {
        private String role;
        private Set<String> menuItemIds;
    }
}
