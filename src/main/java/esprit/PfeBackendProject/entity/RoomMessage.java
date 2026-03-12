package esprit.PfeBackendProject.entity;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Événements de gestion du salon (join/leave/list).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomMessage {

    /**
     * "user-joined" → un participant a rejoint
     * "user-left"   → un participant a quitté
     * "user-list"   → liste complète envoyée au nouvel arrivant
     * "room-full"   → salon plein (max participants atteint)
     * "host-ended"  → l'hôte a mis fin au meeting
     */
    private String type;

    private String roomId;
    private String userId;
    private String displayName;

    private List<ParticipantInfo> participants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private String userId;
        private String displayName;
    }
}