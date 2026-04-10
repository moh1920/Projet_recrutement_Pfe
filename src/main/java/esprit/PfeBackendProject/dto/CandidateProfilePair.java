package esprit.PfeBackendProject.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class CandidateProfilePair {

    @JsonProperty("candidateId")
    private String candidateId;

    @JsonProperty("candidate")
    private Object candidate;

    @JsonProperty("profile")
    private Object profile;

    public CandidateProfilePair(Object candidate, Object profile) {
        this.candidate = candidate;
        this.profile = profile;

        // Extraire l'ID du candidat automatiquement
        if (candidate instanceof esprit.PfeBackendProject.dto.CandidateDTO c) {
            this.candidateId = c.getId();
        } else if (candidate instanceof esprit.PfeBackendProject.entity.Candidate c) {
            this.candidateId = c.getId();
        }
    }
}