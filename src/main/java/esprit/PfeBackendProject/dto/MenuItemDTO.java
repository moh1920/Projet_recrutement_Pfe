package esprit.PfeBackendProject.dto;

import lombok.Data;

import java.util.List;

@Data
public class MenuItemDTO {
    private String id;
    private String label;
    private String icon;
    private String route;
    private String parentId;
    private int sortOrder;
    private boolean active;
    private List<MenuItemDTO> children;
}