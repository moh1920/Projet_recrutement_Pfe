package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.entity.RoomMessage;
import esprit.PfeBackendProject.entity.SignalMessage;
import esprit.PfeBackendProject.service.MeetingService;
import esprit.PfeBackendProject.service.RoomManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

/**
 * Contrôleur de signalisation WebRTC.
 *
 * Flux :
 *  1. Angular envoie /app/meeting.join
 *  2. Spring relaie les événements → /topic/room/{roomId}
 *  3. Angular envoie /app/meeting.signal (SDP / ICE)
 *  4. Spring relaie le signal → /queue/signal/{targetId}
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MeetingService meetingService;
    private final RoomManager roomManager;

    // ─────────────────────────────────────────────────────────────
    // 1. REJOINDRE UN SALON
    // ─────────────────────────────────────────────────────────────
    @MessageMapping("/meeting.join")
    public void joinRoom(@Payload SignalMessage message, Principal principal) {
        String userId   = extractUserId(principal);
        String userName = extractUserName(principal);
        String roomId   = message.getRoomId();

        log.info("JOIN → room={}, userId={}, name={}", roomId, userId, userName);

        // Mettre à jour MongoDB
        try {
            meetingService.joinMeeting(roomId, userId);
        } catch (RuntimeException e) {
            log.error("Erreur joinMeeting : {}", e.getMessage());
            return;
        }

        // Enregistrer dans le gestionnaire en mémoire
        roomManager.addParticipant(roomId, userId, userName);

        // 1a. Envoyer au nouvel arrivant la liste des participants existants
        List<RoomMessage.ParticipantInfo> currentParticipants = roomManager.getParticipants(roomId)
                .stream()
                .filter(p -> !p.getUserId().equals(userId)) // Exclure soi-même
                .toList();

        RoomMessage userListMsg = RoomMessage.builder()
                .type("user-list")
                .roomId(roomId)
                .userId(userId)
                .participants(currentParticipants)
                .build();

        // Envoyer uniquement au nouvel arrivant (via queue privée)
        messagingTemplate.convertAndSendToUser(userId, "/queue/meeting", userListMsg);

        // 1b. Notifier tous les autres participants qu'un nouveau a rejoint
        RoomMessage joinMsg = RoomMessage.builder()
                .type("user-joined")
                .roomId(roomId)
                .userId(userId)
                .displayName(userName)
                .participants(roomManager.getParticipants(roomId))
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + roomId, joinMsg);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. SIGNAL WebRTC (SDP Offer / Answer / ICE Candidate)
    // ─────────────────────────────────────────────────────────────
    @MessageMapping("/meeting.signal")
    public void handleSignal(@Payload SignalMessage message, Principal principal) {
        String senderId = extractUserId(principal);
        message.setSenderId(senderId); // Forcer l'ID depuis le token Keycloak (sécurité)

        log.debug("SIGNAL {} → from={}, to={}", message.getType(), senderId, message.getTargetId());

        // Relayer le signal UNIQUEMENT au destinataire ciblé
        messagingTemplate.convertAndSendToUser(
                message.getTargetId(),
                "/queue/signal",
                message
        );
    }

    // ─────────────────────────────────────────────────────────────
    // 3. QUITTER UN SALON
    // ─────────────────────────────────────────────────────────────
    @MessageMapping("/meeting.leave")
    public void leaveRoom(@Payload SignalMessage message, Principal principal) {
        String userId = extractUserId(principal);
        String roomId = message.getRoomId();

        log.info("LEAVE → room={}, userId={}", roomId, userId);

        roomManager.removeParticipant(roomId, userId);
        meetingService.leaveMeeting(roomId, userId);

        RoomMessage leaveMsg = RoomMessage.builder()
                .type("user-left")
                .roomId(roomId)
                .userId(userId)
                .participants(roomManager.getParticipants(roomId))
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + roomId, leaveMsg);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS : extraire les infos du token Keycloak
    // ─────────────────────────────────────────────────────────────
    private String extractUserId(Principal principal) {
        if (principal instanceof JwtAuthenticationToken jwtToken) {
            // "sub" = subject = userId dans Keycloak
            return jwtToken.getToken().getSubject();
        }
        return principal.getName();
    }

    private String extractUserName(Principal principal) {
        if (principal instanceof JwtAuthenticationToken jwtToken) {
            // "preferred_username" = nom dans Keycloak
            String name = jwtToken.getToken().getClaimAsString("preferred_username");
            return name != null ? name : jwtToken.getToken().getSubject();
        }
        return principal.getName();
    }
}