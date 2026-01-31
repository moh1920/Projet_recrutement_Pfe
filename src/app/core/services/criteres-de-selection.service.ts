import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CriteresDeSelection } from '../models/criteres-de-selection.model';

@Injectable({
  providedIn: 'root'
})
export class CriteresDeSelectionService {

  private readonly baseUrl = 'http://localhost:8020/criteres';

  constructor(private http: HttpClient) {}

  createCritere(
    critere: CriteresDeSelection
  ): Observable<CriteresDeSelection> {
    return this.http.post<CriteresDeSelection>(
      `${this.baseUrl}/create`,
      critere
    );
  }

  getAllCriteres(
    page: number = 0,
    size: number = 5
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(
      `${this.baseUrl}/getAll`,
      { params }
    );
  }

  getCritereById(id: string): Observable<CriteresDeSelection> {
    return this.http.get<CriteresDeSelection>(
      `${this.baseUrl}/getById/${id}`
    );
  }

  deleteCritere(id: string): Observable<string> {
    return this.http.delete(
      `${this.baseUrl}/delete/${id}`,
      { responseType: 'text' }
    );
  }

  affecterCategories(
    idCritere: string,
    idCategories: string[]
  ): Observable<CriteresDeSelection> {
    return this.http.post<CriteresDeSelection>(
      `${this.baseUrl}/affecterCategories/${idCritere}`,
      idCategories
    );
  }
}
