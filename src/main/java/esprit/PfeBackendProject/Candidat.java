package esprit.PfeBackendProject;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;
@Document(collection = "candidats")
@Data
@Builder
public class Candidat {
    @Id
    private String id;

    // 🔹 Informations personnelles
    private String nom;
    private String email;
    private String telephone;
    private String nationalite;
    private String ville;
    private LocalDate dateNaissance;

    // 🔹 Données académiques
    private String niveauDiplome;      // Licence, Master, Doctorat
    private String specialite;          // IA, BI, Informatique
    private String universite;
    private int anneeDiplome;
    private String gradeAcademique;     // Assistant, Maître assistant
    private List<String> publications;

    // 🔹 Expérience
    private int nbAnneesExperience;
    private boolean experienceAcademique;
    private List<String> institutions;
    private List<String> modulesEnseignes;

    // 🔹 Compétences
    private List<String> langages;
    private List<String> frameworks;
    private List<String> data;
    private List<String> ia;
    private List<String> erp;

    // 🔹 Scores IA
    private double scoreCompetences;
    private double scoreExperience;
    private double scoreGlobal;

    // 🔹 Métadonnées
    private LocalDate dateCandidature;
    private String statut; // EN_ATTENTE, ACCEPTE, REFUSE

}
