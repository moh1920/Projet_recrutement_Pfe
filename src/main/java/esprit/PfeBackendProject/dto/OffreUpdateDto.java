package esprit.PfeBackendProject.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class OffreUpdateDto {

    private String titre;
    private String description;
    private String departement;
    private String specialite;

    private String typePoste;
    private Integer chargeHoraire;
    private String niveauRequis;

    private List<String> modules;

    private Integer minAnneesExperience;
    private Boolean experienceAcademique;
    private List<String> competencesRequises;

    private LocalDate dateExpiration;
    private String statut;
}
