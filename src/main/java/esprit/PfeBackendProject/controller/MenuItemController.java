package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.dto.MenuItemDTO;
import esprit.PfeBackendProject.entity.MenuItem;
import esprit.PfeBackendProject.service.MenuItemService;
import esprit.PfeBackendProject.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("menu")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;
    private final PermissionService permissionService;

    // -------------------------------------------------------
    // GET /api/menu/tree
    // Retourne l'arbre complet (admin uniquement)
    // -------------------------------------------------------
    @GetMapping("/tree")
    public ResponseEntity<List<MenuItemDTO>> getFullTree() {
        return ResponseEntity.ok(menuItemService.getFullTree());
    }

    // -------------------------------------------------------
    // GET /api/menu/sidebar
    // Retourne le sidebar filtré selon le rôle de l'utilisateur connecté
    // -------------------------------------------------------
    @GetMapping("/sidebar")
    public ResponseEntity<List<MenuItemDTO>> getSidebar(Authentication authentication) {

        // Cast pour accéder aux claims Keycloak
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) authentication;
        Jwt jwt = jwtAuth.getToken();

        // Extraire realm_access.roles depuis le token
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        List<String> roles = (List<String>) realmAccess.getOrDefault("roles", List.of());

        // Prendre le premier rôle (ou adapter selon ta logique)
        String role = roles.stream()
                .filter(r -> !r.startsWith("default-") &&
                        !r.equals("offline_access") &&
                        !r.equals("uma_authorization"))
                .findFirst()
                .orElse("");

        Set<String> allowedIds = permissionService.getAllowedMenuItemIds(role);
        return ResponseEntity.ok(menuItemService.getFilteredTree(allowedIds));
    }

    // -------------------------------------------------------
    // GET /api/menu/items  — liste plate pour l'interface admin
    // -------------------------------------------------------
    @GetMapping("/items")

    public ResponseEntity<List<MenuItem>> getAllItems() {
        return ResponseEntity.ok(menuItemService.findAll());
    }

    // -------------------------------------------------------
    // POST /api/menu/items  — créer un item
    // -------------------------------------------------------
    @PostMapping("/items")

    public ResponseEntity<MenuItem> createItem(@RequestBody MenuItem item) {
        return ResponseEntity.ok(menuItemService.save(item));
    }

    // -------------------------------------------------------
    // PUT /api/menu/items/{id}  — modifier un item
    // -------------------------------------------------------
    @PutMapping("/items/{id}")

    public ResponseEntity<MenuItem> updateItem(@PathVariable String id, @RequestBody MenuItem item) {
        item.setId(id);
        return ResponseEntity.ok(menuItemService.save(item));
    }

    // -------------------------------------------------------
    // DELETE /api/menu/items/{id}  — supprimer un item
    // -------------------------------------------------------
    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        menuItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}


