package esprit.PfeBackendProject.mapper;


import esprit.PfeBackendProject.dto.OffreDTO;
import esprit.PfeBackendProject.entity.CriteresDeSelection;
import esprit.PfeBackendProject.entity.Offre;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class OffreMapper {

    // Entity → DTO
    public OffreDTO toDTO(Offre offre) {
        if (offre == null) return null;

        return OffreDTO.builder()
                .id(offre.getId())
                .title(offre.getTitle())
                .description(offre.getDescription())
                .department(offre.getDepartment())
                .speciality(offre.getSpeciality())
                .type(offre.getType())
                .workload(offre.getWorkload())
                .requiredLevel(offre.getRequiredLevel())
                .modules(offre.getModules())
                .minYearsExperience(offre.getMinYearsExperience())
                .academicExperience(offre.getAcademicExperience())
                .requiredSkills(offre.getRequiredSkills())
                .postedDate(offre.getPostedDate())
                .deadline(offre.getDeadline())
                .status(offre.getStatus())
                .createdBy(offre.getCreatedBy())
                .createdAt(offre.getCreatedAt())
                .candidateCount(offre.getCandidateCount())
                .criteresDeSelectionIds(
                        offre.getCriteresDeSelections() != null
                                ? offre.getCriteresDeSelections().stream()
                                .map(CriteresDeSelection::getNom)
                                .collect(Collectors.toList())
                                : Collections.emptyList()
                )
                .build();
    }

    // DTO → Entity
    public Offre toEntity(OffreDTO dto) {
        if (dto == null) return null;

        return Offre.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .department(dto.getDepartment())
                .speciality(dto.getSpeciality())
                .type(dto.getType())
                .workload(dto.getWorkload())
                .requiredLevel(dto.getRequiredLevel())
                .modules(dto.getModules())
                .minYearsExperience(dto.getMinYearsExperience())
                .academicExperience(dto.getAcademicExperience())
                .requiredSkills(dto.getRequiredSkills())
                .postedDate(dto.getPostedDate())
                .deadline(dto.getDeadline())
                .status(dto.getStatus())
                .createdBy(dto.getCreatedBy())
                .createdAt(dto.getCreatedAt())
                .candidateCount(dto.getCandidateCount())
                // CriteresDeSelection must be resolved from DB by service layer
                .criteresDeSelections(null)
                .build();
    }

    // List helper methods
    public List<OffreDTO> toDTOList(List<Offre> offres) {
        if (offres == null) return Collections.emptyList();
        return offres.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<Offre> toEntityList(List<OffreDTO> dtos) {
        if (dtos == null) return Collections.emptyList();
        return dtos.stream().map(this::toEntity).collect(Collectors.toList());
    }
}