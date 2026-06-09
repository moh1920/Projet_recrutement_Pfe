import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { KeycloakService } from 'keycloak-angular';
import { initializeKeycloak } from './core/utils/keycloak-init';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { keycloakInterceptor } from './core/auth/keycloak.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes,

    ),
    provideNativeDateAdapter(),
    provideAnimations(),
    KeycloakService, // ← IMPORTANT: Ajouter le service
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService], // ← IMPORTANT: Ajouter la dépendance
    },
    provideHttpClient(withInterceptors([keycloakInterceptor])),
  ],
};
