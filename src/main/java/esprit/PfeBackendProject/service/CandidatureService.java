package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.configuration.CandidateMapper;
import esprit.PfeBackendProject.dto.CandidateDTO;
import esprit.PfeBackendProject.dto.ProfileResponseDTO;
import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.entity.CandidateStatus;
import esprit.PfeBackendProject.entity.Candidature;
import esprit.PfeBackendProject.entity.ProfileDetails;
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



        if (offreRepository.findById(idOffre).isEmpty()){
            throw new RuntimeException("offre not found");
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
        candidate.setFirstName(fullName);

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


}
