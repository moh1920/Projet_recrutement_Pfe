// src/app/services/meeting-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meeting } from '../models/meeting.models';
import { environment } from '../../../environments/environment';

/**
 * Service HTTP pour les opérations REST sur les meetings.
 * Votre intercepteur Keycloak existant ajoute automatiquement le token.
 */
@Injectable({ providedIn: 'root' })
export class MeetingApiService {
  private readonly apiUrl = `${environment.apiUrl}/meetings`;

  constructor(private http: HttpClient) {}

  /** Créer un nouveau salon */
  createMeeting(title: string): Observable<Meeting> {
    return this.http.post<Meeting>(`${this.apiUrl}/create`, { title });
  }

  /** Vérifier qu'un salon existe (avant de rejoindre) */
  checkRoom(roomCode: string): Observable<Meeting> {
    return this.http.get<Meeting>(`${this.apiUrl}/check/${roomCode}`);
  }
}
