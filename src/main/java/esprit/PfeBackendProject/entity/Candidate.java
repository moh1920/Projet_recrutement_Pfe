package esprit.PfeBackendProject.entity;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "candidates")
public class Candidate {

    @Id
    private String id;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    private String resume; // URL
    private String portfolio; // URL
    private String linkedin; // URL

    private Integer experience; // years
    private List<Education> education;
    private List<String> skills;

    private String appliedPosition;
    private LocalDateTime appliedDate;
    private CandidateStatus status;

    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Embedded Class
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Education {
        private String degree;
        private String institution;
        private String field;
        private String startDate;
        private String endDate;
        private Boolean current;
    }

    // Helper method
    public String getFullName() {
        return firstName + " " + lastName;
    }
}