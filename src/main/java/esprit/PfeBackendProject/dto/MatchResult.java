package esprit.PfeBackendProject.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Setter
@Getter
public class MatchResult {

    @JsonProperty("offerId")
    private String offerId;

    @JsonProperty("candidateId")
    private String candidateId;

    @JsonProperty("globalScore")
    private double globalScore;

    @JsonProperty("details")
    private Map<String, Object> details;
}