import { HttpInterceptorFn } from '@angular/common/http';
import { keycloak } from '../core/services/keycloak.service';

export const keycloakInterceptor: HttpInterceptorFn = (req, next) => {
  const token = keycloak.token;

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};

