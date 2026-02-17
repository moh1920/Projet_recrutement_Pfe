package esprit.PfeBackendProject.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Document(collection = "entretiens")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Entretien {

    @Id
    private String id;


    private LocalDate    dateEntretien;
    private LocalDate dateCreation;

    private EtatEntretien etat;

    private String candidatureId;
    private String offreId;

    private List<String> participantsIds;

    private String roomId;          // WebRTC room
    private String lienVisio;       // URL visio

    private Double noteGlobale;
    private String commentaire;

    private String videoPresentationUrl;

    private boolean notificationEnvoyee;
}
