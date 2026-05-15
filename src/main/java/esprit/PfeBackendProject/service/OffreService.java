package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.configuration.OffreMapper;
import esprit.PfeBackendProject.dto.EvaluationRequest;
import esprit.PfeBackendProject.dto.OffreDTO;
import esprit.PfeBackendProject.dto.OffreUpdateDto;
import esprit.PfeBackendProject.dto.ScoreResult;
import esprit.PfeBackendProject.entity.*;
import esprit.PfeBackendProject.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class OffreService {

    private final OffreRepository offreRepository;
    private final OffreMapper offreMapper ;
    private final CriteresDeSelectionRepository criteresRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final CandidatureRepository candidatureRepository;
    private final esprit.PfeBackendProject.mapper.OffreMapper offreMapperc;


    public Offre save(Offre offre) {
        return offreRepository.save(offre);
    }

    public Page<Offre> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return offreRepository.findAll(pageable);
    }
    public List<Offre> findAllNotPage() {
        return offreRepository.findAll();
    }

    public Page<OffreDTO> findAllDTO(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return offreRepository.findAll(pageable)
                .map(offre -> {
                    // Résoudre les DBRef manuellement
                    if (offre.getCriteresDeSelections() != null
                            && !offre.getCriteresDeSelections().isEmpty()) {
                        List<CriteresDeSelection> criteres = offre.getCriteresDeSelections()
                                .stream()
                                .map(c -> criteresRepository.findById(c.getId()).orElse(null))
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());
                        offre.setCriteresDeSelections(criteres);
                    }
                    return offreMapperc.toDTO(offre);
                });
    }


    public Page<Offre> findAllSorted(int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(sortBy).descending()
        );
        return offreRepository.findAll(pageable);
    }

    public Offre findById(String id) {
        return offreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre not found"));
    }

    public void delete(String id) {
        offreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre not found"));
        offreRepository.deleteById(id);
    }


    public Offre update(String id, OffreUpdateDto dto) {

        Offre offre = offreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre not found"));

        offreMapper.updateOffreFromDto(dto, offre);

        return offreRepository.save(offre);
    }

    public Offre affecterCriteresDeSelectionAtOffre(String idOffre, List<String> idScriteresDeSelections){
        Offre offre = offreRepository.findById(idOffre).get();
        List<CriteresDeSelection> criteresDeSelections = new ArrayList<>();
        for (String id :idScriteresDeSelections){
            criteresDeSelections.add(criteresRepository.findById(id).get());
        }
        offre.setCriteresDeSelections(criteresDeSelections);
        return offreRepository.save(offre);
    }


