// matching.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {MatchResult} from "../models/matching.model";

@Injectable({
  providedIn: 'root'
})
export class MatchingService {

  private readonly apiUrl = 'http://localhost:8020/api/matching';

  constructor(private http: HttpClient) {}

  /**
   * Endpoint 1 : Classer tous les candidats ayant postulé pour UNE offre spécifique.
   * GET /api/matching/offers/{offerId}/candidates
   */
  getBestCandidatesForOffer(offerId: string): Observable<MatchResult[]> {
    return this.http.get<MatchResult[]>(`${this.apiUrl}/offers/${offerId}/candidates`);
  }

  /**
   * Endpoint 2 : Classer toutes les offres ouvertes pour UN candidat spécifique.
   * GET /api/matching/candidates/{candidateId}/offers
   */
  getBestOffersForCandidate(candidateId: string): Observable<MatchResult[]> {
    return this.http.get<MatchResult[]>(`${this.apiUrl}/candidates/${candidateId}/offers`);
  }
  rankOffersForProfile(profileId: string): Observable<MatchResult[]> {
    return this.http.get<MatchResult[]>(
      `${this.apiUrl}/rankOffersForProfile/${profileId}`
    );
  }
}
