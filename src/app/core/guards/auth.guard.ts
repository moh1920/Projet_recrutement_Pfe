import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  try {
    const isLoggedIn = await keycloak.isLoggedIn();

    if (!isLoggedIn) {
      // Rediriger vers la page de connexion Keycloak
      await keycloak.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    router.navigate(['/']);
    return false;
  }
};
