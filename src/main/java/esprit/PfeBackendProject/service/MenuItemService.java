package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.dto.MenuItemDTO;
import esprit.PfeBackendProject.entity.MenuItem;
import esprit.PfeBackendProject.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;

    // -------------------------------------------------------
    // Retourne tous les items sous forme d'arbre (parent → enfants)
    // -------------------------------------------------------
    public List<MenuItemDTO> getFullTree() {
        List<MenuItem> all = menuItemRepository.findAllByOrderBySortOrderAsc();
        return buildTree(all, null);
    }

    // -------------------------------------------------------
    // Retourne l'arbre filtré selon les IDs autorisés pour un rôle
    // -------------------------------------------------------
    public List<MenuItemDTO> getFilteredTree(Set<String> allowedIds) {
        List<MenuItem> all = menuItemRepository.findAllByOrderBySortOrderAsc();

        // Items directement autorisés
        List<MenuItem> filtered = all.stream()
                .filter(item -> allowedIds.contains(item.getId()))
                .collect(Collectors.toList());

        // Ajouter les parents manquants pour garder la hiérarchie
        Set<String> filteredIds = filtered.stream()
                .map(MenuItem::getId)
                .collect(Collectors.toSet());

        Set<MenuItem> withParents = new LinkedHashSet<>(filtered);

        for (MenuItem item : filtered) {
            String parentId = item.getParentId();
            while (parentId != null) {
                String pid = parentId;
                if (filteredIds.contains(pid)) break; // déjà présent

                Optional<MenuItem> parent = all.stream()
                        .filter(p -> p.getId().equals(pid))
                        .findFirst();

                if (parent.isPresent()) {
                    withParents.add(parent.get());
                    filteredIds.add(parent.get().getId());
                    parentId = parent.get().getParentId(); // remonter encore
                } else {
                    break;
                }
            }
        }

        return buildTree(new ArrayList<>(withParents), null);
    }

    // -------------------------------------------------------
    // Construction récursive de l'arbre
    // -------------------------------------------------------
    private List<MenuItemDTO> buildTree(List<MenuItem> items, String parentId) {
        return items.stream()
                .filter(item -> Objects.equals(item.getParentId(), parentId))
                .map(item -> {
                    MenuItemDTO dto = toDTO(item);
                    List<MenuItemDTO> children = buildTree(items, item.getId());
                    dto.setChildren(children.isEmpty() ? null : children);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------
    // CRUD Menu Items
    // -------------------------------------------------------
    public List<MenuItem> findAll() {
        return menuItemRepository.findAllByOrderBySortOrderAsc();
    }

    public MenuItem save(MenuItem item) {
        if (item.getParentId() != null && item.getParentId().isEmpty()) {
            item.setParentId(null);
        }
        return menuItemRepository.save(item);
    }
    public void delete(String id) {
        menuItemRepository.deleteById(id);
    }

    public Optional<MenuItem> findById(String id) {
        return menuItemRepository.findById(id);
    }

    // -------------------------------------------------------
    // Mapper
    // -------------------------------------------------------
    private MenuItemDTO toDTO(MenuItem item) {
        MenuItemDTO dto = new MenuItemDTO();
        dto.setId(item.getId());
        dto.setLabel(item.getLabel());
        dto.setIcon(item.getIcon());
        dto.setRoute(item.getRoute());
        dto.setParentId(item.getParentId());
        dto.setSortOrder(item.getSortOrder());
        dto.setActive(item.isActive());
        return dto;
    }
}