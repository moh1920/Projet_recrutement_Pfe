package esprit.PfeBackendProject.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class N8nScoringResponse {

    private Boolean success;

    @JsonProperty("offre_id")
    private String offreId;

    @JsonProperty("offre_titre")
    private String offreTitre;

    @JsonProperty("total_profils")
    private Integer totalProfils;

    @JsonProperty("top_contacter")
    private Integer topContacter;

    @JsonProperty("top_a_considerer")
    private Integer topAConsiderer;

    @JsonProperty("meilleur_score")
    private Integer meilleurScore;

    @JsonProperty("meilleur_candidat")
    private String meilleurCandidat;

    @JsonProperty("date_analyse")
    private String dateAnalyse;

    private List<ProfilScore> profiles;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProfilScore {

        private Integer rang;
        private String nom;
        private String titre;

        @JsonProperty("linkedin_url")
        private String linkedinUrl;

        @JsonProperty("score_compatibilite")
        private Integer scoreCompatibilite;

        @JsonProperty("niveau_match")
        private String niveauMatch;

        private String recommandation;

        @JsonProperty("points_forts")
        private String pointsForts;

        @JsonProperty("points_faibles")
        private String pointsFaibles;

        @JsonProperty("scores_detail")
        private ScoreDetail scoresDetail;

        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ScoreDetail {
            private Integer modules;
            private Integer niveau;
            private Integer experience;
            private Integer enseignement;
            private Integer autres;

            public Integer getModules() { return modules; }
            public void setModules(Integer v) { this.modules = v; }
            public Integer getNiveau() { return niveau; }
            public void setNiveau(Integer v) { this.niveau = v; }
            public Integer getExperience() { return experience; }
            public void setExperience(Integer v) { this.experience = v; }
            public Integer getEnseignement() { return enseignement; }
            public void setEnseignement(Integer v) { this.enseignement = v; }
            public Integer getAutres() { return autres; }
            public void setAutres(Integer v) { this.autres = v; }
        }

        // Getters / Setters
        public Integer getRang() { return rang; }
        public void setRang(Integer v) { this.rang = v; }
        public String getNom() { return nom; }
        public void setNom(String v) { this.nom = v; }
        public String getTitre() { return titre; }
        public void setTitre(String v) { this.titre = v; }
        public String getLinkedinUrl() { return linkedinUrl; }
        public void setLinkedinUrl(String v) { this.linkedinUrl = v; }
        public Integer getScoreCompatibilite() { return scoreCompatibilite; }
        public void setScoreCompatibilite(Integer v) { this.scoreCompatibilite = v; }
        public String getNiveauMatch() { return niveauMatch; }
        public void setNiveauMatch(String v) { this.niveauMatch = v; }
        public String getRecommandation() { return recommandation; }
        public void setRecommandation(String v) { this.recommandation = v; }
        public String getPointsForts() { return pointsForts; }
        public void setPointsForts(String v) { this.pointsForts = v; }
        public String getPointsFaibles() { return pointsFaibles; }
        public void setPointsFaibles(String v) { this.pointsFaibles = v; }
        public ScoreDetail getScoresDetail() { return scoresDetail; }
        public void setScoresDetail(ScoreDetail v) { this.scoresDetail = v; }
    }

    // Getters / Setters
    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean v) { this.success = v; }
    public String getOffreId() { return offreId; }
    public void setOffreId(String v) { this.offreId = v; }
    public String getOffreTitre() { return offreTitre; }
    public void setOffreTitre(String v) { this.offreTitre = v; }
    public Integer getTotalProfils() { return totalProfils; }
    public void setTotalProfils(Integer v) { this.totalProfils = v; }
    public Integer getTopContacter() { return topContacter; }
    public void setTopContacter(Integer v) { this.topContacter = v; }
    public Integer getTopAConsiderer() { return topAConsiderer; }
    public void setTopAConsiderer(Integer v) { this.topAConsiderer = v; }
    public Integer getMeilleurScore() { return meilleurScore; }
    public void setMeilleurScore(Integer v) { this.meilleurScore = v; }
    public String getMeilleurCandidat() { return meilleurCandidat; }
    public void setMeilleurCandidat(String v) { this.meilleurCandidat = v; }
    public String getDateAnalyse() { return dateAnalyse; }
    public void setDateAnalyse(String v) { this.dateAnalyse = v; }
    public List<ProfilScore> getProfiles() { return profiles; }
    public void setProfiles(List<ProfilScore> v) { this.profiles = v; }
}