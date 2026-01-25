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

  handlePostLoginRedirect() {
    const roles =
      keycloak.tokenParsed?.realm_access?.roles || [];
    console.log(roles);

    if (roles.includes('admin')) {
      this.router.navigate(['/admin']);
    } else if (roles.includes('user')) {
      this.router.navigate(['/home']);
    }
  }
}
