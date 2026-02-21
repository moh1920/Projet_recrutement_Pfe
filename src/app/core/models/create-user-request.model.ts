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
export enum StatusUser {
  ACTIF = 'Actif',
  INACTIF = 'Inactif'
}
