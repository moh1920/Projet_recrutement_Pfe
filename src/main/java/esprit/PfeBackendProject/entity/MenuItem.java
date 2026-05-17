package esprit.PfeBackendProject.entity;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.util.List;

@Data
@Document(collection = "menu_items")
public class MenuItem {

    @Id
    private String id;

    private String label;
    private String icon;
    private String route;          // null si item parent (avec enfants)
    private String parentId;       // null = item racine
    private int sortOrder;
    private boolean active = true;

    // Champ transient : rempli à la volée (non stocké en DB)
    // pour retourner l'arbre complet au frontend
    private List<MenuItem> children;
}