package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.entity.Permission;
import esprit.PfeBackendProject.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;

    // -------------------------------------------------------
    // Récupère les IDs autorisés pour un rôle donné
    // -------------------------------------------------------
    public Set<String> getAllowedMenuItemIds(String role) {
        return permissionRepository.findByRole(role)
                .map(Permission::getMenuItemIds)
                .orElse(Collections.emptySet());
    }

    // -------------------------------------------------------
    // Récupère toutes les permissions (pour l'interface admin)
    // -------------------------------------------------------
    public List<Permission> findAll() {
        return permissionRepository.findAll();
    }

    // -------------------------------------------------------
    // Récupère les permissions d'un rôle spécifique
    // -------------------------------------------------------
    public Optional<Permission> findByRole(String role) {
        return permissionRepository.findByRole(role);
    }

    // -------------------------------------------------------
    // Sauvegarde ou met à jour les permissions d'un rôle
    // -------------------------------------------------------
    public Permission saveOrUpdate(String role, Set<String> menuItemIds) {
        Permission permission = permissionRepository.findByRole(role)
                .orElse(new Permission());
        permission.setRole(role);
        permission.setMenuItemIds(menuItemIds);
        return permissionRepository.save(permission);
    }

    // -------------------------------------------------------
    // Supprime toutes les permissions d'un rôle
    // -------------------------------------------------------
    public void deleteByRole(String role) {
        permissionRepository.deleteByRole(role);
    }

    // -------------------------------------------------------
    // Ajoute un item à un rôle
    // -------------------------------------------------------
    public Permission addMenuItem(String role, String menuItemId) {
        Permission permission = permissionRepository.findByRole(role)
                .orElseGet(() -> {
                    Permission p = new Permission();
                    p.setRole(role);
                    p.setMenuItemIds(new HashSet<>());
                    return p;
                });
        permission.getMenuItemIds().add(menuItemId);
        return permissionRepository.save(permission);
    }

    // -------------------------------------------------------
    // Retire un item d'un rôle
    // -------------------------------------------------------
    public Permission removeMenuItem(String role, String menuItemId) {
        Permission permission = permissionRepository.findByRole(role)
                .orElseThrow(() -> new RuntimeException("Permission not found for role: " + role));
        permission.getMenuItemIds().remove(menuItemId);
        return permissionRepository.save(permission);
    }
}