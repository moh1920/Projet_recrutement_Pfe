package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.entity.CategorieDeSelection;
import esprit.PfeBackendProject.service.CategorieDeSelectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("categorieDeSelection")
@RequiredArgsConstructor
public class CategorieDeSelectionController {

    private final CategorieDeSelectionService categorieDeSelectionService ;



    @PostMapping("/addCategorie/add")
    public ResponseEntity<?> addCategorie(@RequestBody CategorieDeSelection categorie) {
        try {
            CategorieDeSelection saved =
                    categorieDeSelectionService.addCategorie(categorie);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    "Erreur lors de l'ajout de la catégorie : " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/getAllCategories/all")
    public ResponseEntity<?> getAllCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size

            ) {
        try {
            Page<CategorieDeSelection> list =
                    categorieDeSelectionService.getAllCategories(page, size);
            return new ResponseEntity<>(list, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    "Erreur lors de la récupération des catégories",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getCategorieById/{id}")
    public ResponseEntity<?> getCategorieById(@PathVariable String id) {
        try {
            CategorieDeSelection categorie =
                    categorieDeSelectionService.getCategorieById(id);
            return new ResponseEntity<>(categorie, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    "Catégorie introuvable avec id : " + id,
                    HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/updateCategorie/{id}")
    public ResponseEntity<?> updateCategorie(
            @PathVariable String id,
            @RequestBody CategorieDeSelection categorie) {
        try {
            CategorieDeSelection updated =
                    categorieDeSelectionService.updateCategorie(id, categorie);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    "Erreur lors de la mise à jour : " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/deleteCategorie/{id}")
    public ResponseEntity<?> deleteCategorie(@PathVariable String id) {
        try {
            categorieDeSelectionService.deleteCategorie(id);
            return new ResponseEntity<>(
                    "Catégorie supprimée avec succès",
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    "Erreur lors de la suppression de la catégorie",
                    HttpStatus.NOT_FOUND);
        }
    }
}
