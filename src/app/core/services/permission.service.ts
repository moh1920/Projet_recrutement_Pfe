import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission, PermissionRequest } from '../models/permission.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/permissions`;

  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.apiUrl);
  }

  getPermissionByRole(role: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.apiUrl}/${role}`);
  }

  saveOrUpdatePermission(request: PermissionRequest): Observable<Permission> {
    return this.http.post<Permission>(this.apiUrl, request);
  }

  deletePermissionByRole(role: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${role}`);
  }
}
