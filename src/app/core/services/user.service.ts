import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUP' | 'Chef de Département' | 'Enseignant' | 'Admin';
  department: string;
  status: 'Actif' | 'Inactif';
  hireDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [
    {
      id: '1',
      name: 'Dr. Ahmed Ben Salem',
      email: 'ahmed.bensalem@esprit.tn',
      phone: '+216 98 123 456',
      role: 'Chef de Département',
      department: 'Informatique',
      status: 'Actif',
      hireDate: '2018-09-01'
    },
    {
      id: '2',
      name: 'Prof. Fatma Gharbi',
      email: 'fatma.gharbi@esprit.tn',
      phone: '+216 97 234 567',
      role: 'CUP',
      department: 'Génie Logiciel',
      status: 'Actif',
      hireDate: '2019-02-15'
    },
    {
      id: '3',
      name: 'Dr. Mohamed Trabelsi',
      email: 'mohamed.trabelsi@esprit.tn',
      phone: '+216 96 345 678',
      role: 'CUP',
      department: 'Intelligence Artificielle',
      status: 'Actif',
      hireDate: '2020-09-01'
    },
    {
      id: '4',
      name: 'Dr. Sonia Ayari',
      email: 'sonia.ayari@esprit.tn',
      phone: '+216 95 456 789',
      role: 'Chef de Département',
      department: 'Réseaux & Sécurité',
      status: 'Actif',
      hireDate: '2017-03-10'
    },
    {
      id: '5',
      name: 'Prof. Karim Mansour',
      email: 'karim.mansour@esprit.tn',
      phone: '+216 94 567 890',
      role: 'CUP',
      department: 'Data Science',
      status: 'Actif',
      hireDate: '2021-01-20'
    },
    {
      id: '6',
      name: 'Dr. Leila Hamdi',
      email: 'leila.hamdi@esprit.tn',
      phone: '+216 93 678 901',
      role: 'Enseignant',
      department: 'Informatique',
      status: 'Actif',
      hireDate: '2022-09-01'
    }
  ];

  constructor() { }

  getUsers(): Observable<User[]> {
    return of(this.users);
  }

  getUserById(id: string): Observable<User | undefined> {
    return of(this.users.find(u => u.id === id));
  }

  addUser(user: User): Observable<User> {
    const newUser = { ...user, id: Date.now().toString() };
    this.users.push(newUser);
    return of(newUser);
  }

  updateUser(id: string, user: Partial<User>): Observable<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...user };
      return of(this.users[index]);
    }
    return of(undefined);
  }

  deleteUser(id: string): Observable<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
