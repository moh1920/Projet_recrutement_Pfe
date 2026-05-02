package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.configuration.CandidateMapper;
import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.entity.CandidateStatus;
import esprit.PfeBackendProject.entity.Offre;
import esprit.PfeBackendProject.entity.ProfileDetails;
import esprit.PfeBackendProject.repository.CandidateRepository;
import esprit.PfeBackendProject.repository.OffreRepository;
import esprit.PfeBackendProject.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidatureServiceTest {

    @Mock
    private CandidateRepository candidatureRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private CandidateMapper candidateMapper;

    @Mock
    private OffreRepository offreRepository;

    @InjectMocks
    private CandidatureService candidatureService;

    private Offre offre;
    private ProfileDetails profileDetails;
    private Candidate candidate;

    @BeforeEach
    void setUp() {
        offre = new Offre();
        offre.setId("offre-1");
        offre.setTitle("Enseignant Physique");
        offre.setCandidateCount(0);

        profileDetails = new ProfileDetails();
        profileDetails.setId("profile-1");
        profileDetails.setNom("Jean Dupont");
        profileDetails.setEmail("jean.dupont@test.com");
        profileDetails.setTelephone("12345678");
        profileDetails.setCvPath("/path/to/cv.pdf");
        profileDetails.setNbAnneesExperience(5);
        profileDetails.setNiveauDiplome("Doctorat");
        profileDetails.setUniversite("Université de Paris");
        profileDetails.setSpecialite("Physique quantique");
        profileDetails.setAnneeDiplome(2020);
        profileDetails.setLangages(new ArrayList<>(List.of("Java", "Python")));

        candidate = new Candidate();
        candidate.setId("cand-1");
        candidate.setIdProfile("profile-1");
        candidate.setIdOffre("offre-1");
        candidate.setStatus(CandidateStatus.NOUVEAU);
    }

    @Test
    void testPostulerCandidature_Success() {
        when(offreRepository.findById("offre-1")).thenReturn(Optional.of(offre));
        when(candidatureRepository.findByIdProfile("profile-1")).thenReturn(null);
        when(profileRepository.findById("profile-1")).thenReturn(Optional.of(profileDetails));
        when(offreRepository.save(any(Offre.class))).thenReturn(offre);
        when(candidatureRepository.save(any(Candidate.class))).thenAnswer(i -> i.getArguments()[0]);

        Candidate result = candidatureService.postulerCandidature("profile-1", "offre-1");

        assertNotNull(result);
        assertEquals("profile-1", result.getIdProfile());
        assertEquals("offre-1", result.getIdOffre());
        assertEquals("Jean", result.getFirstName());
        assertEquals("Dupont", result.getLastName());
        assertEquals("jean.dupont@test.com", result.getEmail());
        assertEquals("/path/to/cv.pdf", result.getResume());
        assertEquals(5, result.getExperience());
        assertEquals(CandidateStatus.NOUVEAU, result.getStatus());
        assertTrue(result.getSkills().contains("Java"));
        assertTrue(result.getSkills().contains("Python"));
        assertEquals(1, offre.getCandidateCount()); // Verifier l'incrémentation

        verify(offreRepository, times(1)).findById("offre-1");
        verify(profileRepository, times(1)).findById("profile-1");
        verify(offreRepository, times(1)).save(offre);
        verify(candidatureRepository, times(1)).save(any(Candidate.class));
    }

    @Test
    void testPostulerCandidature_OffreNotFound() {
        when(offreRepository.findById("offre-unknown")).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> {
            candidatureService.postulerCandidature("profile-1", "offre-unknown");
        });

        assertEquals("offre not found", exception.getMessage());
        verify(offreRepository, times(1)).findById("offre-unknown");
        verifyNoInteractions(profileRepository);
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    void testPostulerCandidature_AlreadyApplied() {
        when(offreRepository.findById("offre-1")).thenReturn(Optional.of(offre));

        // ✅ Mock la nouvelle méthode
        when(candidatureRepository.existsByIdProfileAndIdOffre("profile-1", "offre-1"))
                .thenReturn(true);

        Exception exception = assertThrows(RuntimeException.class, () -> {
            candidatureService.postulerCandidature("profile-1", "offre-1");
        });

        assertEquals("le profile est deja postuler", exception.getMessage());
        verify(offreRepository, times(1)).findById("offre-1");
        verifyNoInteractions(profileRepository);
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    void testAddStep_Success() {
        when(candidatureRepository.findById("cand-1")).thenReturn(Optional.of(candidate));
        when(candidatureRepository.save(any(Candidate.class))).thenAnswer(i -> i.getArguments()[0]);

        Candidate.Step step = Candidate.Step.builder()
                .name("Entretien Technique")
                .status(Candidate.StepStatus.pending)
                .build();

        Candidate result = candidatureService.addStep("cand-1", step);

        assertNotNull(result);
        assertNotNull(result.getSteps());
        assertEquals(1, result.getSteps().size());
        assertEquals("Entretien Technique", result.getSteps().get(0).getName());
        verify(candidatureRepository, times(1)).save(candidate);
    }

    @Test
    void testUpdateStepStatus_Success() {
        Candidate.Step step = Candidate.Step.builder()
                .name("Entretien Technique")
                .status(Candidate.StepStatus.pending)
                .build();
        List<Candidate.Step> steps = new ArrayList<>();
        steps.add(step);
        candidate.setSteps(steps);

        when(candidatureRepository.findById("cand-1")).thenReturn(Optional.of(candidate));
        when(candidatureRepository.save(any(Candidate.class))).thenAnswer(i -> i.getArguments()[0]);

        Candidate result = candidatureService.updateStepStatus("cand-1", "Entretien Technique", Candidate.StepStatus.completed, "2023-10-10");

        assertNotNull(result);
        assertEquals(Candidate.StepStatus.completed, result.getSteps().get(0).getStatus());
        assertEquals("2023-10-10", result.getSteps().get(0).getDate());
        verify(candidatureRepository, times(1)).save(candidate);
    }
}
