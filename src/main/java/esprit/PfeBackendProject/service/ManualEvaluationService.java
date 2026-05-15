    package esprit.PfeBackendProject.service;

    import esprit.PfeBackendProject.dto.ManualEvaluationRequest;
    import esprit.PfeBackendProject.dto.ManualScoreResult;
    import esprit.PfeBackendProject.entity.CriteresDeSelection;
    import esprit.PfeBackendProject.entity.ManualEvaluation;
    import esprit.PfeBackendProject.entity.Offre;
    import esprit.PfeBackendProject.repository.ManualEvaluationRepository;
    import esprit.PfeBackendProject.repository.OffreRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.stereotype.Service;

    import java.time.LocalDateTime;
    import java.util.Comparator;
    import java.util.LinkedHashMap;
    import java.util.List;
    import java.util.Map;
    import java.util.stream.Collectors;

    @Service
    @RequiredArgsConstructor
    public class ManualEvaluationService {

        private final OffreRepository offreRepository;
        private final ManualEvaluationRepository evaluationRepository;

        public ManualScoreResult evaluate(ManualEvaluationRequest request) {

            Offre offre = offreRepository.findById(request.getOffreId())
                    .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

            List<CriteresDeSelection> criteres = offre.getCriteresDeSelections();
            if (criteres == null || criteres.isEmpty())
                throw new RuntimeException("Aucun critère pour cette offre");

            float poidsTotal  = 0f;
            float scoreObtenu = 0f;
            Map<String, Float> detail = new LinkedHashMap<>();

            for (CriteresDeSelection critere : criteres) {

                // Poids du critère = somme des poids de ses catégories
                float poidsCritere = 0f;
                if (critere.getCategorieDeSelections() != null) {
                    poidsCritere = critere.getCategorieDeSelections().stream()
                            .map(c -> c.getPoids() != null ? c.getPoids() : 1f)
                            .reduce(0f, Float::sum);
                }
                if (poidsCritere == 0f) poidsCritere = 1f; // fallback

                // Note donnée par l'admin pour ce critère (0 si non renseignée)
                Float note = request.getNoteParCritere()
                        .getOrDefault(critere.getId(), 0f);

                poidsTotal  += poidsCritere;
                scoreObtenu += poidsCritere * (note / 100f);

                detail.put(critere.getNom(), note);
            }

            float scoreFinal = poidsTotal == 0f ? 0f
                    : Math.round((scoreObtenu / poidsTotal) * 10000f) / 100f;

            // Persister
            ManualEvaluation eval = ManualEvaluation.builder()
                    .offreId(request.getOffreId())
                    .candidatId(request.getCandidatId())
                    .evaluateurId(request.getEvaluateurId())
                    .noteParCritere(request.getNoteParCritere())
                    .scoreFinal(scoreFinal)
                    .appreciation(getAppreciation(scoreFinal))
                    .createdAt(LocalDateTime.now())
                    .build();
            evaluationRepository.save(eval);

            return ManualScoreResult.builder()
                    .candidatId(request.getCandidatId())
                    .offreId(request.getOffreId())
                    .scoreFinal(scoreFinal)
                    .detailParCritere(detail)
                    .appreciation(getAppreciation(scoreFinal))
                    .evaluateurId(request.getEvaluateurId())
                    .evaluatedAt(eval.getCreatedAt())
                    .build();
        }

        // Récupérer toutes les évaluations d'une offre classées par score
        public List<ManualEvaluation> getClassementByOffre(String offreId) {
            return evaluationRepository.findByOffreId(offreId)
                    .stream()
                    .sorted(Comparator.comparing(ManualEvaluation::getScoreFinal).reversed())
                    .collect(Collectors.toList());
        }

        private String getAppreciation(float score) {
            if (score >= 80) return "Excellent";
            if (score >= 60) return "Bon";
            if (score >= 40) return "Moyen";
            return "Insuffisant";
        }
        public ManualEvaluation getManualEvaluationByCandidatsId(String idCandidats) {
             return evaluationRepository.findByCandidatId(idCandidats)
                    .orElseThrow(() -> new RuntimeException("Evaluation non trouvée pour le candidat : " + idCandidats));
        }

    }
