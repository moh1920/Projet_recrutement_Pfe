import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface CandidateDTO {
  id?: string;
  idProfile?: string;
  idOffre?: string;

  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  resume?: string;
  portfolio?: string;
  linkedin?: string;

  experience?: number;
  education?: EducationDTO[];
  skills?: string[];

  appliedPosition?: string;
  appliedDate?: string;
  status?: CandidateStatus;
  steps?: StepDTO[]; // ✅ Ajouté

  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  fullName?: string;
  aiScore?: number; // ✅ Added for AI score
  finalComment?: string; // ✅ Added for final decision comment
}

export interface EducationDTO {
  degree?: string;
  institution?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export interface StepDTO {
  name?: string;
  status?: StepStatus;
  date?: string;
  icon?: string;
  description?: string;
  score?: number; // ✅ Added for step score
}

export enum CandidateStatus {
  NOUVEAU = 'NOUVEAU',
  EN_COURS = 'EN_COURS',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EN_ATTENTE = 'EN_ATTENTE',
}

export enum StepStatus {
  completed = 'completed',
  current = 'current',
  pending = 'pending',
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class CandidateService {
  private apiUrl = `${environment.apiUrl}/candidature`;

  constructor(private http: HttpClient) {}

  // ─── Candidature ──────────────────────────────────────────────────────────

  postulerCandidature(idProfile: string, idOffre: string): Observable<CandidateDTO> {
    return this.http.post<CandidateDTO>(
      `${this.apiUrl}/postulerCandidature/${idProfile}/${idOffre}`,
      {}
    );
  }

  createCandidature(candidate: CandidateDTO): Observable<CandidateDTO> {
    return this.http.post<CandidateDTO>(`${this.apiUrl}/createCandidature`, candidate);
  }

  getAllCandidature(): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(`${this.apiUrl}/getAllCandidature`);
  }

  getAllCandidatureByProfile(idProfile: string): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(`${this.apiUrl}/getAllCandidatureByProfile/${idProfile}`);
  }

  getAllCandidatureByOffre(idOffre: string): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(`${this.apiUrl}/getAllCandidatureByOffre/${idOffre}`);
  }

  getAllCandidatureById(id: string): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(`${this.apiUrl}/getAllCandidatureById/${id}`);
  }

  // ─── Steps ────────────────────────────────────────────────────────────────

  /**
   * GET /candidature/{id}/steps
   * Récupérer toutes les étapes d'un candidat
   */
  getSteps(id: string): Observable<StepDTO[]> {
    return this.http.get<StepDTO[]>(`${this.apiUrl}/${id}/steps`);
  }

  /**
   * POST /candidature/{id}/steps
   * Ajouter une seule étape
   */
  addStep(id: string, step: StepDTO): Observable<CandidateDTO> {
    return this.http.post<CandidateDTO>(`${this.apiUrl}/${id}/steps`, step);
  }

  /**
   * PUT /candidature/{id}/steps
   * Remplacer toute la liste des étapes
   */
  updateSteps(id: string, steps: StepDTO[]): Observable<CandidateDTO> {
    return this.http.put<CandidateDTO>(`${this.apiUrl}/${id}/steps`, steps);
  }

  /**
   * PATCH /candidature/{id}/steps/{stepName}?status=completed&date=21 Mars 2026
   * Mettre à jour le statut d'une étape précise
   */
  updateStepStatus(
    id: string,
    stepName: string,
    status: StepStatus,
    date?: string
  ): Observable<CandidateDTO> {
    let params: any = { status };
    if (date) params['date'] = date;

    return this.http.patch<CandidateDTO>(
      `${this.apiUrl}/${id}/steps/${encodeURIComponent(stepName)}`,
      {},
      { params }
    );
  }

  /**
   * DELETE /candidature/{id}/steps/{stepName}
   * Supprimer une étape par son nom
   */
  deleteStep(id: string, stepName: string): Observable<CandidateDTO> {
    return this.http.delete<CandidateDTO>(
      `${this.apiUrl}/${id}/steps/${encodeURIComponent(stepName)}`
    );
  }
  updateStatus(id: string, status: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/updateStatus/${id}/${status}`,
      {}
    );
  }
  deleteCandidate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteCandidature/${id}`);
  }
}
