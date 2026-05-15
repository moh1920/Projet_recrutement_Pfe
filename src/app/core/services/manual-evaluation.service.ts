import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CritereDeSelection {
  id: string;
  nom: string;
  description?: string;
  categorieDeSelections?: CategorieDeSelection[];
}

export interface CategorieDeSelection {
  id?: string;
  nom: string;
  poids?: number;
}

export interface ManualEvaluationRequest {
  offreId: string;
  candidatId: string;
  evaluateurId: string;
  noteParCritere: { [key: string]: number };
}

export interface ManualScoreResult {
  candidatId: string;
  offreId: string;
  scoreFinal: number;
  detailParCritere: { [key: string]: number };
  appreciation: string;
  evaluateurId: string;
  evaluatedAt: string;
}

export interface ManualEvaluation {
  id: string;
  offreId: string;
  candidatId: string;
  evaluateurId: string;
  noteParCritere: { [key: string]: number };
  scoreFinal: number;
  appreciation: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManualEvaluationService {
  private apiUrl = `${environment.apiUrl}/evaluations`;

  constructor(private http: HttpClient) {}

  submitEvaluation(request: ManualEvaluationRequest): Observable<ManualScoreResult> {
    return this.http.post<ManualScoreResult>(`${this.apiUrl}/submitEvaluation`, request);
  }

  getClassement(offreId: string): Observable<ManualEvaluation[]> {
    return this.http.get<ManualEvaluation[]>(`${this.apiUrl}/offre/${offreId}/classement`);
  }

  getCriteres(offreId: string): Observable<CritereDeSelection[]> {
    return this.http.get<CritereDeSelection[]>(`${this.apiUrl}/offre/${offreId}/criteres`);
  }

  getManualEvaluationByCandidatsId(candidatId: string): Observable<ManualEvaluation> {
    return this.http.get<ManualEvaluation>(`${this.apiUrl}/getManualEvaluationByCandidatsId/${candidatId}`);
  }
}
