package esprit.PfeBackendProject.dto;

import lombok.Data;

import java.util.Set;

@Data
class PermissionDTO {
    private String id;
    private String role;
    private Set<String> menuItemIds;
}