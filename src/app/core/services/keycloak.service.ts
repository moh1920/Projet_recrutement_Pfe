import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

export interface CurrentUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  roles: string[];
  initials: string;
}

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

  // ── Méthodes d'accès aux informations de l'utilisateur courant ────────────

  /**
   * Retourne le token parsé Keycloak (claims JWT)
   */
  private getTokenParsed(): Record<string, any> | undefined {
    return this.keycloak.getKeycloakInstance().tokenParsed as Record<string, any> | undefined;
  }

  /**
   * Prénom de l'utilisateur (claim: given_name)
   */
  getCurrentUserFirstName(): string {
    return this.getTokenParsed()?.['given_name'] ?? '';
  }

  /**
   * Nom de famille (claim: family_name)
   */
  getCurrentUserLastName(): string {
    return this.getTokenParsed()?.['family_name'] ?? '';
  }

  /**
   * Nom complet : prénom + nom
   */
  getCurrentUserFullName(): string {
    const token = this.getTokenParsed();
    if (!token) return '';
    const first = token['given_name'] ?? '';
    const last  = token['family_name'] ?? '';
    if (first || last) return `${first} ${last}`.trim();
    // Fallback sur preferred_username si pas de prénom/nom
    return token['preferred_username'] ?? '';
  }

  /**
   * Nom d'utilisateur Keycloak (claim: preferred_username)
   */
  getCurrentUsername(): string {
    return this.getTokenParsed()?.['preferred_username'] ?? '';
  }

  /**
   * Email de l'utilisateur (claim: email)
   */
  getCurrentUserEmail(): string {
    return this.getTokenParsed()?.['email'] ?? '';
  }

  /**
   * ID Keycloak de l'utilisateur (claim: sub)
   */
  getCurrentUserId(): string {
    return this.getTokenParsed()?.['sub'] ?? '';
  }

  /**
   * Initiales (ex : "M S" → "MS") pour l'avatar
   */
  getCurrentUserInitials(): string {
    const first = this.getCurrentUserFirstName();
    const last  = this.getCurrentUserLastName();
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first[0].toUpperCase();
    const username = this.getCurrentUsername();
    return username ? username[0].toUpperCase() : '?';
  }

  /**
   * Objet complet avec toutes les infos utilisateur
   */
  getCurrentUserInfo(): CurrentUserInfo {
    return {
      id:        this.getCurrentUserId(),
      firstName: this.getCurrentUserFirstName(),
      lastName:  this.getCurrentUserLastName(),
      fullName:  this.getCurrentUserFullName(),
      email:     this.getCurrentUserEmail(),
      username:  this.getCurrentUsername(),
      roles:     this.getUserRoles(),
      initials:  this.getCurrentUserInitials(),
    };
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
