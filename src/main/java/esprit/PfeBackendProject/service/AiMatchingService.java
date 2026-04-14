package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.dto.*;
import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.entity.Offre;

import esprit.PfeBackendProject.repository.OffreRepository;
import esprit.PfeBackendProject.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;

@Service
public class AiMatchingService {

    @Value("${ai.matching.api.url:http://127.0.0.1:8001}")
    private String pythonApiBaseUrl;

    private final RestTemplate restTemplate;
    private final OffreRepository offreRepository;
    private final ProfileService profileService;

    public AiMatchingService(RestTemplate restTemplate, OffreRepository offreRepository, ProfileRepository profileRepository, ProfileService profileService) {
        this.restTemplate = restTemplate;
        this.offreRepository = offreRepository;
        this.profileService = profileService;
    }

    /**
     * Cas 1 : Trouver les meilleurs candidats pour une offre donnée
     */
    public List<MatchResult> rankCandidatesForOffer(String offerId, Object offer, List<CandidateProfilePair> candidatesPairs) {
        MatchMultipleRequest request = new MatchMultipleRequest();
        request.setOfferId(offerId);       // ✅ ID explicite
        request.setOffer(offer);
        request.setPairs(candidatesPairs);

        String endpoint = pythonApiBaseUrl + "/api/rank-candidates";

        try {
            ResponseEntity<MatchResult[]> response = restTemplate.postForEntity(
                    endpoint, request, MatchResult[].class
            );
            if (response.getBody() != null) {
                return Arrays.asList(response.getBody());
            }
        } catch (Exception e) {
            System.err.println("Erreur avec l'API IA (Rank Candidates) : " + e.getMessage());
        }
        return List.of();
    }

    /**
     * Cas 2 : Trouver les meilleures offres pour un candidat donné
     */
    public List<MatchResult> rankOffersForCandidate(Candidate candidate, ProfileResponseDTO profile, List<Offre> availableOffers) {
        MatchOffersRequest request = new MatchOffersRequest();
        request.setCandidateId(candidate.getId());  // ✅ ID explicite
        request.setCandidate(candidate);
        request.setProfile(profile);
        request.setOffers(availableOffers);

        String endpoint = pythonApiBaseUrl + "/api/rank-offers";

        try {
            ResponseEntity<MatchResult[]> response = restTemplate.postForEntity(
                    endpoint, request, MatchResult[].class
            );
            if (response.getBody() != null) {
                return Arrays.asList(response.getBody());
            }
        } catch (Exception e) {
            System.err.println("Erreur avec l'API IA (Rank Offers) : " + e.getMessage());
        }
        return List.of();
    }
    /**
     * Cas 3 : Trouver les meilleures offres pour un profil donné (sans candidature)
     */
    public List<MatchResult> rankOffersForProfile(String profileId) {
        List<Offre> availableOffers = offreRepository.findAll();
        ProfileResponseDTO profile = profileService.getProfileByUserId(profileId);
        MatchProfileOffersRequest request = new MatchProfileOffersRequest();
        request.setProfile(profile);
        request.setOffers(availableOffers);

        String endpoint = pythonApiBaseUrl + "/api/rank-profile-offers";

        try {
            ResponseEntity<MatchResult[]> response = restTemplate.postForEntity(
                    endpoint, request, MatchResult[].class
            );
            if (response.getBody() != null) {
                return Arrays.asList(response.getBody());
            }
        } catch (Exception e) {
            System.err.println("Erreur avec l'API IA (Rank Profile Offers) : " + e.getMessage());
        }
        return List.of();
    }

}