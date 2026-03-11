package esprit.PfeBackendProject.dto;

import esprit.PfeBackendProject.entity.CandidateStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateDTO {

    private String id;
    private String idProfile;
    private String idOffre;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    private String resume;
    private String portfolio;
    private String linkedin;

    private Integer experience;
    private List<EducationDTO> education;
    private List<String> skills;

    private String appliedPosition;
    private LocalDateTime appliedDate;
    private CandidateStatus status;

    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String fullName; // Champ calculé

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationDTO {
        private String degree;
        private String institution;
        private String field;
        private String startDate;
        private String endDate;
        private Boolean current;
    }
}