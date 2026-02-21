package esprit.PfeBackendProject.entity;

import lombok.Getter;

@Getter
public enum CandidateStatus {
    NOUVEAU("Nouveau"),
    EN_COURS("En cours"),
    ACCEPTE("Accepté"),
    REFUSE("Refusé"),
    EN_ATTENTE("En attente");

    private final String label;

    CandidateStatus(String label) {
        this.label = label;
    }

}