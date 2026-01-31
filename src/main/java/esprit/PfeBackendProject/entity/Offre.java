package esprit.PfeBackendProject.entity;


import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "Offre")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Offre {

    @Id
    private String id;

    private String titre;
    private String description;           // Description détaillée de l’offre
    private String departement;            // Informatique, Génie logiciel, BI...
    private String specialite;             // IA, Data, Cloud, BI...

    //Type de poste
    private String typePoste;              // Permanent / Vacataire
    private Integer chargeHoraire;         // Heures / semaine
    private String niveauRequis;           // Licence / Master / Doctorat

    //Modules à assurer
    private List<String> modules;          // IA, Java, Big Data...

    //Critères de sélection (utilisés par l’IA)
    private Integer minAnneesExperience;
    private Boolean experienceAcademique; // obligatoire ou non
    private List<String> competencesRequises;



    //Dates & statut
    private LocalDate datePublication;
    private LocalDate dateExpiration;
    private String statut;                 // Ouverte / Fermée / En cours

    //Traçabilité
    private String creePar;                // Chef département / CUP
    private LocalDateTime dateCreation;


    @DBRef
    private List<CriteresDeSelection> criteresDeSelections ;


}
