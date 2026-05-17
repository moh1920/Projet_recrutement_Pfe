package esprit.PfeBackendProject.dto;

import lombok.Data;

@Data
class MenuItemRequest {
    private String label;
    private String icon;
    private String route;
    private String parentId;
    private int sortOrder;
    private boolean active = true;
}