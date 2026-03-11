package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.dto.CandidateDTO;
import esprit.PfeBackendProject.dto.ProfileResponseDTO;
import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.entity.CandidateStatus;
import esprit.PfeBackendProject.entity.Candidature;
import esprit.PfeBackendProject.repository.CandidatureRepository;
import esprit.PfeBackendProject.service.CandidatureService;
import jakarta.ws.rs.Path;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.function.EntityResponse;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("candidature")
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureService candidatureService ;






    @PostMapping("/postulerCandidature/{idProfile}/{idOffre}")
    public ResponseEntity<?> postulerCandidature(@PathVariable String idProfile,@PathVariable String idOffre){
        return ResponseEntity.ok(candidatureService.postulerCandidature(idProfile, idOffre));
    }

    @PostMapping("/createCandidature")
    public ResponseEntity<?> createCandidature(@RequestBody Candidate candidate){
        return ResponseEntity.ok(candidatureService.createCandidature(candidate));
    }

    @GetMapping("/getAllCandidature")
    public List<CandidateDTO> getAllCandidature(){
        return candidatureService.getAllCandidature() ;
    }
    @GetMapping("/getAllCandidatureByProfile/{idProfile}")
    public List<CandidateDTO> getAllCandidatureByProfile(@PathVariable String idProfile) {

       return candidatureService.getAllCandidatureByProfile(idProfile);

    }



}
