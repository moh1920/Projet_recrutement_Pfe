package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.entity.Candidature;
import esprit.PfeBackendProject.repository.CandidatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class CandidatureService {
    private final CandidatureRepository candidatureRepository;

    public Candidature createCandidature(Candidature candidature){
        return candidatureRepository.save(candidature);
    }
}
