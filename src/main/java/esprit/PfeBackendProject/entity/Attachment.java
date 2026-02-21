package esprit.PfeBackendProject.entity;

// Attachment.java (Embedded Document)

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {
    private String id;
    private String name;
    private String url;
    private String type;
    private Long size;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}