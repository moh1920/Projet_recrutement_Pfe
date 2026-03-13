package esprit.PfeBackendProject.service;



import esprit.PfeBackendProject.dto.DocumentResponseDTO;
import esprit.PfeBackendProject.dto.ProfileRequestDTO;
import esprit.PfeBackendProject.dto.ProfileResponseDTO;
import esprit.PfeBackendProject.entity.ProfileDetails;
import esprit.PfeBackendProject.exceptions.ProfileAlreadyExistsException;
import esprit.PfeBackendProject.exceptions.ProfileNotFoundException;
import esprit.PfeBackendProject.repository.ProfileRepository;
import esprit.PfeBackendProject.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final DocumentService documentService ;

    @Autowired
    public ProfileService(ProfileRepository profileRepository, UserRepository userRepository, DocumentService documentService) {

        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.documentService = documentService;
    }

    // ══════════════════════════════════════════════
    // CREATE
    // ══════════════════════════════════════════════

    public ProfileResponseDTO createProfile(ProfileRequestDTO dto) {
        // Vérifier unicité email
        if (profileRepository.existsByEmail(dto.getEmail())) {
            throw new ProfileAlreadyExistsException("Un profil avec l'email " + dto.getEmail() + " existe déjà.");
        }
        // Vérifier unicité userId si fourni
        if (dto.getUserId() != null && profileRepository.existsByUserId(dto.getUserId())) {
            throw new ProfileAlreadyExistsException("Un profil pour l'utilisateur " + dto.getUserId() + " existe déjà.");
        }

        ProfileDetails profile = mapToEntity(dto);
        profile.setDateCreationProfil(LocalDateTime.now());
        profile.setDateDerniereMiseAJour(LocalDateTime.now());

        ProfileDetails saved = profileRepository.save(profile);
        return mapToResponseDTO(saved);
    }

    // ══════════════════════════════════════════════
    // READ
    // ══════════════════════════════════════════════

    public ProfileResponseDTO getProfileById(String id) {
        ProfileDetails profile = profileRepository.findById(id)
                .orElseThrow(() -> new ProfileNotFoundException("Profil introuvable avec l'id : " + id));
        return mapToResponseDTO(profile);
    }

    public ProfileResponseDTO getProfileByUserId(String userId) {

        ProfileDetails profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profil introuvable pour l'utilisateur : " + userId));
        return mapToResponseDTO(profile);
    }

    public ProfileResponseDTO getProfileByEmail(String email) {
        ProfileDetails profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new ProfileNotFoundException("Profil introuvable avec l'email : " + email));
        return mapToResponseDTO(profile);
    }

    public List<ProfileResponseDTO> getAllProfiles() {
        return profileRepository.findAll()
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════
    // UPDATE
    // ══════════════════════════════════════════════

    public ProfileResponseDTO updateProfile(String id, ProfileRequestDTO dto) {
        ProfileDetails existing = profileRepository.findById(id)
                .orElseThrow(() -> new ProfileNotFoundException("Profil introuvable avec l'id : " + id));

        // Vérifier que le nouvel email n'appartient pas à un autre profil
        if (!existing.getEmail().equals(dto.getEmail()) && profileRepository.existsByEmail(dto.getEmail())) {
            throw new ProfileAlreadyExistsException("L'email " + dto.getEmail() + " est déjà utilisé par un autre profil.");
        }

        updateEntityFromDTO(existing, dto);
        existing.setDateDerniereMiseAJour(LocalDateTime.now());

        ProfileDetails updated = profileRepository.save(existing);
        return mapToResponseDTO(updated);
    }

    public ProfileResponseDTO updateCvPath(String id, String cvPath) {
        ProfileDetails profile = profileRepository.findById(id)
                .orElseThrow(() -> new ProfileNotFoundException("Profil introuvable avec l'id : " + id));
        profile.setCvPath(cvPath);
        profile.setDateDerniereMiseAJour(LocalDateTime.now());
        return mapToResponseDTO(profileRepository.save(profile));
    }

    // ══════════════════════════════════════════════
    // DELETE
    // ══════════════════════════════════════════════

    public void deleteProfile(String id) {
        if (!profileRepository.existsById(id)) {
            throw new ProfileNotFoundException("Profil introuvable avec l'id : " + id);
        }
        profileRepository.deleteById(id);
    }

    // ══════════════════════════════════════════════
    // SEARCH / FILTER
    // ══════════════════════════════════════════════

    public List<ProfileResponseDTO> searchProfiles(String keyword) {
        return profileRepository.searchByNomOrSpecialite(keyword)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    public List<ProfileResponseDTO> getProfilesByLangage(String langage) {
        return profileRepository.findByLangagesContaining(langage)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    public List<ProfileResponseDTO> getProfilesByFramework(String framework) {
        return profileRepository.findByFrameworksContaining(framework)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    public List<ProfileResponseDTO> getProfilesByExperience(int minAnnees) {
        return profileRepository.findByNbAnneesExperienceGreaterThanEqual(minAnnees)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    public List<ProfileResponseDTO> getProfilesWithSoftSkills(int minComm, int minLead, int minEquipe) {
        return profileRepository.findBySoftSkillsMinimum(minComm, minLead, minEquipe)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    public List<ProfileResponseDTO> getProfilesByVille(String ville) {
        return profileRepository.findByVille(ville)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    public List<ProfileResponseDTO> getProfilesByModule(String module) {
        return profileRepository.findByModuleEnseigne(module)
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    public List<ProfileResponseDTO> getProfilesWithCV() {
        return profileRepository.findProfilesWithCV()
                .stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }



    public DocumentResponseDTO addDocumentProfile(String idProfile, MultipartFile file) throws IOException {

        ProfileDetails profileDetails = profileRepository.findById(idProfile)
                .orElseThrow(() -> new RuntimeException("profile non trouvé"));

        DocumentResponseDTO documentResponseDTO = documentService.uploadCV(file);

        if (profileDetails.getCertificatsPath() == null) {
            profileDetails.setCertificatsPath(new HashMap<>());
        }
        String safeFileName = documentResponseDTO.getName().replace(".", "_");


        // key = file name, value = URL
        profileDetails.getCertificatsPath().put(
                safeFileName,
                documentResponseDTO.getUrl()
        );

        profileRepository.save(profileDetails);

        return documentResponseDTO;
    }






    public ProfileResponseDTO getProfileByKeycloakId(String keycloakId) {
        String userId = userRepository.findByKeycloakId(keycloakId).orElseThrow(() -> new UsernameNotFoundException("user not fount")).getId();
        ProfileDetails profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profil introuvable pour l'utilisateur : " + keycloakId));
        return mapToResponseDTO(profile);
    }
    // ══════════════════════════════════════════════
    // MAPPING
    // ══════════════════════════════════════════════

    private ProfileDetails mapToEntity(ProfileRequestDTO dto) {
        ProfileDetails p = new ProfileDetails();
        p.setUserId(dto.getUserId());
        p.setNom(dto.getNom());
        p.setEmail(dto.getEmail());
        p.setTelephone(dto.getTelephone());
        p.setNationalite(dto.getNationalite());
        p.setVille(dto.getVille());
        p.setDateNaissance(dto.getDateNaissance());
        p.setNiveauDiplome(dto.getNiveauDiplome());
        p.setSpecialite(dto.getSpecialite());
        p.setUniversite(dto.getUniversite());
        p.setAnneeDiplome(dto.getAnneeDiplome());
        p.setGradeAcademique(dto.getGradeAcademique());
        p.setNbAnneesExperience(dto.getNbAnneesExperience());
        p.setExperienceAcademique(dto.isExperienceAcademique());
        p.setInstitutions(dto.getInstitutions());
        p.setModulesEnseignes(dto.getModulesEnseignes());
        p.setLangages(dto.getLangages());
        p.setFrameworks(dto.getFrameworks());
        p.setDataSkills(dto.getDataSkills());
        p.setIaSkills(dto.getIaSkills());
        p.setErpSkills(dto.getErpSkills());
        p.setMethodesEnseignement(dto.getMethodesEnseignement());
        p.setEncadrement(dto.isEncadrement());
        p.setInnovationPedagogique(dto.isInnovationPedagogique());
        p.setCommunication(dto.getCommunication());
        p.setLeadership(dto.getLeadership());
        p.setEspritEquipe(dto.getEspritEquipe());
        p.setMotivation(dto.getMotivation());
        p.setCvPath(dto.getCvPath());
        p.setDocument(dto.getDocument());
        p.setCertificatsPath(dto.getCertificatsPath());
        return p;
    }

    private void updateEntityFromDTO(ProfileDetails p, ProfileRequestDTO dto) {
        p.setNom(dto.getNom());
        p.setEmail(dto.getEmail());
        p.setTelephone(dto.getTelephone());
        p.setNationalite(dto.getNationalite());
        p.setVille(dto.getVille());
        p.setDateNaissance(dto.getDateNaissance());
        p.setNiveauDiplome(dto.getNiveauDiplome());
        p.setSpecialite(dto.getSpecialite());
        p.setUniversite(dto.getUniversite());
        p.setAnneeDiplome(dto.getAnneeDiplome());
        p.setGradeAcademique(dto.getGradeAcademique());
        p.setNbAnneesExperience(dto.getNbAnneesExperience());
        p.setExperienceAcademique(dto.isExperienceAcademique());
        p.setInstitutions(dto.getInstitutions());
        p.setModulesEnseignes(dto.getModulesEnseignes());
        p.setLangages(dto.getLangages());
        p.setFrameworks(dto.getFrameworks());
        p.setDataSkills(dto.getDataSkills());
        p.setIaSkills(dto.getIaSkills());
        p.setErpSkills(dto.getErpSkills());
        p.setMethodesEnseignement(dto.getMethodesEnseignement());
        p.setEncadrement(dto.isEncadrement());
        p.setInnovationPedagogique(dto.isInnovationPedagogique());
        p.setCommunication(dto.getCommunication());
        p.setLeadership(dto.getLeadership());
        p.setEspritEquipe(dto.getEspritEquipe());
        p.setMotivation(dto.getMotivation());
        if (dto.getCvPath() != null) p.setCvPath(dto.getCvPath());
        if (dto.getCertificatsPath() != null) p.setCertificatsPath(dto.getCertificatsPath());
    }

    private ProfileResponseDTO mapToResponseDTO(ProfileDetails p) {
        ProfileResponseDTO dto = new ProfileResponseDTO();
        dto.setId(p.getId());
        dto.setUserId(p.getUserId());
        dto.setNom(p.getNom());
        dto.setEmail(p.getEmail());
        dto.setTelephone(p.getTelephone());
        dto.setNationalite(p.getNationalite());
        dto.setVille(p.getVille());
        dto.setDateNaissance(p.getDateNaissance());
        dto.setNiveauDiplome(p.getNiveauDiplome());
        dto.setSpecialite(p.getSpecialite());
        dto.setUniversite(p.getUniversite());
        dto.setAnneeDiplome(p.getAnneeDiplome());
        dto.setGradeAcademique(p.getGradeAcademique());
        dto.setNbAnneesExperience(p.getNbAnneesExperience());
        dto.setExperienceAcademique(p.isExperienceAcademique());
        dto.setInstitutions(p.getInstitutions());
        dto.setModulesEnseignes(p.getModulesEnseignes());
        dto.setLangages(p.getLangages());
        dto.setFrameworks(p.getFrameworks());
        dto.setDataSkills(p.getDataSkills());
        dto.setIaSkills(p.getIaSkills());
        dto.setErpSkills(p.getErpSkills());
        dto.setMethodesEnseignement(p.getMethodesEnseignement());
        dto.setEncadrement(p.isEncadrement());
        dto.setInnovationPedagogique(p.isInnovationPedagogique());
        dto.setCommunication(p.getCommunication());
        dto.setLeadership(p.getLeadership());
        dto.setEspritEquipe(p.getEspritEquipe());
        dto.setMotivation(p.getMotivation());
        dto.setCvPath(p.getCvPath());
        dto.setCertificatsPath(p.getCertificatsPath());
        dto.setDocument(p.getDocument());
        dto.setDateCreationProfil(p.getDateCreationProfil() != null ? p.getDateCreationProfil().toString() : null);
        dto.setDateDerniereMiseAJour(p.getDateDerniereMiseAJour() != null ? p.getDateDerniereMiseAJour().toString() : null);
        return dto;
    }
}