export interface CreateUserRequest {
  firstName: string;
  userName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;

  department: string;
  phone: string;
  statusUser: StatusUser;
}
// create-user-request.model.ts
export enum StatusUser {
  ACTIF = 'Actif',      // ← correspond exactement à l'enum Java
  INACTIF = 'Inactif'
}
