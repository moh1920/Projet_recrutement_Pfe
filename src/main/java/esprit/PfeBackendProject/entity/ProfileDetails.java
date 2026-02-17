package esprit.PfeBackendProject.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Document(collection = "profile_details")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileDetails {

    @Id
    private String id;


    private String userId;        // MongoDB User id


    private String nom;
    private String email;
    private String telephone;
    private String nationalite;
    private String ville;
    private LocalDate dateNaissance;


    private String niveauDiplome;
    private String specialite;
    private String universite;
    private Integer anneeDiplome;
    private String gradeAcademique;


    private Integer nbAnneesExperience;
    private Boolean experienceAcademique;
    private List<String> institutions;
    private List<String> modulesEnseignes;


    private List<String> langages;
    private List<String> frameworks;
    private List<String> dataSkills;
    private List<String> iaSkills;
    private List<String> erpSkills;

    private List<String> methodesEnseignement;
    private Boolean encadrement;
    private Boolean innovationPedagogique;


    private Integer communication;
    private Integer leadership;
    private Integer espritEquipe;
    private String motivation;


    private String cvPath;
    private List<String> certificatsPath;

    private LocalDate dateCreationProfil;
    private LocalDate dateDerniereMiseAJour;
}
