package esprit.PfeBackendProject.entity;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Document MongoDB représentant un salon de réunion.
 * Stocke les métadonnées du meeting (participants, statut, dates).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "meetings")
public class Meeting {

    @Id
    private String id;

    /** Code du salon (partagé aux participants pour rejoindre) */
    private String roomCode;

    /** ID Keycloak de l'organisateur */
    private String hostId;

    /** Nom du meeting */
    private String title;

    private MeetingStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    @Builder.Default
    private List<String> participantIds = new ArrayList<>();

    public enum MeetingStatus {
        WAITING,   // En attente que l'hôte démarre
        ACTIVE,    // En cours
        ENDED      // Terminé
    }
}
