package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.dto.NotificationDTO;
import esprit.PfeBackendProject.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** REST: Récupérer toutes les notifications */
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getMyNotifications(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(jwt.getSubject()));
    }

    /**
     * REST: Marquer une notification comme lue
     * ⚠️ id = String (ObjectId MongoDB), pas Long
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        notificationService.markAsRead(id, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    /** REST: Marquer toutes comme lues */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal Jwt jwt) {
        notificationService.markAllAsRead(jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    /** REST: Compter les non lues */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(notificationService.countUnread(jwt.getSubject()));
    }

    /**
     * REST: Supprimer une notification
     * ⚠️ id = String (ObjectId MongoDB), pas Long
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        notificationService.deleteNotification(id, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    /**
     * WebSocket: Le client signale qu'il a lu une notification
     * Destination STOMP : /app/notification.read
     */
    @MessageMapping("/notification.read")
    public void handleNotificationRead(
            @Payload String notificationId,
            SimpMessageHeaderAccessor headerAccessor) {
        String userId = (String) headerAccessor.getSessionAttributes().get("userId");
        if (userId != null) {
            notificationService.markAsRead(notificationId, userId);
        }
    }

    @PostMapping("/send-info")
    public ResponseEntity<Void> sendInfoNotification(
            @RequestParam String recipientId,
            @RequestParam String title,
            @RequestParam String message) {
        notificationService.sendInfo(recipientId, title, message);
        return ResponseEntity.ok().build();
    }
}