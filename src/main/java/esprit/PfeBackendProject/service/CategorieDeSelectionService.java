package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.entity.CategorieDeSelection;
import esprit.PfeBackendProject.repository.CategorieDeSelectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategorieDeSelectionService {

    private final CategorieDeSelectionRepository categorieRepo ;


    public CategorieDeSelection addCategorie(CategorieDeSelection categorie) {
        return categorieRepo.save(categorie);
    }

    public Page<CategorieDeSelection> getAllCategories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return categorieRepo.findAll(pageable);
    }

    public CategorieDeSelection getCategorieById(String id) {
        return categorieRepo.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Catégorie non trouvée avec id : " + id));
    }

    public CategorieDeSelection updateCategorie(String id, CategorieDeSelection newData) {
        CategorieDeSelection existing = getCategorieById(id);

        existing.setNom(newData.getNom());
        existing.setDescription(newData.getDescription());
        existing.setPoids(newData.getPoids());

        return categorieRepo.save(existing);
    }

    public void deleteCategorie(String id) {
        categorieRepo.deleteById(id);
    }

}
