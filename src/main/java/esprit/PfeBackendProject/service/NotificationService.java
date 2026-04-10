package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.dto.NotificationDTO;
import esprit.PfeBackendProject.entity.Notification;
import esprit.PfeBackendProject.entity.NotificationType;
import esprit.PfeBackendProject.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MongoTemplate mongoTemplate; // Pour les updates atomiques MongoDB







    // ─────────────────────────────────────────────
    //  Envoyer une notification (persistée + push)
    // ─────────────────────────────────────────────

    /**
     * Crée une notification, la persiste dans MongoDB et la pousse via WebSocket.
     * Destination WebSocket : /user/{recipientId}/queue/notifications
     */
    public NotificationDTO sendNotification(String recipientId,
                                            String title,
                                            String message,
                                            NotificationType type,
                                            String link) {
        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = toDTO(saved);

        // Push temps réel → /user/{recipientId}/queue/notifications
        messagingTemplate.convertAndSendToUser(recipientId, "/queue/notifications", dto);

        log.info("Notification envoyée à {} : {}", recipientId, title);
        return dto;
    }

    /**
     * Diffuse une notification à TOUS les abonnés.
     * Destination : /topic/notifications/broadcast
     */
    public NotificationDTO broadcastNotification(String title,
                                                 String message,
                                                 NotificationType type,
                                                 String link) {
        Notification notification = Notification.builder()
                .recipientId("BROADCAST")
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = toDTO(saved);

        messagingTemplate.convertAndSend("/topic/notifications/broadcast", dto);
        log.info("Broadcast envoyé : {}", title);
        return dto;
    }

    // ─────────────────────────────────────────────
    //  Raccourcis
    // ─────────────────────────────────────────────

    public void sendInfo(String recipientId, String title, String message) {
        sendNotification(recipientId, title, message, NotificationType.INFO, null);
    }

    public void sendSuccess(String recipientId, String title, String message) {
        sendNotification(recipientId, title, message, NotificationType.SUCCESS, null);
    }

    public void sendWarning(String recipientId, String title, String message) {
        sendNotification(recipientId, title, message, NotificationType.WARNING, null);
    }

    public void sendMeetingNotification(String recipientId, String meetingTitle, String link) {
        sendNotification(
                recipientId,
                "Nouvelle réunion planifiée",
                "Vous avez été invité à : " + meetingTitle,
                NotificationType.MEETING,
                link
        );
    }

    // ─────────────────────────────────────────────
    //  Lecture / gestion
    // ─────────────────────────────────────────────

    public List<NotificationDTO> getNotificationsForUser(String userId) {
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public long countUnread(String userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    /**
     * Marquer une notification comme lue — update atomique MongoDB
     */
    public void markAsRead(String notificationId, String userId) {
        Query query = new Query(
                Criteria.where("id").is(notificationId)
                        .and("recipientId").is(userId)
                        .and("read").is(false)
        );
        Update update = new Update()
                .set("read", true)
                .set("readAt", LocalDateTime.now());

        mongoTemplate.updateFirst(query, update, Notification.class);

        // Mettre à jour le compteur côté client
        long newCount = countUnread(userId);
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/notifications/count",
                newCount
        );
    }

    /**
     * Marquer TOUTES les notifications comme lues — update atomique MongoDB
     */
    public void markAllAsRead(String userId) {
        Query query = new Query(
                Criteria.where("recipientId").is(userId)
                        .and("read").is(false)
        );
        Update update = new Update()
                .set("read", true)
                .set("readAt", LocalDateTime.now());

        mongoTemplate.updateMulti(query, update, Notification.class);

        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/notifications/count",
                0L
        );
    }

    /**
     * Supprimer une notification (vérifie que l'utilisateur en est propriétaire)
     */
    public void deleteNotification(String notificationId, String userId) {
        notificationRepository.findByIdAndRecipientId(notificationId, userId)
                .ifPresent(notificationRepository::delete);
    }

    // ─────────────────────────────────────────────
    //  Mapper
    // ─────────────────────────────────────────────

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .link(n.getLink())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .build();
    }




}