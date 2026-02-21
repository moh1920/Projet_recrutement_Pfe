package esprit.PfeBackendProject.dto;


import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewDTO {

    private String id;

    private String candidateId;

    @NotBlank(message = "Le nom du candidat est obligatoire")
    private String candidateName;

    @Email(message = "Email invalide")
    private String candidateEmail;

    private String candidatePhone;

    @NotBlank(message = "Le poste est obligatoire")
    private String position;

    private String department;

    @NotNull(message = "La date est obligatoire")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @NotNull(message = "L'heure est obligatoire")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime time;

    @NotNull(message = "La durée est obligatoire")
    @Min(value = 15, message = "La durée minimale est de 15 minutes")
    @Max(value = 480, message = "La durée maximale est de 8 heures")
    private Integer duration;

    @NotNull(message = "Le type d'entretien est obligatoire")
    private String type; // Will be converted to InterviewType

    private String status; // Will be converted to InterviewStatus

    @NotEmpty(message = "Au moins un membre du jury est requis")
    private List<String> jury;

    private List<String> juryIds;
    private List<String> juryEmails;

    private String meetLink;
    private String room;
    private String location;
    private String notes;
    private List<String> requirements;

    private List<AttachmentDTO> attachments;
    private List<EvaluationCriteriaDTO> evaluationCriteria;

    private String createdBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private String createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private String updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentDTO {
        private String id;
        private String name;
        private String url;
        private String type;
        private Long size;
        private String uploadedBy;
        private String uploadedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationCriteriaDTO {
        private String id;

        @NotBlank(message = "Le critère est obligatoire")
        private String criterion;

        @Min(0)
        @Max(100)
        private Integer weight;

        private String description;
        private String category;
    }
}