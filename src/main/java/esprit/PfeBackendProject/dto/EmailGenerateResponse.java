package esprit.PfeBackendProject.dto;



import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmailGenerateResponse {
    private String subject;
    private String body;
    private String recipientEmail;
    private String recipientName;
}
