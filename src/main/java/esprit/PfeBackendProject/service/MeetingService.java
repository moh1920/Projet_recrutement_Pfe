package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.entity.Meeting;
import esprit.PfeBackendProject.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;

    /** Créer un nouveau salon de réunion */
    public Meeting createMeeting(String hostId, String title) {
        String roomCode = generateUniqueRoomCode();

        Meeting meeting = Meeting.builder()
                .roomCode(roomCode)
                .hostId(hostId)
                .title(title)
                .status(Meeting.MeetingStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .build();

        Meeting saved = meetingRepository.save(meeting);
        log.info("Meeting créé : roomCode={}, hostId={}", roomCode, hostId);
        return saved;
    }

    /** Rejoindre un salon existant */
    public Meeting joinMeeting(String roomCode, String userId) {
        Meeting meeting = meetingRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Salon introuvable : " + roomCode));

        if (meeting.getStatus() == Meeting.MeetingStatus.ENDED) {
            throw new RuntimeException("Ce meeting est terminé");
        }

        if (!meeting.getParticipantIds().contains(userId)) {
            meeting.getParticipantIds().add(userId);

            // Démarrer le meeting si c'est le premier participant
            if (meeting.getStatus() == Meeting.MeetingStatus.WAITING) {
                meeting.setStatus(Meeting.MeetingStatus.ACTIVE);
                meeting.setStartedAt(LocalDateTime.now());
            }

            meetingRepository.save(meeting);
        }

        return meeting;
    }

    /** Quitter / terminer un salon */
    public void leaveMeeting(String roomCode, String userId) {
        meetingRepository.findByRoomCode(roomCode).ifPresent(meeting -> {
            meeting.getParticipantIds().remove(userId);

            // Si l'hôte quitte → terminer le meeting
            if (userId.equals(meeting.getHostId())) {
                meeting.setStatus(Meeting.MeetingStatus.ENDED);
                meeting.setEndedAt(LocalDateTime.now());
            }

            meetingRepository.save(meeting);
        });
    }

    public Meeting findByRoomCode(String roomCode) {
        return meetingRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Salon introuvable : " + roomCode));
    }

    private String generateUniqueRoomCode() {
        String code;
        do {
            // Code lisible de type "ABC-123"
            code = UUID.randomUUID().toString().substring(0, 3).toUpperCase()
                    + "-"
                    + UUID.randomUUID().toString().substring(0, 3).toUpperCase();
        } while (meetingRepository.existsByRoomCode(code));
        return code;
    }
}