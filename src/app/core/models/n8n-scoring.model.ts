export interface ScoreDetail {
  modules: number;
  niveau: number;
  experience: number;
  enseignement: number;
  autres: number;
}

export interface ProfilScore {
  rang: number;
  nom: string;
  titre: string;
  linkedin_url: string;
  score_compatibilite: number;
  niveau_match: string;
  recommandation: string;
  points_forts: string;
  points_faibles: string;
  scores_detail: ScoreDetail;
}

export interface N8nScoringResponse {
  success: boolean;
  offre_id: string;
  offre_titre: string;
  total_profils: number;
  top_contacter: number;
  top_a_considerer: number;
  meilleur_score: number;
  meilleur_candidat: string;
  date_analyse: string;
  profiles: ProfilScore[];
}
