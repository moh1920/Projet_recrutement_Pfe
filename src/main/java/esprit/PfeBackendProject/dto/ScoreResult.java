package esprit.PfeBackendProject.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

// ScoreResult.java
@Data
@Builder
public class ScoreResult {
    private String candidatId;
    private String offreId;
    private Float scoreFinal;
    private Map<String, Float> scoreParCritere; // détail par critère
    private String appreciation;        // "Excellent", "Bon", "Insuffisant"
}