package esprit.PfeBackendProject.dto;


import lombok.Data;

@Data
public class EmailRequest {
    private String recipientEmail;
    private String recipientName;
    private String roomCode;        // lien ou code de la salle
    private String meetingDate;     // "15/01/2025"
    private String meetingTime;     // "10:00"
    private String meetingSubject;  // "Poste enseignant Java"
    private String additionalDetails; // optionnel

    // "ONLINE" ou "PRESENTIEL"
    private String interviewType;
    // Si PRESENTIEL → adresse physique
    private String location;
}