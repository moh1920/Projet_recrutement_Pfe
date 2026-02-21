package esprit.PfeBackendProject.entity;

import lombok.Getter;

@Getter
public enum InterviewStatus {
    PLANIFIE("Planifié"),
    EN_COURS("En cours"),
    TERMINE("Terminé"),
    ANNULE("Annulé");

    private final String label;

    InterviewStatus(String label) {
        this.label = label;
    }

    public static InterviewStatus fromLabel(String label) {
        for (InterviewStatus status : values()) {
            if (status.label.equalsIgnoreCase(label)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown status: " + label);
    }
}