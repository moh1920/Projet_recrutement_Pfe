import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { KeycloakService } from 'keycloak-angular';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let keycloakSpy: jasmine.SpyObj<KeycloakService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('KeycloakService', ['getToken', 'getUserRoles']);
    spy.getUserRoles.and.returnValue(['candidate']);
    spy.getToken.and.resolveTo('fake-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationService,
        { provide: KeycloakService, useValue: spy }
      ]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    keycloakSpy = TestBed.inject(KeycloakService) as jasmine.SpyObj<KeycloakService>;
  });

  afterEach(() => {
    httpMock.verify();
    service.disconnect();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch notifications and update subjects', () => {
    const mockNotifications = [
      { id: '1', recipientId: 'user1', title: 'Test', message: 'Test Notif', type: 'INFO', read: false, createdAt: '2023' }
    ];

    let currentNotifications: any = [];
    service.notifications$.subscribe(notifs => currentNotifications = notifs);

    service.loadNotifications();
    const req = httpMock.expectOne('http://localhost:8080/api/notifications');
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifications);

    expect(currentNotifications).toEqual(mockNotifications);
    
    let currentUnread = 0;
    service.unreadCount$.subscribe(count => currentUnread = count);
    expect(currentUnread).toBe(1);
  });

  it('should mark a notification as read', () => {
    service.markAsRead('1');
    const req = httpMock.expectOne('http://localhost:8080/api/notifications/1/read');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should mark all notifications as read', () => {
    service.markAllAsRead();
    const req = httpMock.expectOne('http://localhost:8080/api/notifications/read-all');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should delete a notification', () => {
    service.delete('1');
    const req = httpMock.expectOne('http://localhost:8080/api/notifications/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should send a notification', () => {
    service.sendNotification('user2', 'titre', 'msg', 'INFO', 'http://link').subscribe();
    
    const req = httpMock.expectOne(request => request.url === 'http://localhost:8080/api/notifications/send');
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get('recipientId')).toBe('user2');
    expect(req.request.params.get('title')).toBe('titre');
    expect(req.request.params.get('message')).toBe('msg');
    expect(req.request.params.get('type')).toBe('INFO');
    expect(req.request.params.get('link')).toBe('http://link');
    req.flush({});
  });
});
