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

    private String title;
    private String description;
    private String department;
    private String speciality;

    private String type; // Full-Time / Part-Time / Vacataire
    private Integer workload; // chargeHoraire
    private String requiredLevel;

    private List<String> modules;

    private Integer minYearsExperience;
    private Boolean academicExperience;
    private List<String> requiredSkills;

    private LocalDate postedDate;
    private LocalDate deadline;
    private String status;

    private String createdBy;
    private LocalDateTime createdAt;

    private Integer candidateCount;

    @DBRef
    private List<CriteresDeSelection> criteresDeSelections;

}
