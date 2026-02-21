import { KeycloakService } from 'keycloak-angular';
import Keycloak from "keycloak-js";


export const keycloak = new Keycloak({
  url: 'http://localhost:9090',
  realm: 'espritRecrutement',
  clientId: 'espritRecrutement'
});
export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:9090',
        realm: 'espritRecrutement',
        clientId: 'espritRecrutement'
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false,
        pkceMethod: 'S256'
      },
      enableBearerInterceptor: false,
      shouldAddToken: (request) => {
        const { method, url } = request;
        const isExcluded = ['/assets', '/api/public'].some(excluded => url.includes(excluded));
        return !isExcluded;
      }
    });
}
