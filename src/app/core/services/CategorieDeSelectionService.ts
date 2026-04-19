import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CategorieDeSelection {
  id?: string;
  nom?: string;
  description?: string;
  poids?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CategorieDeSelectionService {
  private apiUrl = `${environment.apiUrl}/categorieDeSelection`;

  constructor(private http: HttpClient) {}

  // ✅ Add categorie
  addCategorie(categorie: CategorieDeSelection): Observable<CategorieDeSelection> {
    return this.http.post<CategorieDeSelection>(`${this.apiUrl}/addCategorie/add`, categorie);
  }

  // ✅ Get all categories with pagination
  getAllCategories(page = 0, size = 5): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);

    return this.http.get(`${this.apiUrl}/getAllCategories/all`, { params });
  }

  // ✅ Get categorie by ID
  getCategorieById(id: string): Observable<CategorieDeSelection> {
    return this.http.get<CategorieDeSelection>(`${this.apiUrl}/getCategorieById/${id}`);
  }

  // ✅ Update categorie
  updateCategorie(id: string, categorie: CategorieDeSelection): Observable<CategorieDeSelection> {
    return this.http.put<CategorieDeSelection>(`${this.apiUrl}/updateCategorie/${id}`, categorie);
  }

  // ✅ Delete categorie
  deleteCategorie(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteCategorie/${id}`);
  }
}
