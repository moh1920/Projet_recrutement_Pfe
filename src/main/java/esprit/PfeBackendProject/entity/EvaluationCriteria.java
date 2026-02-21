package esprit.PfeBackendProject.entity;

// EvaluationCriteria.java (Embedded Document)

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationCriteria {
    private String id;
    private String criterion;
    private Integer weight;
    private String description;
    private String category;
}
