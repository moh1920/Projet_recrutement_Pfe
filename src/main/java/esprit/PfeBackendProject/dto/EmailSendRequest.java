package esprit.PfeBackendProject.dto;



import lombok.Data;

@Data
public class EmailSendRequest {
    // Données originales du formulaire
    private String recipientEmail;
    private String recipientName;
    // Email édité par l'utilisateur après prévisualisation
    private String confirmedSubject;
    private String confirmedBody;
}
