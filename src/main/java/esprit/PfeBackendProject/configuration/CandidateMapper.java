package esprit.PfeBackendProject.configuration;


import esprit.PfeBackendProject.dto.CandidateDTO;
import esprit.PfeBackendProject.entity.Candidate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CandidateMapper {

    CandidateMapper INSTANCE = Mappers.getMapper(CandidateMapper.class);

    // ─── Entity -> DTO ───────────────────────────────────────────────────────
    @Mapping(target = "fullName", expression = "java(candidate.getFullName())")
    @Mapping(target = "steps", source = "steps")        // ✅ Ajouté
    @Mapping(target = "education", source = "education")
    CandidateDTO toDto(Candidate candidate);

    // ─── DTO -> Entity ───────────────────────────────────────────────────────
    @Mapping(target = "education", source = "education")
    @Mapping(target = "steps", source = "steps")        // ✅ Ajouté
    Candidate toEntity(CandidateDTO candidateDTO);

    // ─── List mappings ───────────────────────────────────────────────────────
    List<CandidateDTO> toDtoList(List<Candidate> candidates);
    List<Candidate> toEntityList(List<CandidateDTO> candidateDTOs);

    // ─── Nested: Education ───────────────────────────────────────────────────
    Candidate.Education toEducationEntity(CandidateDTO.EducationDTO educationDTO);
    CandidateDTO.EducationDTO toEducationDto(Candidate.Education education);

    // ─── Nested: Step ────────────────────────────────────────────────────────
    Candidate.Step toStepEntity(CandidateDTO.StepDTO stepDTO);   // ✅ Ajouté
    CandidateDTO.StepDTO toStepDto(Candidate.Step step);         // ✅ Ajouté
}