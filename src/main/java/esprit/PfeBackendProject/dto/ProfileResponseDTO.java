package esprit.PfeBackendProject.dto;


import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;


@Setter
@Getter
public class ProfileResponseDTO {

    private String id;
    private String userId;

    // Informations Personnelles
    private String nom;
    private String email;
    private String telephone;
    private String nationalite;
    private String ville;
    private String dateNaissance;

    // Formation Académique
    private String niveauDiplome;
    private String specialite;
    private String universite;
    private int anneeDiplome;
    private String gradeAcademique;

    // Expérience Professionnelle
    private int nbAnneesExperience;
    private boolean experienceAcademique;
    private List<String> institutions;
    private List<String> modulesEnseignes;

    // Compétences Techniques
    private List<String> langages;
    private List<String> frameworks;
    private List<String> dataSkills;
    private List<String> iaSkills;
    private List<String> erpSkills;

    // Compétences Pédagogiques
    private List<String> methodesEnseignement;
    private boolean encadrement;
    private boolean innovationPedagogique;

    // Soft Skills
    private int communication;
    private int leadership;
    private int espritEquipe;
    private String motivation;

    // Documents
    private String cvPath;
    private List<String> document ;

    private Map<String,String> certificatsPath;

    // Métadonnées
    private String dateCreationProfil;
    private String dateDerniereMiseAJour;

}