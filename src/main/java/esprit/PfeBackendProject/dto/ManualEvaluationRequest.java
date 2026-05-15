package esprit.PfeBackendProject.dto;

import lombok.Data;

import java.util.Map;

@Data
public class ManualEvaluationRequest {
    private String offreId;
    private String candidatId;
    private String evaluateurId;
    // Map<criteresDeSelectionId, note 0-100>
    private Map<String, Float> noteParCritere;
}