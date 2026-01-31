export interface CvData {
  identification: {
    email: string;
    telephone: string;
  };

  competences: {
    langages: string[];
    frameworks: string[];
    data: string[];
    ia: string[];
    erp: string[];
  };

  experience: {
    nb_annees_experience: number;
    experience_academique: boolean;
  };

  scores_ia: {
    score_competences: number;
    score_experience: number;
    score_global: number;
  };
}
