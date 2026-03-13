package esprit.PfeBackendProject.configuration;

import esprit.PfeBackendProject.dto.OffreUpdateDto;
import esprit.PfeBackendProject.entity.Offre;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface OffreMapper {

    // ✅ Plus besoin de @Mapping explicites — les noms de champs sont identiques
    // NullValuePropertyMappingStrategy.IGNORE = les champs null du DTO ne remplacent pas l'existant
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateOffreFromDto(OffreUpdateDto dto, @MappingTarget Offre offre);
}