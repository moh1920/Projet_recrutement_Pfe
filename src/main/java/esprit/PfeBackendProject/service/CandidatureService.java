package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.entity.Candidate;
import esprit.PfeBackendProject.entity.Candidature;
import esprit.PfeBackendProject.repository.CandidateRepository;
import esprit.PfeBackendProject.repository.CandidatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class CandidatureService {
    private final CandidateRepository candidatureRepository;

    public Candidate createCandidature(Candidate candidature){
        return candidatureRepository.save(candidature);
    }
}
