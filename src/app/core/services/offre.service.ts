import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Offre } from '../models/offre.model';

@Injectable({
  providedIn: 'root'
})
export class OffreService {

  private readonly baseUrl = 'http://localhost:8020/offre';

  constructor(private http: HttpClient) {}

  createOffre(offre: Offre): Observable<Offre> {
    return this.http.post<Offre>(
      `${this.baseUrl}/create`,
      offre
    );
  }

  getAllOffres(
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
    );
  }

  getOffreById(id: string): Observable<Offre> {
    return this.http.get<Offre>(
      `${this.baseUrl}/getById/${id}`
    );
  }

  updateOffre(
    id: string,
    dto: any
  ): Observable<Offre> {
    return this.http.put<Offre>(
      `${this.baseUrl}/update/${id}`,
      dto
    );
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
    return this.http.put<Offre>(
      `${this.baseUrl}/affecterCriteresDeSelection/${idOffre}`,
      idCriteres
    );
  }
}
