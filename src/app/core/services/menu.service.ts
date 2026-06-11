import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuItem, MenuItemDTO } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/menu`;

  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  getFullTree(): Observable<MenuItemDTO[]> {
    return this.http.get<MenuItemDTO[]>(`${this.apiUrl}/tree`);
  }

  getSidebar(): Observable<MenuItemDTO[]> {
    return this.refreshTrigger$.pipe(
      switchMap(() => this.http.get<MenuItemDTO[]>(`${this.apiUrl}/sidebar`))
    );
  }

  refreshSidebar(): void {
    this.refreshTrigger$.next();
  }

  getAllItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}/items`);
  }

  createItem(item: MenuItem): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.apiUrl}/items`, item);
  }

  updateItem(id: string, item: MenuItem): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.apiUrl}/items/${id}`, item);
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}`);
  }
}
