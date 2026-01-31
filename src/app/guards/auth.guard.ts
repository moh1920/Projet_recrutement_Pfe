import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {keycloak} from "../core/services/keycloak-init";
import {AuthService} from "../core/services/auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const keycloakService = inject(AuthService);

  if (!keycloakService.isLoggedIn()) {
    keycloak.login({
      redirectUri: window.location.origin + state.url
    });    return false;
  }

  const roles = keycloakService.getUserRoles();

  // 🔐 ADMIN
  if (roles.includes('admin')) {
    if (state.url !== '/admin') {
      router.navigate(['/admin']);
      return false;
    }
    return true;
  }

  // 👤 USER
  if (roles.includes('users')) {
    if (state.url !== '/gestionUser') {
      router.navigate(['/gestionUser']);
      return false;
    }
    return true;
  }

  // ❌ aucun rôle valide
  router.navigate(['/home']);
  return false;
};
