import { CanActivateFn } from '@angular/router';
import {keycloak} from "../core/services/keycloak.service";

export const authGuard: CanActivateFn = () => {
  if (!keycloak.authenticated) {
    keycloak.login(); // 🔐 login seulement ici
    return false;
  }
  return true;
};
