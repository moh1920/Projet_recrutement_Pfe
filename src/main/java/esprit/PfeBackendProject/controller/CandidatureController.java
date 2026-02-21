package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.entity.Candidature;
import esprit.PfeBackendProject.repository.CandidatureRepository;
import esprit.PfeBackendProject.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.function.EntityResponse;

@RestController
@RequestMapping("candidature")
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureService candidatureService ;


    @PostMapping("/createCandidature")
    public ResponseEntity<?> createCandidature(@RequestBody Candidate candidate){
        return ResponseEntity.ok(candidatureService.createCandidature(candidate));
    }

}
