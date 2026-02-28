package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.configuration.OffreMapper;
import esprit.PfeBackendProject.dto.OffreUpdateDto;
import esprit.PfeBackendProject.entity.*;
import esprit.PfeBackendProject.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class OffreService {

    private final OffreRepository offreRepository;
    private final OffreMapper offreMapper ;
    private final CriteresDeSelectionRepository criteresDeSelectionRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final CandidatureRepository candidatureRepository;

    public Offre save(Offre offre) {
        return offreRepository.save(offre);
    }

    public Page<Offre> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return offreRepository.findAll(pageable);
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
            criteresDeSelections.add(criteresDeSelectionRepository.findById(id).get());
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








}
