package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.dto.CandidateDTO;
import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("candidature")
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureService candidatureService;

    // ─── Candidature ────────────────────────────────────────────────────────

    @PostMapping("/postulerCandidature/{idProfile}/{idOffre}")
    public ResponseEntity<?> postulerCandidature(
            @PathVariable String idProfile,
            @PathVariable String idOffre) {
        return ResponseEntity.ok(candidatureService.postulerCandidature(idProfile, idOffre));
    }

    @PostMapping("/createCandidature")
    public ResponseEntity<?> createCandidature(@RequestBody Candidate candidate) {
        return ResponseEntity.ok(candidatureService.createCandidature(candidate));
    }

    @GetMapping("/getAllCandidature")
    public ResponseEntity<List<CandidateDTO>> getAllCandidature() {
        return ResponseEntity.ok(candidatureService.getAllCandidature());
    }

    @GetMapping("/getAllCandidatureByProfile/{idProfile}")
    public ResponseEntity<List<CandidateDTO>> getAllCandidatureByProfile(
            @PathVariable String idProfile) {
        return ResponseEntity.ok(candidatureService.getAllCandidatureByProfile(idProfile));
    }

    @GetMapping("/getAllCandidatureByOffre/{idOffre}")
    public ResponseEntity<List<CandidateDTO>> getAllCandidatureByOffre(
            @PathVariable String idOffre) {
        return ResponseEntity.ok(candidatureService.getAllCandidatureByOffre(idOffre));
    }

    @GetMapping("/getAllCandidatureById/{id}")
    public ResponseEntity<List<CandidateDTO>> getAllCandidatureById(
            @PathVariable String id) {
        return ResponseEntity.ok(candidatureService.getAllCandidatureById(id));
    }

    // ─── Steps ──────────────────────────────────────────────────────────────

    /**
     * GET /candidature/{id}/steps
     * Récupérer toutes les étapes d'un candidat
     */
    @GetMapping("/{id}/steps")
    public ResponseEntity<List<Candidate.Step>> getSteps(
            @PathVariable String id) {
        return ResponseEntity.ok(candidatureService.getSteps(id));
    }

    /**
     * POST /candidature/{id}/steps
     * Ajouter une seule étape à un candidat
     * Body: { "name": "Entretien RH", "status": "pending", "icon": "person", "description": "..." }
     */
    @PostMapping("/{id}/steps")
    public ResponseEntity<Candidate> addStep(
            @PathVariable String id,
            @RequestBody Candidate.Step step) {
        return ResponseEntity.ok(candidatureService.addStep(id, step));
    }

    /**
     * PUT /candidature/{id}/steps
     * Remplacer toute la liste des étapes d'un candidat
     * Body: [ { "name": "...", "status": "...", ... }, ... ]
     */
    @PutMapping("/{id}/steps")
    public ResponseEntity<Candidate> updateSteps(
            @PathVariable String id,
            @RequestBody List<Candidate.Step> steps) {
        return ResponseEntity.ok(candidatureService.updateSteps(id, steps));
    }

    /**
     * PATCH /candidature/{id}/steps/{stepName}?status=completed&date=21 Mars 2026
     * Mettre à jour le statut d'une étape précise par son nom
     */
    @PatchMapping("/{id}/steps/{stepName}")
    public ResponseEntity<Candidate> updateStepStatus(
            @PathVariable String id,
            @PathVariable String stepName,
            @RequestParam Candidate.StepStatus status,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(candidatureService.updateStepStatus(id, stepName, status, date));
    }

    /**
     * DELETE /candidature/{id}/steps/{stepName}
     * Supprimer une étape par son nom
     */
    @DeleteMapping("/{id}/steps/{stepName}")
    public ResponseEntity<Candidate> deleteStep(
            @PathVariable String id,
            @PathVariable String stepName) {
        return ResponseEntity.ok(candidatureService.deleteStep(id, stepName));
    }
}