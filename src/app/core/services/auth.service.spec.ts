import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial mock user', () => {
    expect(service.currentUserValue).toBeTruthy();
    expect(service.currentUserValue?.name).toBe('Mohamed Sayari');
  });

  it('should login and set current user', fakeAsync(() => {
    let loggedUser: User | undefined;
    service.login('DIRECTOR').subscribe((user) => (loggedUser = user));

    tick(500);

    expect(loggedUser).toBeDefined();
    expect(loggedUser?.role).toBe('DIRECTOR');
    expect(service.currentUserValue?.role).toBe('DIRECTOR');
  }));

  it('should logout and set user to null', () => {
    service.logout();
    expect(service.currentUserValue).toBeNull();
  });

  it('should check if user has required roles', () => {
    expect(service.hasRole(['ADMIN', 'DIRECTOR'])).toBeTrue(); // Current is ADMIN
    expect(service.hasRole(['TEACHER'])).toBeFalse();

    service.logout();
    expect(service.hasRole(['ADMIN'])).toBeFalse();
  });
});
