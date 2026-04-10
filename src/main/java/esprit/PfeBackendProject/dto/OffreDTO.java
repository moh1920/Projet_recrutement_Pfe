package esprit.PfeBackendProject.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OffreDTO {

    private String id;
    private String title;
    private String description;
    private String department;
    private String speciality;

    private String type;
    private Integer workload;
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

    private List<String> criteresDeSelectionIds; // Only IDs to avoid circular refs
}