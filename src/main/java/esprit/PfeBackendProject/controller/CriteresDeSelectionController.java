package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.entity.CriteresDeSelection;
import esprit.PfeBackendProject.service.CriteresDeSelectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/criteres")
@RequiredArgsConstructor
public class CriteresDeSelectionController {

    private final CriteresDeSelectionService criteresService;

    @PostMapping("create")
    public ResponseEntity<?> create(@RequestBody CriteresDeSelection critere) {
        try {
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(criteresService.save(critere));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Erreur lors de la création du critère : " + e.getMessage());
        }
    }

    @GetMapping("getAll")
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size

            ) {
        try {
            return ResponseEntity.ok(criteresService.findAll(page, size));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des critères");
        }
    }

    @GetMapping("getById/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(criteresService.findById(id));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Critère introuvable avec l'id : " + id);
        }
    }

    @DeleteMapping("delete/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            criteresService.delete(id);
            return ResponseEntity.ok("Critère supprimé avec succès");
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Impossible de supprimer le critère");
        }
    }

    @PostMapping("/affecterCategories/{idCritere}")
    public ResponseEntity<?> affecterCategoriesAtCritere(
            @PathVariable String idCritere,
            @RequestBody List<String> idCategories) {

        try {
            CriteresDeSelection result =
                    criteresService.affecterCategories(
                            idCritere, idCategories);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Erreur lors de l'affectation des catégories : " + e.getMessage());
        }
    }
}
