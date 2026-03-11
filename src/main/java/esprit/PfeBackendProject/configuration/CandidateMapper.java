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

    // Mapping Entity -> DTO
    @Mapping(target = "fullName", expression = "java(candidate.getFullName())")
    CandidateDTO toDto(Candidate candidate);

    // Mapping DTO -> Entity
    @Mapping(target = "education", source = "education")
    Candidate toEntity(CandidateDTO candidateDTO);

    // List mappings
    List<CandidateDTO> toDtoList(List<Candidate> candidates);
    List<Candidate> toEntityList(List<CandidateDTO> candidateDTOs);

    // Nested mapping for Education
    Candidate.Education toEducationEntity(CandidateDTO.EducationDTO educationDTO);
    CandidateDTO.EducationDTO toEducationDto(Candidate.Education education);
}