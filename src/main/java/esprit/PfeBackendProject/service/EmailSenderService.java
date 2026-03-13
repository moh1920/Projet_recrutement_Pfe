package esprit.PfeBackendProject.service;


import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSenderService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void send(String toEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, false); // false = texte brut (pas HTML)

            mailSender.send(message);
            log.info(" Email envoyé avec succès à : {}", toEmail);

        } catch (Exception e) {
            log.error(" Erreur envoi email à {} : {}", toEmail, e.getMessage());
            throw new RuntimeException("Échec de l'envoi : " + e.getMessage());
        }
    }
}