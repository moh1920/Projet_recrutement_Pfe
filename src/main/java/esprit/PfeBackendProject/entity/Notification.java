package esprit.PfeBackendProject.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id; // ObjectId MongoDB → String

    /** ID Keycloak du destinataire */
    @Indexed
    private String recipientId;

    private String title;

    private String message;

    private NotificationType type;

    private String link;

    @Builder.Default
    private boolean read = false;

    @Indexed
    private LocalDateTime createdAt;

    private LocalDateTime readAt;
}
