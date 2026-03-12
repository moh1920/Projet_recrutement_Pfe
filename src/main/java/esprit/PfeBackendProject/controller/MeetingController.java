package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.entity.Meeting;
import esprit.PfeBackendProject.service.MeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API REST pour créer/rejoindre les salons.
 * Protégé par votre Keycloak OAuth2 existant.
 */
@RestController
@RequestMapping("/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    /** Créer un nouveau salon */
    @PostMapping("/create")
    public ResponseEntity<Meeting> createMeeting(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String hostId = jwt.getSubject(); // userId Keycloak
        String title  = body.getOrDefault("title", "Réunion sans titre");

        Meeting meeting = meetingService.createMeeting(hostId, title);
        return ResponseEntity.ok(meeting);
    }

    /** Vérifier qu'un salon existe avant de rejoindre */
    @GetMapping("/check/{roomCode}")
    public ResponseEntity<Meeting> checkRoom(@PathVariable String roomCode) {
        try {
            Meeting meeting = meetingService.findByRoomCode(roomCode);
            return ResponseEntity.ok(meeting);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}