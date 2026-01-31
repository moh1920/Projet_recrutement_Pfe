import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { keycloak } from './keycloak-init';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private router: Router) {}

  login() {
    keycloak.login({
      redirectUri: window.location.origin
    });
  }


  logout() {
    sessionStorage.removeItem('post_login_redirect');
    keycloak.logout({
      redirectUri: window.location.origin
    });
  }

  isLoggedIn(): boolean {
    return !!keycloak.authenticated;
  }

  getUserRoles(): string[] {
    return keycloak.tokenParsed?.realm_access?.roles || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }



}
