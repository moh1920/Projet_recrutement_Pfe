import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GoogleSheetCandidat {
  index: string;
  nom: string;
  titre: string;
  resume: string;
  linkedin_url: string;
  offre_id: string;
  offre_titre: string;
  offre_specialite: string;
  offre_departement: string;
  offre_niveau: string;
  offre_modules: string;
  offre_skills: string;
  offre_type: string;
  offre_workload: string;
  offre_acad_exp: string;
  offre_experience: string;
  score: string;
  niveau_match: string;
  points_forts: string;
  points_faibles: string;
  recommandation: string;
  score_modules: string;
  score_niveau: string;
  score_experience: string;
  score_enseignement: string;
  score_autres: string;
  date_analyse: string;
  success: string;
  total_profils: string;
  top_contacter: string;
  top_a_considerer: string;
  meilleur_score: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleSheetsService {
  private readonly baseUrl = `${environment.apiUrl}/googleSheetCandidats`;

  constructor(private http: HttpClient) {}

  getCandidats(): Observable<GoogleSheetCandidat[]> {
    return this.http.get<GoogleSheetCandidat[]>(this.baseUrl);
  }
}
