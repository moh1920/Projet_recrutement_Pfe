import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppKeycloakService {
  constructor(private keycloak: KeycloakService) {}

  login(): Promise<void> {
    return this.keycloak.login();
  }

  isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  getToken(): Promise<string> {
    return this.keycloak.getToken();
  }

  getUserRoles(): string[] {
    return this.keycloak.getUserRoles();
  }

  async logout(): Promise<void> {
    // ✅ Accéder à l'instance keycloak-js sous-jacente
    const keycloakInstance = this.keycloak.getKeycloakInstance();

    console.log('=== LOGOUT DEBUG ===');
    console.log('authenticated:', keycloakInstance.authenticated);
    console.log('idToken:', keycloakInstance.idToken ? '✅' : '❌');
    console.log('refreshToken:', keycloakInstance.refreshToken ? '✅' : '❌');

    const idToken = keycloakInstance.idToken;
    const refreshToken = keycloakInstance.refreshToken;

    if (refreshToken) {
      try {
        const response = await fetch(
          `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/logout`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: 'espritRecrutement',
              refresh_token: refreshToken,
            }),
          }
        );
        console.log('Logout status:', response.status); // 204 = succès
      } catch (error) {
        console.error('POST logout échoué', error);
      }
    }

    localStorage.clear();
    sessionStorage.clear();

    await this.keycloak.logout(window.location.origin + '/home');
  }
}
