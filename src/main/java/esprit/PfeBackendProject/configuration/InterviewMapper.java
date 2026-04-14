package esprit.PfeBackendProject.configuration;


import esprit.PfeBackendProject.dto.InterviewDTO;
import esprit.PfeBackendProject.entity.Interview;
import esprit.PfeBackendProject.entity.InterviewStatus;
import esprit.PfeBackendProject.entity.InterviewType;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Component
public class InterviewMapper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Convert Entity to DTO
     */
    public InterviewDTO toDTO(Interview entity) {
        if (entity == null) {
            return null;
        }

        return InterviewDTO.builder()
                .id(entity.getId())
                .candidateId(entity.getCandidateId())
                .candidateName(entity.getCandidateName())
                .candidateEmail(entity.getCandidateEmail())
                .candidatePhone(entity.getCandidatePhone())
                .position(entity.getPosition())
                .department(entity.getDepartment())
                .date(entity.getDate())
                .time(entity.getTime())
                .duration(entity.getDuration())
                .type(entity.getType() != null ? entity.getType().getValue() : null)
                .status(entity.getStatus() != null ? entity.getStatus().getLabel() : null)
                .jury(entity.getJury())
                .juryIds(entity.getJuryIds())
                .juryEmails(entity.getJuryEmails())
                .meetLink(entity.getMeetLink())
                .room(entity.getRoom())
                .location(entity.getLocation())
                .notes(entity.getNotes())
                .requirements(entity.getRequirements())
                .attachments(mapAttachmentsToDTO(entity))
                .evaluationCriteria(mapCriteriaToDTO(entity))
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt() != null ?
                        entity.getCreatedAt().format(DATETIME_FORMATTER) : null)
                .updatedAt(entity.getUpdatedAt() != null ?
                        entity.getUpdatedAt().format(DATETIME_FORMATTER) : null)
                .build();
    }

    /**
     * Convert DTO to Entity
     */
    public Interview toEntity(InterviewDTO dto) {
        if (dto == null) {
            return null;
        }

        return Interview.builder()
                .id(dto.getId())
                .candidateId(dto.getCandidateId())
                .candidateName(dto.getCandidateName())
                .candidateEmail(dto.getCandidateEmail())
                .candidatePhone(dto.getCandidatePhone())
                .position(dto.getPosition())
                .department(dto.getDepartment())
                .date(dto.getDate())
                .time(dto.getTime())
                .duration(dto.getDuration())
                .type(dto.getType() != null ? InterviewType.fromValue(dto.getType()) : null)
                .status(dto.getStatus() != null ? InterviewStatus.fromLabel(dto.getStatus()) : null)
                .jury(dto.getJury())
                .juryIds(dto.getJuryIds())
                .juryEmails(dto.getJuryEmails())
                .meetLink(dto.getMeetLink())
                .room(dto.getRoom())
                .location(dto.getLocation())
                .notes(dto.getNotes())
                .requirements(dto.getRequirements())
                .attachments(mapAttachmentsToEntity(dto))
                .evaluationCriteria(mapCriteriaToEntity(dto))
                .createdBy(dto.getCreatedBy())
                .build();
    }

    /**
     * Map attachments to DTO
     */
    private java.util.List<InterviewDTO.AttachmentDTO> mapAttachmentsToDTO(Interview entity) {
        if (entity.getAttachments() == null) {
            return null;
        }

        return entity.getAttachments().stream()
                .map(att -> InterviewDTO.AttachmentDTO.builder()
                        .id(att.getId())
                        .name(att.getName())
                        .url(att.getUrl())
                        .type(att.getType())
                        .size(att.getSize())
                        .uploadedBy(att.getUploadedBy())
                        .uploadedAt(att.getUploadedAt() != null ?
                                att.getUploadedAt().format(DATETIME_FORMATTER) : null)
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Map attachments to Entity
     */
    private java.util.List<Interview.Attachment> mapAttachmentsToEntity(InterviewDTO dto) {
        if (dto.getAttachments() == null) {
            return null;
        }

        return dto.getAttachments().stream()
                .map(att -> Interview.Attachment.builder()
                        .id(att.getId())
                        .name(att.getName())
                        .url(att.getUrl())
                        .type(att.getType())
                        .size(att.getSize())
                        .uploadedBy(att.getUploadedBy())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Map evaluation criteria to DTO
     */
    private java.util.List<InterviewDTO.EvaluationCriteriaDTO> mapCriteriaToDTO(Interview entity) {
        if (entity.getEvaluationCriteria() == null) {
            return null;
        }

        return entity.getEvaluationCriteria().stream()
                .map(crit -> InterviewDTO.EvaluationCriteriaDTO.builder()
                        .id(crit.getId())
                        .criterion(crit.getCriterion())
                        .weight(crit.getWeight())
                        .description(crit.getDescription())
                        .category(crit.getCategory())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Map evaluation criteria to Entity
     */
    private java.util.List<Interview.EvaluationCriteria> mapCriteriaToEntity(InterviewDTO dto) {
        if (dto.getEvaluationCriteria() == null) {
            return null;
        }

        return dto.getEvaluationCriteria().stream()
                .map(crit -> Interview.EvaluationCriteria.builder()
                        .id(crit.getId())
                        .criterion(crit.getCriterion())
                        .weight(crit.getWeight())
                        .description(crit.getDescription())
                        .category(crit.getCategory())
                        .build())
                .collect(Collectors.toList());
    }
}