package esprit.PfeBackendProject.dto;

import lombok.Data;

import java.util.List;

@Data
public class CvExtractionDTO {

    private String nom;
    private String email;
    private String telephone;

    private String niveauDiplome;
    private String specialite;
    private String universite;
    private Integer anneeDiplome;
    private String gradeAcademique;

    private Integer nbAnneesExperience;
    private Boolean experienceAcademique;
    private List<String> institutions;
    private List<String> modulesEnseignes;

    private CompetenceDTO competences;
    }
