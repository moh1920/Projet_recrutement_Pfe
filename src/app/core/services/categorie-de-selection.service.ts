import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategorieDeSelectionService {

  private baseUrl = 'http://localhost:8020/categorieDeSelection';

  constructor(private http: HttpClient) {}

  addCategorie(categorie: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/addCategorie/add`,
      categorie
    );
  }

  getAllCategories(page: number = 0, size: number = 5): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get(
      `${this.baseUrl}/getAllCategories/all`,
      { params }
    );
  }

  getCategorieById(id: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/getCategorieById/${id}`
    );
  }

  updateCategorie(id: string, categorie: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/updateCategorie/${id}`,
      categorie
    );
  }

  deleteCategorie(id: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/deleteCategorie/${id}`
    );
  }
}
