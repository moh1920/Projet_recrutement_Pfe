package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.configuration.OffreMapper;
import esprit.PfeBackendProject.dto.OffreUpdateDto;
import esprit.PfeBackendProject.entity.CriteresDeSelection;
import esprit.PfeBackendProject.entity.Offre;
import esprit.PfeBackendProject.repository.CriteresDeSelectionRepository;
import esprit.PfeBackendProject.repository.OffreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class OffreService {

    private final OffreRepository offreRepository;
    private final OffreMapper offreMapper ;
    private final CriteresDeSelectionRepository criteresDeSelectionRepository;

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









}
