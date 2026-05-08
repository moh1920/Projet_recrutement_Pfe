import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CreateUserRequest, StatusUser } from '../models/create-user-request.model';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUP' | 'Chef de Département' | 'Enseignant' | 'Admin';
  department: string;
  status: 'Actif' | 'Inactif';
  dateDeCreation: string;
}
export interface UserKey {
  id: string;
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UserDTO {
  id: string;
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;

  department: string;
  statusUser: StatusUser;
  dateDeCreation: string; // ⚠️ LocalDate devient string en JSON
  phone: string;

  fullName: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/syncUser`);
  }

  createUser(request: CreateUserRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/createUser`, request);
  }

  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.apiUrl}/userAdminController/getAllUser`);
  }
  getUserById(keycloakId: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/userAdminController/getUserById/${keycloakId}`);
  }
  updateUser(keycloakId: string, userDTO: UserDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(
      `${this.apiUrl}/userAdminController/updateUser/${keycloakId}`,
      userDTO
    );
  }

  updateStatusUser(id: string, status: StatusUser): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/userAdminController/updateStatusUser/${id}/${status}`,
      {}
    );
  }
}
