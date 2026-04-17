import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Offre } from '../models/offre.model';
import { environment } from '../../../environments/environment';

// ─── Mapping Backend ↔ Frontend ──────────────────────────────────────────────
const STATUS_TO_BACKEND: Record<string, string> = {
  'Ouverte':  'OPEN',
  'En cours': 'IN_PROGRESS',
  'Fermée':   'CLOSED'
};

const STATUS_TO_FRONTEND: Record<string, string> = {
  'OPEN':        'Ouverte',
  'IN_PROGRESS': 'En cours',
  'CLOSED':      'Fermée'
};

const TYPE_TO_BACKEND: Record<string, string> = {
  'Permanent': 'PERMANENT',
  'Vacataire': 'VACATAIRE'
};

const TYPE_TO_FRONTEND: Record<string, string> = {
  'PERMANENT': 'Permanent',
  'VACATAIRE': 'Vacataire'
};

const LEVEL_TO_BACKEND: Record<string, string> = {
  'Licence':  'LICENCE',
  'Master':   'MASTER',
  'Doctorat': 'DOCTORAT'
};

const LEVEL_TO_FRONTEND: Record<string, string> = {
  'LICENCE':  'Licence',
  'MASTER':   'Master',
  'DOCTORAT': 'Doctorat'
};

// Convertit une offre reçue du backend vers le format frontend
function toFrontend(o: any): Offre {
  return {
    ...o,
    status:        STATUS_TO_FRONTEND[o.status]        ?? o.status,
    type:          TYPE_TO_FRONTEND[o.type]            ?? o.type,
    requiredLevel: LEVEL_TO_FRONTEND[o.requiredLevel]  ?? o.requiredLevel
  };
}

// Convertit une offre frontend vers le format attendu par le backend
function toBackend(o: Offre): any {
  return {
    ...o,
    status:        STATUS_TO_BACKEND[o.status!]        ?? o.status,
    type:          TYPE_TO_BACKEND[o.type]             ?? o.type,
    requiredLevel: LEVEL_TO_BACKEND[o.requiredLevel]   ?? o.requiredLevel
  };
}

@Injectable({
  providedIn: 'root'
})
export class OffreService {

  private readonly baseUrl = `${environment.apiUrl}/offre`;

  constructor(private http: HttpClient) {}

  createOffre(offre: Offre): Observable<Offre> {
    return this.http.post<any>(
      `${this.baseUrl}/create`,
      toBackend(offre)
    ).pipe(map(toFrontend));
  }

  getAllOffres(page: number = 0, size: number = 5): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(
      `${this.baseUrl}/getAll`,
      { params }
    ).pipe(
      map(res => ({
        ...res,
        content: (res.content ?? res).map(toFrontend)
      }))
    );
  }

  getAllOffresSorted(
    page: number = 0,
    size: number = 5,
    sortBy: string = 'dateCreation'
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy);

    return this.http.get<any>(
      `${this.baseUrl}/getAllSorted`,
      { params }
    ).pipe(
      map(res => ({
        ...res,
        content: (res.content ?? res).map(toFrontend)
      }))
    );
  }

  getOffreById(id: string): Observable<Offre> {
    return this.http.get<any>(
      `${this.baseUrl}/getById/${id}`
    ).pipe(map(toFrontend));
  }

  updateOffre(id: string, offre: Offre): Observable<Offre> {
    return this.http.put<any>(
      `${this.baseUrl}/update/${id}`,
      toBackend(offre)
    ).pipe(map(toFrontend));
  }

  deleteOffre(id: string): Observable<string> {
    return this.http.delete(
      `${this.baseUrl}/delete/${id}`,
      { responseType: 'text' }
    );
  }

  affecterCriteresDeSelection(
    idOffre: string,
    idCriteres: (string | undefined)[]
  ): Observable<Offre> {
    return this.http.put<any>(
      `${this.baseUrl}/affecterCriteresDeSelection/${idOffre}`,
      idCriteres
    ).pipe(map(toFrontend));
  }
}
