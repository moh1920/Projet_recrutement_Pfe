package esprit.PfeBackendProject.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import esprit.PfeBackendProject.dto.EmailGenerateResponse;
import esprit.PfeBackendProject.dto.EmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiEmailGeneratorService {

    private final ChatLanguageModel chatLanguageModel;

    private static final String SIGNATURE = """

            Cordialement,

            Service des Ressources Humaines
            ESPRIT — École Supérieure Privée d'Ingénierie et de Technologies
            2 Rue de l'Artisanat, Cité Ghazala, Ariana 2083, Tunisie
            Tél : +216 71 857 000
            Email : rh@esprit.tn
            Web : www.esprit.tn
            """;

    public EmailGenerateResponse generateEmail(EmailRequest request) {
        log.info("Génération email IA pour : {}", request.getRecipientEmail());

        try {
            String aiParagraphs = callGeminiForParagraphs(request);

            String fullBody = assembleEmail(request, aiParagraphs);

            String subject = buildSubject(request);

            log.info("Email assemblé avec succès pour : {}", request.getRecipientEmail());

            return new EmailGenerateResponse(
                    subject,
                    fullBody,
                    request.getRecipientEmail(),
                    formatName(request.getRecipientName())
            );

        } catch (RuntimeException e) {
            log.error("Erreur Gemini : {}", e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("timeout")) {
                throw new RuntimeException("Gemini timeout — réessayez dans quelques secondes.");
            }
            throw new RuntimeException("Erreur IA : " + e.getMessage());
        }
    }

    // =============================================
    // Gemini rédige UNIQUEMENT 3 paragraphes courts
    // =============================================
    private String callGeminiForParagraphs(EmailRequest request) {

        boolean isOnline = "ONLINE".equalsIgnoreCase(request.getInterviewType());

        String conseilPratique = isOnline
                ? "Conseiller de rejoindre la salle 5 minutes avant et de vérifier micro/caméra."
                : "Conseiller d'arriver 10 minutes avant avec une pièce d'identité valide.";

        String details = (request.getAdditionalDetails() != null
                && !request.getAdditionalDetails().isBlank())
                ? request.getAdditionalDetails()
                : "aucun document particulier requis";

        String prompt = """
                Tu es RH senior à ESPRIT Tunisie. Rédige EXACTEMENT 3 paragraphes en français soutenu.

                Candidat : %s
                Poste : %s
                Type : %s

                PARAGRAPHE 1 (2 phrases) : Introduction chaleureuse sur la candidature et l'invitation à l'entretien.
                PARAGRAPHE 2 (1-2 phrases) : %s
                PARAGRAPHE 3 (1-2 phrases) : Mentionner "%s" puis demander confirmation sous 48h.

                RÈGLES :
                - Vouvoiement obligatoire
                - Pas de markdown, pas de signature, pas de formule de politesse
                - Pas de récapitulatif (il sera ajouté automatiquement)
                - Répondre UNIQUEMENT avec les 3 paragraphes, rien d'autre

                FORMAT :
                P1: [paragraphe 1]
                P2: [paragraphe 2]
                P3: [paragraphe 3]
                """.formatted(
                request.getRecipientName(),
                request.getMeetingSubject(),
                "ONLINE".equalsIgnoreCase(request.getInterviewType()) ? "en ligne" : "en présentiel",
                conseilPratique,
                details
        );

        return chatLanguageModel.generate(prompt);
    }

    // =============================================
    // Java assemble l'email COMPLET
    // Le bloc récapitulatif est 100% garanti
    // =============================================
    private String assembleEmail(EmailRequest request, String aiParagraphs) {

        boolean isOnline = "ONLINE".equalsIgnoreCase(request.getInterviewType());

        // Parser les paragraphes générés par Gemini
        String p1 = extractParagraph(aiParagraphs, "P1");
        String p2 = extractParagraph(aiParagraphs, "P2");
        String p3 = extractParagraph(aiParagraphs, "P3");

        // Formule d'appel
        String formattedName = formatName(request.getRecipientName());
        String appelFormule = buildAppelFormule(formattedName);

        // Bloc récapitulatif construit en Java — 100% garanti
        String blocRecap = buildBlocRecap(request, isOnline);

        // Formule de politesse
        String politesse = buildPolitesse(formattedName);

        // Assemblage final
        return appelFormule + "\n\n"
                + p1 + "\n\n"
                + blocRecap + "\n"
                + p2 + "\n\n"
                + p3 + "\n\n"
                + politesse
                + SIGNATURE;
    }

    // =============================================
    // Bloc récapitulatif construit en Java
    // =============================================
    private String buildBlocRecap(EmailRequest request, boolean isOnline) {
        StringBuilder recap = new StringBuilder();
        recap.append("Voici le récapitulatif de votre entretien :\n\n");
        recap.append("  - Date            : ").append(request.getMeetingDate()).append("\n");
        recap.append("  - Heure           : ").append(request.getMeetingTime()).append("\n");

        if (isOnline) {
            recap.append("  - Type            : Entretien en ligne par visioconférence\n");
            recap.append("  - Plateforme      : ").append(detectPlatform(request.getRoomCode())).append("\n");
            recap.append("  - Lien / Code     : ").append(request.getRoomCode()).append("\n");
        } else {
            recap.append("  - Type            : Entretien en présentiel\n");
            recap.append("  - Lieu / Adresse  : ").append(request.getLocation()).append("\n");
        }

        recap.append("\n");
        return recap.toString();
    }

    // =============================================
    // Sujet de l'email
    // =============================================
    private String buildSubject(EmailRequest request) {
        boolean isOnline = "ONLINE".equalsIgnoreCase(request.getInterviewType());
        String type = isOnline ? "EN LIGNE" : "PRÉSENTIEL";
        return "Convocation à un entretien de recrutement ["
                + type + "] — "
                + request.getMeetingSubject()
                + " — ESPRIT";
    }

    // =============================================
    // Formule d'appel
    // =============================================
    private String buildAppelFormule(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Madame, Monsieur,";
        String[] parts = fullName.trim().split("\\s+");
        // Heuristique : prénom féminin courant
        String[] prenomsF = {"sarra", "nour", "ines", "rim", "amira", "fatma",
                "mariem", "rania", "manel", "yasmine", "sarah"};
        String prenom = parts[0].toLowerCase();
        for (String pf : prenomsF) {
            if (prenom.equals(pf)) return "Madame " + fullName + ",";
        }
        return "Monsieur " + fullName + ",";
    }

    // =============================================
    // Formule de politesse
    // =============================================
    private String buildPolitesse(String fullName) {
        String civilite = "Monsieur";
        String[] prenomsF = {"sarra", "nour", "ines", "rim", "amira", "fatma",
                "mariem", "rania", "manel", "yasmine", "sarah"};
        if (fullName != null) {
            String prenom = fullName.split("\\s+")[0].toLowerCase();
            for (String pf : prenomsF) {
                if (prenom.equals(pf)) { civilite = "Madame"; break; }
            }
        }
        return "Dans l'attente de vous rencontrer, nous vous prions d'agréer, "
                + civilite
                + ", l'expression de nos salutations distinguées.";
    }

    // =============================================
    // Extraire P1 / P2 / P3 de la réponse Gemini
    // =============================================
    private String extractParagraph(String response, String tag) {
        try {
            String marker = tag + ":";
            int start = response.indexOf(marker);
            if (start == -1) {
                // Fallback si Gemini n'a pas respecté le format
                String[] parts = response.split("\n\n");
                int idx = tag.equals("P1") ? 0 : tag.equals("P2") ? 1 : 2;
                return idx < parts.length ? parts[idx].trim() : "";
            }
            start += marker.length();
            // Chercher le prochain tag ou fin de texte
            String nextTag = tag.equals("P1") ? "P2:" : tag.equals("P2") ? "P3:" : null;
            int end = nextTag != null ? response.indexOf(nextTag, start) : response.length();
            if (end == -1) end = response.length();
            return response.substring(start, end).trim();
        } catch (Exception e) {
            log.warn("Parsing paragraphe {} échoué", tag);
            return "";
        }
    }

    // =============================================
    // Détection plateforme
    // =============================================
    private String detectPlatform(String roomCode) {
        if (roomCode == null || roomCode.isBlank()) return "Salle de réunion en ligne";
        String lower = roomCode.toLowerCase();
        if (lower.contains("jit.si"))        return "Jitsi Meet";
        if (lower.contains("teams"))         return "Microsoft Teams";
        if (lower.contains("zoom"))          return "Zoom";
        if (lower.contains("meet.google"))   return "Google Meet";
        if (lower.contains("webex"))         return "Cisco Webex";
        return "Salle de réunion en ligne";
    }

    // =============================================
    // Capitaliser le nom
    // =============================================
    private String formatName(String name) {
        if (name == null || name.isBlank()) return name;
        String[] parts = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                sb.append(Character.toUpperCase(part.charAt(0)))
                        .append(part.substring(1).toLowerCase())
                        .append(" ");
            }
        }
        return sb.toString().trim();
    }
}
