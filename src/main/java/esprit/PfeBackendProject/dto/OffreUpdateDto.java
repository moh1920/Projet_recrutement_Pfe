package esprit.PfeBackendProject.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class OffreUpdateDto {

    // ✅ Noms identiques à ce que le frontend envoie (et à l'entité Offre)
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

    private LocalDate deadline;
    private String status;
}