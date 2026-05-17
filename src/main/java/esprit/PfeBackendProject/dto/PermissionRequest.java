package esprit.PfeBackendProject.dto;

import lombok.Data;

import java.util.Set;

@Data
class PermissionRequest {
    private String role;
    private Set<String> menuItemIds;
}
