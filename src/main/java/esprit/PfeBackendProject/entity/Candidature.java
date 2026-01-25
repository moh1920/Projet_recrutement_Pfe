package esprit.PfeBackendProject.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Document(collection = "candidatures")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Candidature {

    @Id
    private String id;

    /* =======================
       Lien User / Keycloak
       ======================= */
    private String userId;
    private String keycloakId;

    /* =======================
       Identification
       ======================= */
    private String nom;
    private String email;
    private String telephone;
    private String nationalite;
    private String ville;
    private LocalDate dateNaissance;

    /* =======================
       Formation académique
       ======================= */
    private String niveauDiplome;
    private String specialite;
    private String universite;
    private Integer anneeDiplome;
    private String gradeAcademique;

    /* =======================
       Expérience professionnelle
       ======================= */
    private Integer nbAnneesExperience;
    private Boolean experienceAcademique;
    private List<String> institutions;
    private List<String> modulesEnseignes;
    private String typeContrat;       // Vacataire / Permanent

    /* =======================
       Compétences techniques
       ======================= */
    private List<String> langages;
    private List<String> frameworks;
    private List<String> dataSkills;
    private List<String> iaSkills;
    private List<String> erpSkills;

    /* =======================
       Données pédagogiques
       ======================= */
    private List<String> methodesEnseignement;
    private Boolean encadrement;
    private Boolean innovationPedagogique;

    /* =======================
       Soft skills
       ======================= */
    private Integer communication;
    private Integer leadership;
    private Integer espritEquipe;
    private String motivation;

    /* =======================
       IA & scoring
       ======================= */
    private List<Double> vecteurCv;
    private Double scoreCompetences;
    private Double scoreExperience;
    private Double scoreGlobal;

    /* =======================
       Documents
       ======================= */
    private String cvPath;
    private String lettreMotivationPath;
    private List<String> certificatsPath;

    /* =======================
       Données liées au poste
       ======================= */
    private String posteDemande;
    private String typePoste;
    private String disponibilite;
    private Integer chargeHoraire;
    private Double salaireSouhaite;

    /* =======================
       Workflow RH
       ======================= */
    private String statut;
    private LocalDate dateCandidature;
    private Boolean consentementDonnees;
}
