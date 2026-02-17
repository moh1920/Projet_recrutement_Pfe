package esprit.PfeBackendProject.service;



import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FastApiService {

    private final RestTemplate restTemplate;

    // URL FastAPI
    private static final String FASTAPI_URL = "http://localhost:8001/extract-cv";

    public FastApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String sendCvToFastApi(MultipartFile file) {

        try {
            // Convert MultipartFile → Resource
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            // Body multipart
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity =
                    new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    FASTAPI_URL,
                    requestEntity,
                    String.class
            );

            return response.getBody();

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'envoi vers FastAPI", e);
        }
    }
}
