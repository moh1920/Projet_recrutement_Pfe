package esprit.PfeBackendProject.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "CategorieDeSelection")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategorieDeSelection {

    @Id
    private String id ;

    private String nom ;
    private String description ;

    private Float poids ;


}
