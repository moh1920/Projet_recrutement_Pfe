package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.dto.ManualEvaluationRequest;
import esprit.PfeBackendProject.dto.ManualScoreResult;
import esprit.PfeBackendProject.entity.CriteresDeSelection;
import esprit.PfeBackendProject.entity.ManualEvaluation;
import esprit.PfeBackendProject.entity.Offre;
import esprit.PfeBackendProject.repository.OffreRepository;
import esprit.PfeBackendProject.service.ManualEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("evaluations")
@RequiredArgsConstructor
public class ManualEvaluationController {

    private final ManualEvaluationService evaluationService;
    private final OffreRepository offreRepository;  // ← injection correcte via constructeur

    @PostMapping("/submitEvaluation")
    public ResponseEntity<ManualScoreResult> submitEvaluation(
            @RequestBody ManualEvaluationRequest request) {
        return ResponseEntity.ok(evaluationService.evaluate(request));
    }

    @GetMapping("/offre/{offreId}/classement")
    public ResponseEntity<List<ManualEvaluation>> getClassement(
            @PathVariable String offreId) {
        return ResponseEntity.ok(evaluationService.getClassementByOffre(offreId));
    }

    @GetMapping("/offre/{offreId}/criteres")
    public ResponseEntity<List<CriteresDeSelection>> getCriteres(
            @PathVariable String offreId) {
        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        return ResponseEntity.ok(offre.getCriteresDeSelections());
    }



    @GetMapping("/getManualEvaluationByCandidatsId/{idCandidats}")
    public ManualEvaluation getManualEvaluationByCandidatsId(@PathVariable  String idCandidats) {
        return evaluationService.getManualEvaluationByCandidatsId(idCandidats);
    }
}