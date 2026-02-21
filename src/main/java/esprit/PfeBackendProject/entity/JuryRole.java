package esprit.PfeBackendProject.entity;

import lombok.Getter;

@Getter
public enum JuryRole {
    PRESIDENT("Président"),
    MEMBRE("Membre"),
    OBSERVATEUR("Observateur"),
    EXPERT("Expert");

    private final String label;

    JuryRole(String label) {
        this.label = label;
    }

}