package esprit.PfeBackendProject.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import lombok.Data;
import java.util.Set;

@Data
@Document(collection = "permissions")
@CompoundIndex(name = "role_unique", def = "{'role': 1}", unique = true)
public class Permission {

    @Id
    private String id;

    private String role;
    private Set<String> menuItemIds;
}
