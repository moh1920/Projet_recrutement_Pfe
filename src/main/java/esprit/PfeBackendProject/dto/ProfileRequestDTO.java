package esprit.PfeBackendProject.dto;


import io.swagger.v3.oas.annotations.servers.Server;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.Set;


@Getter
@Setter
public
class ProfileRequestDTO {

    private String userId;

    // ── Informations Personnelles ──────────────────
    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String nom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le téléphone est obligatoire")
    @Pattern(regexp = "^[+]?[0-9\\s\\-]{8,20}$", message = "Format de téléphone invalide")
    private String telephone;

    @NotBlank(message = "La nationalité est obligatoire")
    private String nationalite;

    @NotBlank(message = "La ville est obligatoire")
    private String ville;

    @NotBlank(message = "La date de naissance est obligatoire")
    private String dateNaissance;

    // ── Formation Académique ───────────────────────
    @NotBlank(message = "Le niveau de diplôme est obligatoire")
    private String niveauDiplome;

    @NotBlank(message = "La spécialité est obligatoire")
    private String specialite;

    @NotBlank(message = "L'université est obligatoire")
    private String universite;

    @Min(value = 1950, message = "Année de diplôme invalide")
    @Max(value = 2100, message = "Année de diplôme invalide")
    private int anneeDiplome;

    private String gradeAcademique;

    // ── Expérience Professionnelle ─────────────────
    @Min(value = 0, message = "Le nombre d'années d'expérience ne peut pas être négatif")
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
    @Min(1) @Max(10)
    private int communication;

    @Min(1) @Max(10)
    private int leadership;

    @Min(1) @Max(10)
    private int espritEquipe;

    @NotBlank(message = "La lettre de motivation est obligatoire")
    @Size(min = 50, message = "La motivation doit contenir au moins 50 caractères")
    private String motivation;

    // ── Documents ─────────────────────────────────
    private String cvPath;
    private List<String> document ;

    private Map<String,String> certificatsPath;




}