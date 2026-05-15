package esprit.PfeBackendProject.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

// EvaluationRequest.java
@Data
public class EvaluationRequest {
    private String offreId;
    private String candidatId;
    private Map<String, List<String>> categoriesSatisfaites;
}