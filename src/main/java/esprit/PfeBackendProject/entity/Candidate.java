package esprit.PfeBackendProject.entity;

import jakarta.validation.Valid;
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

    private String idProfile;
    private String idOffre;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    private String resume;    // URL
    private String portfolio; // URL
    private String linkedin;  // URL

    private Integer experience; // years
    private List<Education> education;
    private List<String> skills;

    private String appliedPosition;
    private LocalDateTime appliedDate;
    private CandidateStatus status;

    private List<Step> steps; // ✅ Recruitment pipeline steps

    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ─── Embedded: Education ────────────────────────────────────────────────
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

    // ─── Embedded: Step ─────────────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Step {
        private String name;        // e.g. "Entretien RH"
        private StepStatus status;  // completed | current | pending
        private String date;        // e.g. "14 Mars 2026" (nullable for pending)
        private String icon;        // Material icon name, e.g. "person"
        private String description; // Short description of the step
        private Long score; // Short description of the step
    }

    // ─── Enum: StepStatus ───────────────────────────────────────────────────
    public enum StepStatus {
        completed,
        current,
        pending
    }

    // ─── Helper ─────────────────────────────────────────────────────────────
    public String getFullName() {
        return firstName + " " + lastName;
    }
}