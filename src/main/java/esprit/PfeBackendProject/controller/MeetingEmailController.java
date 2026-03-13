package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.dto.EmailGenerateResponse;
import esprit.PfeBackendProject.dto.EmailRequest;
import esprit.PfeBackendProject.dto.EmailSendRequest;
import esprit.PfeBackendProject.service.EmailSenderService;
import esprit.PfeBackendProject.service.EmailService;
import esprit.PfeBackendProject.service.MeetingEmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/meeting-email")
@RequiredArgsConstructor
@Tag(name = "Meeting Email", description = "Génération IA et envoi d'emails d'entretien")
public class MeetingEmailController {

    private final MeetingEmailService meetingEmailService;
    private final EmailSenderService emailSenderService;




        @PostMapping("/sendEmail")
        public ResponseEntity<?> send(@RequestBody EmailSendRequest request) {
            emailSenderService.send(
                    request.getRecipientEmail(),
                    request.getConfirmedSubject(),
                    request.getConfirmedBody()
            );
            return ResponseEntity.ok("message envoi avec succes");
        }

    @PostMapping("/generate")
    @Operation(summary = "Générer un email via Gemini AI (sans envoyer)")
    public ResponseEntity<EmailGenerateResponse> generate(
            @RequestBody EmailRequest request) {

        EmailGenerateResponse response = meetingEmailService.generatePreview(request);
        return ResponseEntity.ok(response);
    }

//    @PostMapping("/send")
//    @Operation(summary = "Envoyer l'email confirmé par l'utilisateur")
//    public ResponseEntity<String> send(
//            @RequestBody EmailSendRequest sendRequest) {
//
//        String result = meetingEmailService.sendConfirmed(sendRequest);
//        return ResponseEntity.ok(result);
//    }
}