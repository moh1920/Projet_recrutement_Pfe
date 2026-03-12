package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.entity.RoomMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Gère les participants actifs en mémoire (connexions WebSocket en cours).
 * Distinct du Meeting MongoDB qui persiste les métadonnées.
 */
@Slf4j
@Service
public class RoomManager {

    // roomId → Map<userId, displayName>
    private final Map<String, Map<String, String>> activeRooms = new ConcurrentHashMap<>();

    /** Ajouter un participant à un salon actif */
    public void addParticipant(String roomId, String userId, String displayName) {
        activeRooms
                .computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
                .put(userId, displayName);
        log.info("Participant ajouté → room={}, userId={}", roomId, userId);
    }

    /** Retirer un participant d'un salon */
    public void removeParticipant(String roomId, String userId) {
        Map<String, String> room = activeRooms.get(roomId);
        if (room != null) {
            room.remove(userId);
            if (room.isEmpty()) {
                activeRooms.remove(roomId);
                log.info("Salon supprimé (vide) → room={}", roomId);
            }
        }
    }

    /** Liste des participants actifs dans un salon */
    public List<RoomMessage.ParticipantInfo> getParticipants(String roomId) {
        Map<String, String> room = activeRooms.getOrDefault(roomId, Collections.emptyMap());
        return room.entrySet().stream()
                .map(e -> new RoomMessage.ParticipantInfo(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    /** Vérifie si un userId est dans un salon */
    public boolean isInRoom(String roomId, String userId) {
        return activeRooms.getOrDefault(roomId, Collections.emptyMap()).containsKey(userId);
    }

    /** Nombre de participants dans un salon */
    public int getParticipantCount(String roomId) {
        return activeRooms.getOrDefault(roomId, Collections.emptyMap()).size();
    }

    /** Tous les userId d'un salon (pour cibler les destinataires) */
    public Set<String> getUserIds(String roomId) {
        return activeRooms.getOrDefault(roomId, Collections.emptyMap()).keySet();
    }
}