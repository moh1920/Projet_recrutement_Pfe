package esprit.PfeBackendProject.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ManualScoreResult {
    private String candidatId;
    private String offreId;
    private Float scoreFinal;
    private Map<String, Float> detailParCritere; // nom critère → note donnée
    private String appreciation;
    private String evaluateurId;
    private LocalDateTime evaluatedAt;
}