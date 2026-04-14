package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.dto.OffreDTO;
import esprit.PfeBackendProject.entity.CriteresDeSelection;
import esprit.PfeBackendProject.entity.Offre;
import esprit.PfeBackendProject.repository.*;
import esprit.PfeBackendProject.configuration.OffreMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OffreServiceTest {

    @Mock
    private OffreRepository offreRepository;

    @Mock
    private OffreMapper offreMapper;

    @Mock
    private CriteresDeSelectionRepository criteresRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private CandidatureRepository candidatureRepository;

    @Mock
    private esprit.PfeBackendProject.mapper.OffreMapper offreMapperc;

    @InjectMocks
    private OffreService offreService;

    private Offre offre;
    private OffreDTO offreDTO;

    @BeforeEach
    void setUp() {
        offre = new Offre();
        offre.setId("offre-123");
        offre.setTitle("Enseignant Informatique");
        offre.setDescription("Poste ouvert pour l'enseignement.");

        offreDTO = new OffreDTO();
        offreDTO.setId("offre-123");
        offreDTO.setTitle("Enseignant Informatique");
    }

    @Test
    void testFindById_Success() {
        when(offreRepository.findById("offre-123")).thenReturn(Optional.of(offre));

        Offre result = offreService.findById("offre-123");

        assertNotNull(result);
        assertEquals("offre-123", result.getId());
        assertEquals("Enseignant Informatique", result.getTitle());
        verify(offreRepository, times(1)).findById("offre-123");
    }

    @Test
    void testFindById_NotFound() {
        when(offreRepository.findById("offre-456")).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> {
            offreService.findById("offre-456");
        });

        assertEquals("Offre not found", exception.getMessage());
        verify(offreRepository, times(1)).findById("offre-456");
    }

    @Test
    void testFindAllDTO_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Offre> offresList = List.of(offre);
        Page<Offre> offrePage = new PageImpl<>(offresList, pageable, offresList.size());

        when(offreRepository.findAll(pageable)).thenReturn(offrePage);
        when(offreMapperc.toDTO(any(Offre.class))).thenReturn(offreDTO);

        Page<OffreDTO> resultPage = offreService.findAllDTO(0, 10);

        assertNotNull(resultPage);
        assertEquals(1, resultPage.getTotalElements());
        assertEquals("Enseignant Informatique", resultPage.getContent().get(0).getTitle());
        verify(offreRepository, times(1)).findAll(pageable);
        verify(offreMapperc, times(1)).toDTO(any(Offre.class));
    }

    @Test
    void testAffecterCriteresDeSelectionAtOffre_Success() {
        String idOffre = "offre-123";
        List<String> idCriteres = List.of("critere-1", "critere-2");
        
        CriteresDeSelection critere1 = new CriteresDeSelection();
        critere1.setId("critere-1");
        CriteresDeSelection critere2 = new CriteresDeSelection();
        critere2.setId("critere-2");

        when(offreRepository.findById(idOffre)).thenReturn(Optional.of(offre));
        when(criteresRepository.findById("critere-1")).thenReturn(Optional.of(critere1));
        when(criteresRepository.findById("critere-2")).thenReturn(Optional.of(critere2));
        when(offreRepository.save(any(Offre.class))).thenReturn(offre);

        Offre result = offreService.affecterCriteresDeSelectionAtOffre(idOffre, idCriteres);

        assertNotNull(result);
        assertEquals(2, result.getCriteresDeSelections().size());
        verify(offreRepository, times(1)).findById(idOffre);
        verify(criteresRepository, times(1)).findById("critere-1");
        verify(criteresRepository, times(1)).findById("critere-2");
        verify(offreRepository, times(1)).save(offre);
    }
}
