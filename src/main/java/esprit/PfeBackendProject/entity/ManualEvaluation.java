package esprit.PfeBackendProject.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "ManualEvaluations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualEvaluation {
    @Id
    private String id;
    private String offreId;
    private String candidatId;
    private String evaluateurId;

    private Map<String, Float> noteParCritere; // criteresId → note
    private Float scoreFinal;
    private String appreciation;
    private LocalDateTime createdAt;
}
