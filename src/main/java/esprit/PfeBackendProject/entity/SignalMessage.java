package esprit.PfeBackendProject.entity;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Message de signalisation WebRTC (SDP offer/answer, ICE candidates).
 * Transporté via WebSocket, jamais persisté en base.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessage {

    /**
     * Type du signal :
     *  "offer"         → SDP Offer de l'initiateur
     *  "answer"        → SDP Answer du répondant
     *  "ice-candidate" → Candidat ICE réseau
     */
    private String type;

    private String roomId;

    /** ID Keycloak de l'expéditeur */
    private String senderId;

    /** ID Keycloak du destinataire (ciblage P2P) */
    private String targetId;

    /**
     * Payload :
     *  - offer/answer  : { type: string, sdp: string }
     *  - ice-candidate : { candidate: string, sdpMid: string, sdpMLineIndex: number }
     */
    private Object data;
}