import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {
  private keycloak: Keycloak | undefined;

  init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url: 'http://localhost:9090',
      realm: 'espritRecrutement',
      clientId: 'espritRecrutement'
    });

    return this.keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
      checkLoginIframe: false
    });
  }

  login(): Promise<void> {
    return this.keycloak?.login() || Promise.resolve();
  }

  logout(): Promise<void> {
    return this.keycloak?.logout() || Promise.resolve();
  }

  isLoggedIn(): boolean {
    return this.keycloak?.authenticated || false;
  }

  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  getUserRoles(): string[] {
    return this.keycloak?.realmAccess?.roles || [];
  }


}
