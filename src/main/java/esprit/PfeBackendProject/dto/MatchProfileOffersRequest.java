package esprit.PfeBackendProject.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import esprit.PfeBackendProject.entity.Offre;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class MatchProfileOffersRequest {

    @JsonProperty("profile")
    private ProfileResponseDTO profile;

    @JsonProperty("offers")
    private List<Offre> offers;
}
