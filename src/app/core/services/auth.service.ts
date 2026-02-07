
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export type UserRole = 'ADMIN' | 'DIRECTOR' | 'HEAD_DEPT' | 'CUP' | 'TEACHER';

export interface User {
    id: string;
    name: string;
    avatar: string;
    role: UserRole;
    email: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    constructor() {
        // Simulate persistent login for dev
        this.currentUserSubject.next({
            id: '1',
            name: 'Mohamed Sayari',
            avatar: 'assets/avatar-placeholder.png', // We will need a placeholder
            role: 'ADMIN',
            email: 'mohamed.sayari@esprit.tn'
        });
    }

    get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    login(role: UserRole = 'ADMIN'): Observable<User> {
        const mockUser: User = {
            id: '1',
            name: 'Mohamed Sayari',
            avatar: 'assets/avatar-placeholder.png',
            role: role,
            email: 'mohamed.sayari@esprit.tn'
        };
        return of(mockUser).pipe(
            delay(500),
            tap(user => this.currentUserSubject.next(user))
        );
    }

    logout() {
        this.currentUserSubject.next(null);
    }

    hasRole(allowedRoles: UserRole[]): boolean {
        const user = this.currentUserValue;
        return user ? allowedRoles.includes(user.role) : false;
    }
}
