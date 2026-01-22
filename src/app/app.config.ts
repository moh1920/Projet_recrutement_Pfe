import {APP_INITIALIZER, ApplicationConfig} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {keycloakInterceptor} from "./auth/keycloak.interceptor";
import {initializeKeycloak} from "./core/services/keycloak.service";


export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true
    },
    provideHttpClient(
      withInterceptors([keycloakInterceptor])
    )


  ]
};
