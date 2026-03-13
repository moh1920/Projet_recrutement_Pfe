
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {HttpClient} from "@angular/common/http";

// export interface Candidate {
//     id: string;
//     name: string;
//     email: string;
//     phone: string;
//     specialty: string;
//     experience: number;
//     score: number;
//     status: 'Nouveau' | 'Analysé' | 'Entretien' | 'Admis' | 'Rejeté';
//     appliedDate: Date;
// }

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

  notes?: string;
  createdAt?: string;
  updatedAt?: string;

  fullName?: string;
}

export interface EducationDTO {
  degree?: string;
  institution?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export enum CandidateStatus {
  NOUVEAU = 'NOUVEAU',
  EN_COURS = 'EN_COURS',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EN_ATTENTE = 'EN_ATTENTE'
}


@Injectable({
    providedIn: 'root'
})
export class CandidateService {

  private apiUrl = 'http://localhost:8020/candidature'; // URL de ton backend
  constructor(private http: HttpClient) {}





  postulerCandidature(idProfile: string, idOffre: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/postulerCandidature/${idProfile}/${idOffre}`,
      {}
    );
  }


  getAllCandidature(): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(`${this.apiUrl}/getAllCandidature`);
  }



  getAllCandidatureByProfile(idProfile: string): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(
      `${this.apiUrl}/getAllCandidatureByProfile/${idProfile}`
    );
  }
  getAllCandidatureByOffre(idOffre: string): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(`${this.apiUrl}/getAllCandidatureByOffre/${idOffre}`);
  }

  getAllCandidatureById(id: string): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(`${this.apiUrl}/getAllCandidatureById/${id}`);
  }
}
