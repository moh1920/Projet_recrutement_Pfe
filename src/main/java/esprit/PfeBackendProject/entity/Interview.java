package esprit.PfeBackendProject.entity;


import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interviews")
public class Interview {

    @Id
    private String id;

    // Candidate Information
    private String candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;

    // Position Information
    private String position;
    private String department;

    // Schedule Information
    @JsonFormat(pattern = "MM-dd-yyyy")
    private LocalDate date;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime time;
    private Integer duration; // in minutes

    // Interview Type & Status
    private InterviewType type;
    private InterviewStatus status;

    // Jury Information (denormalized for performance)
    private List<String> jury; // Jury member names
    private List<String> juryIds; // Reference to JuryMember IDs
    private List<String> juryEmails;

    // Meeting Details
    private String meetLink;
    private String room;
    private String location;

    // Additional Information
    private String notes;
    private List<String> requirements;

    // Attachments
    private List<Attachment> attachments;

    // Evaluation Criteria
    private List<EvaluationCriteria> evaluationCriteria;

    // Audit Fields
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Embedded Classes
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Attachment {
        private String id;
        private String name;
        private String url;
        private String type; // MIME type
        private Long size; // in bytes
        private String uploadedBy;
        private LocalDateTime uploadedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationCriteria {
        private String id;
        private String criterion;
        private Integer weight; // 0-100
        private String description;
        private String category;
    }
}