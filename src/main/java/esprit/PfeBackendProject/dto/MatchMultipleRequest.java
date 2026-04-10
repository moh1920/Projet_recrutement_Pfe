package esprit.PfeBackendProject.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class MatchMultipleRequest {

    @JsonProperty("offerId")
    private String offerId;

    @JsonProperty("offer")
    private Object offer;

    @JsonProperty("pairs")
    private List<CandidateProfilePair> pairs;
}