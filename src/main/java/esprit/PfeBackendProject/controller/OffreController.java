package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.dto.N8nScoringResponse;
import esprit.PfeBackendProject.dto.OffreUpdateDto;
import esprit.PfeBackendProject.entity.Offre;
import esprit.PfeBackendProject.service.N8nRecrutementService;
import esprit.PfeBackendProject.service.OffreService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/offre")
@RequiredArgsConstructor
public class OffreController {

    private final OffreService offreService;
    private final N8nRecrutementService n8nService;

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody Offre offre) {
        try {
            return ResponseEntity.status(HttpStatus.OK)
                    .body(offreService.save(offre));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erreur lors de la création de l'offre : " + e.getMessage());
        }
    }

    @GetMapping("/getAll")
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        try {
            Page<Offre> offres = offreService.findAll(page, size);
            return ResponseEntity.ok(offres);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des offres");
        }
    }
    @GetMapping("/getDTOAll")
    public ResponseEntity<?> getDTOAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        try {

            return ResponseEntity.ok(offreService.findAllDTO(page, size));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des offres");
        }
    }

    @GetMapping("/getAllSorted")
    public ResponseEntity<?> getAllSorted(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "dateCreation") String sortBy
    ) {
        try {
            return ResponseEntity.ok(
                    offreService.findAllSorted(page, size, sortBy)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors du tri des offres");
        }
    }

    @GetMapping("/getById/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(offreService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Offre introuvable avec l'id : " + id);
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> update(
            @PathVariable String id,
            @RequestBody OffreUpdateDto dto
    ) {
        try {
            return ResponseEntity.ok(offreService.update(id, dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erreur lors de la mise à jour de l'offre");
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            offreService.delete(id);
            return ResponseEntity.ok("Offre supprimée avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Impossible de supprimer l'offre");
        }
    }

    @PutMapping("/affecterCriteresDeSelection/{idOffre}")
    public ResponseEntity<?> affecterCriteresDeSelection(
            @PathVariable String idOffre,
            @RequestBody List<String> idScriteresDeSelections) {

        try {
            Offre offre = offreService
                    .affecterCriteresDeSelectionAtOffre(idOffre, idScriteresDeSelections);
            return ResponseEntity.ok(offre);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erreur lors de l'affectation des critères");
        }
    }


    @PutMapping("/modifierStatusOffre/{idOffre}/{status}")
    public void modifierStatusOffre(@PathVariable String idOffre,@PathVariable String status) {
        try {
            offreService.modifierStatusOffre(idOffre, status);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/scorer-offre")
    public ResponseEntity<N8nScoringResponse[]> scorerOffre(
            @RequestBody Offre offre) {

        N8nScoringResponse result = n8nService.lancerScoring(offre);
        return ResponseEntity.ok(new N8nScoringResponse[]{result});
    }


}
