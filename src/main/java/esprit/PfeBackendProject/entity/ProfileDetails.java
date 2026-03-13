package esprit.PfeBackendProject.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "profile_details")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileDetails {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    // ── Informations Personnelles ──────────────────
    private String nom;

    @Indexed(unique = true)
    private String email;

    private String telephone;
    private String nationalite;
    private String ville;
    private String dateNaissance;

    // ── Formation Académique ───────────────────────
    private String niveauDiplome;
    private String specialite;
    private String universite;
    private int anneeDiplome;
    private String gradeAcademique;

    // ── Expérience Professionnelle ─────────────────
    private int nbAnneesExperience;
    private boolean experienceAcademique;
    private List<String> institutions;
    private List<String> modulesEnseignes;

    // ── Compétences Techniques ─────────────────────
    private List<String> langages;
    private List<String> frameworks;
    private List<String> dataSkills;
    private List<String> iaSkills;
    private List<String> erpSkills;

    // ── Compétences Pédagogiques ───────────────────
    private List<String> methodesEnseignement;
    private boolean encadrement;
    private boolean innovationPedagogique;

    // ── Soft Skills ────────────────────────────────
    private int communication;
    private int leadership;
    private int espritEquipe;
    private String motivation;

    // ── Documents ─────────────────────────────────
    private String cvPath;
    private List<String> document ;
    @Builder.Default
    private Map<String, String> certificatsPath = new HashMap<>();

    // ── Métadonnées ────────────────────────────────
    private LocalDateTime dateCreationProfil;
    private LocalDateTime dateDerniereMiseAJour;
}
