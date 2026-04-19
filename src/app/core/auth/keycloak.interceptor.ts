import { inject } from '@angular/core';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpInterceptorFn } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';

export const keycloakInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(KeycloakService);

  if (!keycloakService.isLoggedIn()) {
    return next(req);
  }

  return from(keycloakService.getToken()).pipe(
    switchMap((token) => {
      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      return next(req);
    })
  );
};
