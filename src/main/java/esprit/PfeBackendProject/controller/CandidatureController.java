package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.entity.Candidature;
import esprit.PfeBackendProject.repository.CandidatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.function.EntityResponse;

@RestController
@RequestMapping("candidature")
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureRepository candidatureRepository ;


    @PostMapping("/createCandidature")
    public ResponseEntity<?> createCandidature(Candidature candidature){
        return ResponseEntity.ok(candidatureRepository.save(candidature));
    }

}
