package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.entity.Entretien;
import esprit.PfeBackendProject.entity.EtatEntretien;
import esprit.PfeBackendProject.service.EntretienService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("entretien")
@RequiredArgsConstructor
public class EntretienController {

    private final EntretienService entretienService ;


    @PostMapping("/planifierEntretien")
    public ResponseEntity<?> planifierEntretien(@RequestBody Entretien entretien) {
             try {
                 return ResponseEntity.ok(entretienService.planifierEntretien(entretien));
             }catch (Exception e){
                 return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                         .body("Erreur lors de la création de l'entretien : " + e.getMessage());
             }
    }


}
