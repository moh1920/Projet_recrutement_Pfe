package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.configuration.CandidateMapper;
import esprit.PfeBackendProject.dto.CandidateDTO;
import esprit.PfeBackendProject.dto.ProfileResponseDTO;
import esprit.PfeBackendProject.entity.*;
import esprit.PfeBackendProject.repository.CandidateRepository;
import esprit.PfeBackendProject.repository.CandidatureRepository;
import esprit.PfeBackendProject.repository.OffreRepository;
import esprit.PfeBackendProject.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class CandidatureService {
    private final CandidateRepository candidatureRepository;
    private final ProfileRepository profileRepository;
    private final CandidateMapper candidateMapper ;

    private final OffreRepository offreRepository ;
    public Candidate postulerCandidature(String idProfile, String idOffre ) {


        Offre offre = offreRepository.findById(idOffre)
                .orElseThrow(() -> new RuntimeException("offre not found"));

        if(candidatureRepository.findByIdProfile(idProfile)!=null && candidatureRepository.findByIdOffre(idOffre)!=null){
          throw new RuntimeException("le profile est deja postuler");
        }


        ProfileDetails profileResponseDTO = profileRepository.findById(idProfile).orElseThrow(
                ()-> new RuntimeException("profil not found"));
        // Créer un nouvel objet Candidate
        Candidate candidate = new Candidate();

        // Générer un ID (si nécessaire)
        candidate.setId(UUID.randomUUID().toString());

        candidate.setIdProfile(idProfile);
        candidate.setIdOffre(idOffre);

        // Extraire le prénom et nom depuis le champ "nom"
        String fullName = profileResponseDTO.getNom();
        if (fullName != null && !fullName.isEmpty()) {
            String[] nameParts = fullName.split(" ", 2);
            candidate.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                candidate.setLastName(nameParts[1]);
            } else {
                candidate.setLastName("");
            }
        }

        // Informations de base
        candidate.setEmail(profileResponseDTO.getEmail());
        candidate.setPhone(profileResponseDTO.getTelephone());

        // CV et documents
        candidate.setResume(profileResponseDTO.getCvPath());

        // Expérience
        candidate.setExperience(profileResponseDTO.getNbAnneesExperience());

        // Créer l'éducation
        Candidate.Education education = new Candidate.Education();
        education.setDegree(profileResponseDTO.getNiveauDiplome());
        education.setInstitution(profileResponseDTO.getUniversite());
        education.setField(profileResponseDTO.getSpecialite());

        // Convertir l'année de diplôme en date (ex: 2100 -> 2100-01-01)
        if (profileResponseDTO.getAnneeDiplome() > 0) {
            String endDate = profileResponseDTO.getAnneeDiplome() + "-01-01";
            education.setEndDate(endDate);
        }

        education.setCurrent(false); // Par défaut, diplôme obtenu (non en cours)

        List<Candidate.Education> educationList = new ArrayList<>();
        educationList.add(education);
        candidate.setEducation(educationList);

        // Combiner toutes les compétences
        List<String> allSkills = new ArrayList<>();

        if (profileResponseDTO.getLangages() != null) {
            allSkills.addAll(profileResponseDTO.getLangages());
        }
        if (profileResponseDTO.getFrameworks() != null) {
            allSkills.addAll(profileResponseDTO.getFrameworks());
        }
        if (profileResponseDTO.getDataSkills() != null) {
            allSkills.addAll(profileResponseDTO.getDataSkills());
        }
        if (profileResponseDTO.getIaSkills() != null) {
            allSkills.addAll(profileResponseDTO.getIaSkills());
        }
        if (profileResponseDTO.getErpSkills() != null) {
            allSkills.addAll(profileResponseDTO.getErpSkills());
        }

        candidate.setSkills(allSkills);

        // Poste appliqué (vous pouvez définir une valeur par défaut ou la rendre configurable)
        candidate.setAppliedPosition("Enseignant"); // À modifier selon votre logique métier

        // Date de candidature
        candidate.setAppliedDate(LocalDateTime.now());

        // Statut par défaut
        candidate.setStatus(CandidateStatus.NOUVEAU);

        // Notes (motivation)
        candidate.setNotes(profileResponseDTO.getMotivation());

        // Dates de création et mise à jour
        candidate.setCreatedAt(LocalDateTime.now());
        candidate.setUpdatedAt(LocalDateTime.now());


        offre.setCandidateCount(offre.getCandidateCount() + 1);
        offreRepository.save(offre);


        // Sauvegarder dans la base de données
        return candidatureRepository.save(candidate);
    }


    public Candidate createCandidature(Candidate candidature){
        return candidatureRepository.save(candidature);
    }


    public List<CandidateDTO> getAllCandidature(){

        return candidatureRepository.findAll()
                .stream()
                .map(candidateMapper::toDto)
                .toList();
    }
    public List<CandidateDTO> getAllCandidatureByProfile(String idProfile) {

        return candidatureRepository.findByIdProfile(idProfile)
                .stream()
                .map(candidateMapper::toDto)
                .toList();

    }
    public List<CandidateDTO> getAllCandidatureByOffre(String idOffre){
        return candidatureRepository.findByIdOffre(idOffre)
                .stream()
                .map(candidateMapper::toDto)
                .toList();
    }
    public List<CandidateDTO> getAllCandidatureById(String id){
        return candidatureRepository.findById(id)
                .stream()
                .map(candidateMapper::toDto)
                .toList();
    }

    // ─── Add a single step to a candidate ──────────────────────────────────────
    public Candidate addStep(String candidateId, Candidate.Step step) {
        Candidate candidate = candidatureRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found with id: " + candidateId));

        List<Candidate.Step> steps = candidate.getSteps();
        if (steps == null) {
            steps = new ArrayList<>();
        }

        steps.add(step);
        candidate.setSteps(steps);
        candidate.setUpdatedAt(LocalDateTime.now());

        return candidatureRepository.save(candidate);
    }

    // ─── Replace all steps of a candidate ──────────────────────────────────────
    public Candidate updateSteps(String candidateId, List<Candidate.Step> newSteps) {
        Candidate candidate = candidatureRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found with id: " + candidateId));

        candidate.setSteps(newSteps);
        candidate.setUpdatedAt(LocalDateTime.now());

        return candidatureRepository.save(candidate);
    }

    // ─── Update the status of a specific step by name ──────────────────────────
    public Candidate updateStepStatus(String candidateId, String stepName, Candidate.StepStatus newStatus, String date) {
        Candidate candidate = candidatureRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found with id: " + candidateId));

        List<Candidate.Step> steps = candidate.getSteps();
        if (steps == null || steps.isEmpty()) {
            throw new RuntimeException("No steps found for candidate: " + candidateId);
        }

        steps.stream()
                .filter(step -> step.getName().equalsIgnoreCase(stepName))
                .findFirst()
                .ifPresentOrElse(
                        step -> {
                            step.setStatus(newStatus);
                            if (date != null) step.setDate(date);
                        },
                        () -> { throw new RuntimeException("Step not found: " + stepName); }
                );

        candidate.setSteps(steps);
        candidate.setUpdatedAt(LocalDateTime.now());

        return candidatureRepository.save(candidate);
    }

    // ─── Get all steps of a candidate ──────────────────────────────────────────
    public List<Candidate.Step> getSteps(String candidateId) {
        Candidate candidate = candidatureRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found with id: " + candidateId));

        return candidate.getSteps() != null ? candidate.getSteps() : new ArrayList<>();
    }

    // ─── Initialize default steps on postuler ──────────────────────────────────
    private List<Candidate.Step> buildDefaultSteps() {
        return List.of(
                Candidate.Step.builder()
                        .name("Candidature Soumise")
                        .status(Candidate.StepStatus.completed)
                        .date(LocalDateTime.now().toString())
                        .icon("description")
                        .description("CV et lettre de motivation reçus.")
                        .build(),
                Candidate.Step.builder()
                        .name("Entretien RH")
                        .status(Candidate.StepStatus.pending)
                        .icon("person")
                        .description("Premier contact avec les ressources humaines.")
                        .build(),
                Candidate.Step.builder()
                        .name("Test Technique")
                        .status(Candidate.StepStatus.pending)
                        .icon("code")
                        .description("Évaluation des compétences techniques.")
                        .build(),
                Candidate.Step.builder()
                        .name("Entretien Manager")
                        .status(Candidate.StepStatus.pending)
                        .icon("groups")
                        .description("Rencontre avec le futur manager.")
                        .build(),
                Candidate.Step.builder()
                        .name("Décision Finale")
                        .status(Candidate.StepStatus.pending)
                        .icon("work")
                        .description("Proposition ou refus.")
                        .build()
        );
    }

    // ─── Dans CandidatureService ────────────────────────────────────────────────
    public Candidate deleteStep(String candidateId, String stepName) {
        Candidate candidate = candidatureRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));

        List<Candidate.Step> steps = candidate.getSteps();
        if (steps == null || steps.isEmpty()) {
            throw new RuntimeException("No steps found for candidate: " + candidateId);
        }

        boolean removed = steps.removeIf(s -> s.getName().equalsIgnoreCase(stepName));
        if (!removed) {
            throw new RuntimeException("Step not found: " + stepName);
        }

        candidate.setSteps(steps);
        candidate.setUpdatedAt(LocalDateTime.now());

        return candidatureRepository.save(candidate);
    }



}
