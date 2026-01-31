package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.entity.CategorieDeSelection;
import esprit.PfeBackendProject.entity.CriteresDeSelection;
import esprit.PfeBackendProject.repository.CategorieDeSelectionRepository;
import esprit.PfeBackendProject.repository.CriteresDeSelectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CriteresDeSelectionService {

    private final CriteresDeSelectionRepository criteresRepository;
    private final CategorieDeSelectionRepository categorieDeSelectionRepository;

    public CriteresDeSelection save(CriteresDeSelection critere) {
        return criteresRepository.save(critere);
    }

    public Page<CriteresDeSelection> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        return criteresRepository.findAll(pageable);
    }

    public CriteresDeSelection findById(String id) {
        return criteresRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Critère non trouvé"));
    }


    public void delete(String id) {
        criteresRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Critère non trouvé"));
        criteresRepository.deleteById(id);
    }

    public CriteresDeSelection affecterCategories(
            String idCritere,
            List<String> idCategories
    ) {
        CriteresDeSelection critere = criteresRepository.findById(idCritere)
                .orElseThrow(() -> new RuntimeException("Critère introuvable"));

        // 🔐 Sécurité
        if (critere.getCategorieDeSelections() == null) {
            critere.setCategorieDeSelections(new ArrayList<>());
        }

        critere.getCategorieDeSelections().clear();

        for (String idCat : idCategories) {
            CategorieDeSelection cat = categorieDeSelectionRepository.findById(idCat)
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            critere.getCategorieDeSelections().add(cat);
        }

        return criteresRepository.save(critere);
    }

}

