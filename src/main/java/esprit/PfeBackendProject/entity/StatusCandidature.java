package esprit.PfeBackendProject.entity;

public enum StatusCandidature {

    SOUMISE,            // Candidature déposée par le candidat

    ANALYSEE,           // Analyse IA terminée

    PRESELECTIONNEE,    // Retenue après scoring
    REJETEE,            // Refusée après analyse ou décision RH

    ENTETIEN_PLANIFIE,  // Entretien programmé
    ENTETIEN_EN_COURS,  // Entretien en cours
    ENTETIEN_TERMINE,   // Entretien terminé

    ACCEPTEE,           // Décision finale positive
    REFUSEE
}
