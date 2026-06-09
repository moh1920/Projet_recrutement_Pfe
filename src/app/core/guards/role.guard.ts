import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const roleGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  try {
    const isLoggedIn = await keycloak.isLoggedIn();

    if (!isLoggedIn) {
      await keycloak.login({
        redirectUri: window.location.origin + state.url,
      });
      return false;
    }

    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }


    const realmRoles = keycloak.getUserRoles(false); // realm roles
    const clientRoles = keycloak.getUserRoles(true);  // realm + client roles

    console.log('Realm roles:', realmRoles);
    console.log('Realm + Client roles:', clientRoles);

    const userRoles = clientRoles.map((role) => role.toLowerCase());
    const normalizedRequiredRoles = requiredRoles.map((role) => role.toLowerCase());

    console.log('Rôles requis (normalisés):', normalizedRequiredRoles);
    console.log('Rôles utilisateur (normalisés):', userRoles);

    // Vérifier si l'utilisateur a au moins un des rôles requis
    const hasRole = normalizedRequiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      console.warn('Accès refusé: rôle insuffisant');
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification des rôles:', error);
    router.navigate(['/']);
    return false;
  }
};