//    public Candidature demandeDeOffre(String idOffre, String idUser) {
//
//        Offre offre = offreRepository.findById(idOffre)
//                .orElseThrow(() -> new RuntimeException("Offre not found"));
//
//        User user = userRepository.findById(idUser)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//        ProfileDetails profileDetails = profileRepository.findByUserId(idUser)
//                .orElseThrow(() -> new RuntimeException("Profile not found"));
//
//        Candidature candidature = Candidature.builder()
//
//                /* ===== Liaison ===== */
//                .keycloakId(user.getKeycloakId())
//
//                /* ===== Infos personnelles ===== */
//                .nom(user.getFirstName() + " " + user.getLastName())
//                .email(user.getEmail())
//                .telephone(profileDetails.getTelephone())
//                .nationalite(profileDetails.getNationalite())
//                .ville(profileDetails.getVille())
//                .dateNaissance(profileDetails.getDateNaissance())
//
//                /* ===== Données académiques ===== */
//                .niveauDiplome(profileDetails.getNiveauDiplome())
//                .specialite(profileDetails.getSpecialite())
//                .universite(profileDetails.getUniversite())
//                .anneeDiplome(profileDetails.getAnneeDiplome())
//                .gradeAcademique(profileDetails.getGradeAcademique())
//
//                /* ===== Expérience ===== */
//                .nbAnneesExperience(profileDetails.getNbAnneesExperience())
//                .experienceAcademique(profileDetails.getNbAnneesExperience())
//                .institutions(profileDetails.getInstitutions())
//                .modulesEnseignes(profileDetails.getModulesEnseignes())
//
//                /* ===== Compétences ===== */
//                .langages(profileDetails.getLangages())
//                .frameworks(profileDetails.getFrameworks())
//                .dataSkills(profileDetails.getDataSkills())
//                .iaSkills(profileDetails.getIaSkills())
//                .erpSkills(profileDetails.getErpSkills())
//
//                /* ===== Pédagogie ===== */
//                .methodesEnseignement(profileDetails.getMethodesEnseignement())
//
//                /* ===== Soft skills ===== */
//                .communication(profileDetails.getCommunication())
//                .leadership(profileDetails.getLeadership())
//                .espritEquipe(profileDetails.getEspritEquipe())
//                .motivation(profileDetails.getMotivation())
//
//                /* ===== Documents ===== */
//                .cvPath(profileDetails.getCvPath())
//                .certificatsPath(profileDetails.getCertificatsPath())
//
//                /* ===== Données offre ===== */
//                .typePoste(offre.getType())
//
//                /* ===== Workflow ===== */
//                .statut(StatusCandidature.SOUMISE)
//                .dateCandidature(LocalDate.now())
//                .consentementDonnees(true)
//
//                .build();
//
//        return candidatureRepository.save(candidature);
//    }


    public void modifierStatusOffre(String idOffre, String status) {
        Offre offre = offreRepository.findById(idOffre)
                .orElseThrow(() -> new RuntimeException("Offre not found"));
        offre.setStatus(status);
        offreRepository.save(offre);

    }

    @Scheduled(cron = "0 0 0 * * ?") // Exécute tous les jours à minuit
    public void modifierStatusOffreCrone() {
        List<Offre> offres = offreRepository.findAll();
        for (Offre offre : offres) {
            if (offre.getDeadline() != null && offre.getDeadline().isBefore(LocalDate.now())) {
                offre.setStatus("Expirée");
                offreRepository.save(offre);
                log.error("Offre avec id " + offre.getId() + " a été expirée automatiquement.");
            }
        }
    }


    public ScoreResult calculerScore(EvaluationRequest request) {

        // 1. Récupérer l'offre avec ses critères
        Offre offre = offreRepository.findById(request.getOffreId())
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        List<CriteresDeSelection> criteres = offre.getCriteresDeSelections();
        if (criteres == null || criteres.isEmpty()) {
            throw new RuntimeException("Aucun critère défini pour cette offre");
        }

        Map<String, Float> scoreParCritere = new LinkedHashMap<>();
        float sommeScores = 0f;

        // 2. Pour chaque critère, calculer le score
        for (CriteresDeSelection critere : criteres) {

            List<CategorieDeSelection> toutesCategories = critere.getCategorieDeSelections();
            if (toutesCategories == null || toutesCategories.isEmpty()) continue;

            // Poids total du critère (= le maximum atteignable)
            float poidsTotal = toutesCategories.stream()
                    .map(c -> c.getPoids() != null ? c.getPoids() : 0f)
                    .reduce(0f, Float::sum);

            if (poidsTotal == 0f) continue;

            // Catégories satisfaites par le candidat pour CE critère
            List<String> idsSatisfaites = request.getCategoriesSatisfaites()
                    .getOrDefault(critere.getId(), Collections.emptyList());

            // Poids obtenu = somme des poids des catégories satisfaites
            float poidsObtenu = toutesCategories.stream()
                    .filter(c -> idsSatisfaites.contains(c.getId()))
                    .map(c -> c.getPoids() != null ? c.getPoids() : 0f)
                    .reduce(0f, Float::sum);

            float scoreCritere = (poidsObtenu / poidsTotal) * 100f;
            scoreParCritere.put(critere.getNom(), scoreCritere);
            sommeScores += scoreCritere;
        }

        // 3. Score final = moyenne des scores par critère
        float scoreFinal = scoreParCritere.isEmpty() ? 0f
                : sommeScores / scoreParCritere.size();

        return ScoreResult.builder()
                .candidatId(request.getCandidatId())
                .offreId(request.getOffreId())
                .scoreFinal(Math.round(scoreFinal * 100f) / 100f)
                .scoreParCritere(scoreParCritere)
                .appreciation(getAppreciation(scoreFinal))
                .build();
    }

    // 4. Comparer tous les candidats d'une offre et les classer
    public List<ScoreResult> classerCandidats(List<EvaluationRequest> evaluations) {
        return evaluations.stream()
                .map(this::calculerScore)
                .sorted(Comparator.comparing(ScoreResult::getScoreFinal).reversed())
                .collect(Collectors.toList());
    }

    private String getAppreciation(float score) {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Bon";
        if (score >= 40) return "Moyen";
        return "Insuffisant";
    }








}
