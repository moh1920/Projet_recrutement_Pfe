package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.entity.Offre;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class JobPostingService {

    @Value("${linkedin.api.token}")      // 👈 ajouté
    private String linkedinToken;

    @Value("${linkedin.person.urn}")     // 👈 ajouté
    private String personUrn;

    private final RestTemplate restTemplate = new RestTemplate();  // 👈 ajouté

    public String createDraftAndGetUrl(Offre offre) {
        String url = "https://api.linkedin.com/v2/ugcPosts";

        Map<String, Object> body = new HashMap<>();
        body.put("author", personUrn);
        body.put("lifecycleState", "DRAFT");

        Map<String, Object> shareCommentary = new HashMap<>();
        shareCommentary.put("text", buildPostText(offre));

        Map<String, Object> shareContent = new HashMap<>();
        shareContent.put("shareCommentary", shareCommentary);
        shareContent.put("shareMediaCategory", "NONE");

        Map<String, Object> specificContent = new HashMap<>();
        specificContent.put("com.linkedin.ugc.ShareContent", shareContent);
        body.put("specificContent", specificContent);

        Map<String, Object> visibility = new HashMap<>();
        visibility.put("com.linkedin.ugc.MemberNetworkVisibility", "PUBLIC");
        body.put("visibility", visibility);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(linkedinToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Restli-Protocol-Version", "2.0.0");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            String postId = response.getHeaders().getFirst("x-linkedin-id");
            return "https://www.linkedin.com/feed/?shareActive=true&shareUrn=" + postId;
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Erreur LinkedIn : " + e.getResponseBodyAsString());
        }
    }

    private String buildPostText(Offre offre) {
        return "🚀 Nouvelle offre d'emploi : " + offre.getTitle() + "\n\n"
                + offre.getDescription() + "\n\n"
                + "Type : " + offre.getType() + "\n"
                + "Niveau requis : " + offre.getRequiredLevel() + "\n\n"
                + "Postulez maintenant !\n"
                + "#Recrutement #ESPRIT #Emploi\n"
                + "Réf : " + offre.getId() + " | "
                + java.time.LocalDateTime.now(); // 👈 timestamp unique
    }
    public void publishToLinkedIn(Offre offre) {
        String url = "https://api.linkedin.com/v2/ugcPosts";

        Map<String, Object> body = new HashMap<>();
        body.put("author", personUrn);
        body.put("lifecycleState", "PUBLISHED");

        Map<String, Object> shareCommentary = new HashMap<>();
        shareCommentary.put("text", buildPostText(offre));

        Map<String, Object> shareContent = new HashMap<>();
        shareContent.put("shareCommentary", shareCommentary);
        shareContent.put("shareMediaCategory", "NONE");

        Map<String, Object> specificContent = new HashMap<>();
        specificContent.put("com.linkedin.ugc.ShareContent", shareContent);
        body.put("specificContent", specificContent);

        Map<String, Object> visibility = new HashMap<>();
        visibility.put("com.linkedin.ugc.MemberNetworkVisibility", "PUBLIC");
        body.put("visibility", visibility);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(linkedinToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Restli-Protocol-Version", "2.0.0");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(url, request, String.class);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Erreur LinkedIn : " + e.getResponseBodyAsString());
        }
    }
}