package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.entity.Candidature;
import esprit.PfeBackendProject.entity.Entretien;
import esprit.PfeBackendProject.entity.EtatEntretien;
import esprit.PfeBackendProject.repository.CandidatureRepository;
import esprit.PfeBackendProject.repository.EntretienRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;


@Service
@RequiredArgsConstructor
public class EntretienService {
    private final EntretienRepository entretienRepository;
    private final CandidatureRepository candidatureRepository;
    private final EmailService emailService;

    public Entretien planifierEntretien(Entretien entretien) {
        Candidature candidature = candidatureRepository.findById(entretien.getCandidatureId()).orElseThrow(
                ()-> new RuntimeException("candidature not found")
        );


        String subject = "Convocation à un entretien";
        String content =
                "Bonjour " + candidature.getNom() + ",\n\n" +
                        "Nous avons le plaisir de vous informer que votre entretien est planifié.\n\n" +
                        "Date : " + entretien.getDateEntretien() + "\n" +
                        "Lien visio : " + entretien.getLienVisio() + "\n\n" +
                        "Cordialement,\nService Recrutement";

        emailService.sendEmail(
                candidature.getEmail(),
                subject,
                content
        );


        entretien.setEtat(EtatEntretien.PLANIFIE);
        entretien.setDateCreation(LocalDate.now());
        return entretienRepository.save(entretien);
    }

    public Entretien demarrerEntretien(String id) {
        Entretien e = entretienRepository.findById(id).orElseThrow();
        e.setEtat(EtatEntretien.EN_COURS);
        return entretienRepository.save(e);
    }

    public Entretien terminerEntretien(String id, Double note, String commentaire) {
        Entretien e = entretienRepository.findById(id).orElseThrow();
        e.setEtat(EtatEntretien.TERMINE);
        e.setNoteGlobale(note);
        e.setCommentaire(commentaire);
        return entretienRepository.save(e);
    }

    public void annulerEntretien(String id) {
        Entretien e = entretienRepository.findById(id).orElseThrow();
        e.setEtat(EtatEntretien.ANNULE);
        entretienRepository.save(e);
    }
}
