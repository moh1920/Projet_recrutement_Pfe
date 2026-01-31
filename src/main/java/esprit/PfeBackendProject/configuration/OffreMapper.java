package esprit.PfeBackendProject.configuration;


import esprit.PfeBackendProject.dto.OffreUpdateDto;
import esprit.PfeBackendProject.entity.Offre;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface OffreMapper {

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateOffreFromDto(OffreUpdateDto dto, @MappingTarget Offre offre);
}
