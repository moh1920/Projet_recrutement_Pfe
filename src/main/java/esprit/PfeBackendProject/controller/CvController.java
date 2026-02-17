package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.service.FastApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
public class CvController {

    private final FastApiService fastApiService;



    @PostMapping("/upload")
    public ResponseEntity<?> uploadCv(@RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Fichier CV vide");
        }

        String responseFromIa = fastApiService.sendCvToFastApi(file);

        return ResponseEntity.ok(responseFromIa);
    }
}
