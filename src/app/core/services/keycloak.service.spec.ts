import { TestBed } from '@angular/core/testing';
import { AppKeycloakService } from './keycloak.service';
import { KeycloakService } from 'keycloak-angular';

describe('AppKeycloakService', () => {
  let service: AppKeycloakService;
  let keycloakSpy: jasmine.SpyObj<KeycloakService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('KeycloakService', [
      'login',
      'isLoggedIn',
      'getToken',
      'getUserRoles',
      'getKeycloakInstance',
      'logout',
    ]);
    spy.getKeycloakInstance.and.returnValue({
      authenticated: true,
      idToken: 'fake-id',
      refreshToken: 'fake-refresh',
    } as any);

    spy.login.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [AppKeycloakService, { provide: KeycloakService, useValue: spy }],
    });
    service = TestBed.inject(AppKeycloakService);
    keycloakSpy = TestBed.inject(KeycloakService) as jasmine.SpyObj<KeycloakService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call login', async () => {
    await service.login();
    expect(keycloakSpy.login).toHaveBeenCalled();
  });

  it('should get login status', () => {
    keycloakSpy.isLoggedIn.and.returnValue(true);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should get user roles', () => {
    keycloakSpy.getUserRoles.and.returnValue(['admin']);
    expect(service.getUserRoles()).toEqual(['admin']);
  });

  it('should handle logout', async () => {
    spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response()));
    await service.logout();

    expect(window.fetch).toHaveBeenCalled();
    expect(keycloakSpy.logout).toHaveBeenCalled();
  });
});
