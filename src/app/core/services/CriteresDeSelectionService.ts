import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CriteresDeSelection {
  id?: string;
  nom: string;
  description: string;
  categorieDeSelections?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CriteresDeSelectionService {

  private apiUrl = 'http://localhost:8020/criteres';

  constructor(private http: HttpClient) {}

  // CREATE
  createCritere(critere: CriteresDeSelection): Observable<CriteresDeSelection> {
    return this.http.post<CriteresDeSelection>(`${this.apiUrl}/create`, critere);
  }

  // GET ALL WITH PAGINATION
  getAllCriteres(page: number = 0, size: number = 5): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get(`${this.apiUrl}/getAll`, { params });
  }

  // GET BY ID
  getCritereById(id: string): Observable<CriteresDeSelection> {
    return this.http.get<CriteresDeSelection>(`${this.apiUrl}/getById/${id}`);
  }

  // DELETE
  deleteCritere(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  // AFFECTER CATEGORIES
  affecterCategories(idCritere: string, idCategories: string[]): Observable<CriteresDeSelection> {
    return this.http.post<CriteresDeSelection>(
      `${this.apiUrl}/affecterCategories/${idCritere}`,
      idCategories
    );
  }
}
