package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.dto.*;
import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.entity.Offre;
import esprit.PfeBackendProject.repository.CandidateRepository;
import esprit.PfeBackendProject.service.AiMatchingService;
import esprit.PfeBackendProject.service.CandidatureService;
import esprit.PfeBackendProject.service.OffreService;
import esprit.PfeBackendProject.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final AiMatchingService aiMatchingService;
    private final OffreService offerService;
    private final CandidatureService candidateService;
    private final CandidateRepository candidateRepository;
    private final ProfileService profileService;

    /**
     * Endpoint 1 : Classer tous les candidats qui ont postulé pour UNE offre spécifique.
     * GET /api/matching/offers/{offerId}/candidates
     */
    @GetMapping("/offers/{offerId}/candidates")
    public ResponseEntity<List<MatchResult>> getBestCandidatesForOffer(@PathVariable String offerId) {

        // 1. Récupérer l'offre
        Offre offer = offerService.findById(offerId);

        // 2. Récupérer tous les candidats ayant postulé à cette offre
        List<CandidateDTO> interestedCandidates = candidateService.getAllCandidatureByOffre(offerId);

        // 3. Construire les paires Candidat + Profil ✅ (profil chargé pour chaque candidat)
        List<CandidateProfilePair> candidatePairs = interestedCandidates.stream()
                .map(c -> {
                    ProfileResponseDTO profile = null;
                    try {
                        if (c.getIdProfile() != null) {
                            profile = profileService.getProfileById(c.getIdProfile());
                        }
                    } catch (Exception e) {
                        System.err.println("Profil introuvable pour le candidat: " + c.getId());
                    }
                    return new CandidateProfilePair(c, profile);
                })
                .collect(Collectors.toList());

        // 4. Appeler FastAPI avec l'offerId explicite ✅
        List<MatchResult> rankedResults = aiMatchingService.rankCandidatesForOffer(offerId, offer, candidatePairs);

        return ResponseEntity.ok(rankedResults);
    }

    /**
     * Endpoint 2 : Classer toutes les offres ouvertes pour UN candidat spécifique.
     * GET /api/matching/candidates/{candidateId}/offers
     */
    @GetMapping("/candidates/{candidateId}/offers")
    public ResponseEntity<List<MatchResult>> getBestOffersForCandidate(@PathVariable String candidateId) {

        // 1. Récupérer le candidat et son profil
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidat introuvable : " + candidateId));

        ProfileResponseDTO profile = null;
        try {
            if (candidate.getIdProfile() != null) {
                profile = profileService.getProfileById(candidate.getIdProfile());
            }
        } catch (Exception e) {
            System.err.println("Profil introuvable pour le candidat: " + candidateId);
        }

        // 2. Récupérer toutes les offres disponibles
        List<Offre> availableOffers = offerService.findAllNotPage();

        // 3. Appeler FastAPI ✅
        List<MatchResult> rankedResults = aiMatchingService.rankOffersForCandidate(candidate, profile, availableOffers);

        return ResponseEntity.ok(rankedResults);
    }

    @GetMapping("/rankOffersForProfile/{profileId}")
    public ResponseEntity<List<MatchResult>> rankOffersForProfile(
            @PathVariable String profileId
    ) {
        List<MatchResult> results = aiMatchingService.rankOffersForProfile(profileId);

        if (results.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(results);
    }



}