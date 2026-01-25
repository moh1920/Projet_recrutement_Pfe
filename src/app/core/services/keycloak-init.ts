import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
  url: 'http://localhost:9090',
  realm: 'espritRecrutement',
  clientId: 'espritRecrutement'
});

export function initializeKeycloak() {
  return () =>
    keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false
    });
}
