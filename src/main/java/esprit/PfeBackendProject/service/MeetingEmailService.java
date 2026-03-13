package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.dto.EmailGenerateResponse;
import esprit.PfeBackendProject.dto.EmailRequest;
import esprit.PfeBackendProject.dto.EmailSendRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingEmailService {

    private final AiEmailGeneratorService aiEmailGeneratorService;
    private final EmailSenderService emailSenderService;

    // Étape 1 : Générer la prévisualisation via Gemini
    public EmailGenerateResponse generatePreview(EmailRequest request) {
        return aiEmailGeneratorService.generateEmail(request);
    }

    // Étape 2 : Envoyer l'email confirmé et édité par l'utilisateur
    public String sendConfirmed(EmailSendRequest sendRequest) {
        emailSenderService.send(
                sendRequest.getRecipientEmail(),
                sendRequest.getConfirmedSubject(),
                sendRequest.getConfirmedBody()
        );
        return "Email envoyé avec succès à " + sendRequest.getRecipientEmail();
    }
}