package esprit.PfeBackendProject.dto;

import esprit.PfeBackendProject.entity.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {

    private String id; // String au lieu de Long (ObjectId MongoDB)
    private String title;
    private String message;
    private NotificationType type;
    private String link;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}