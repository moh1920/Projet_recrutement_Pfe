import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService, UserDTO } from './user.service';
import { CreateUserRequest } from '../models/create-user-request.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8020/api/v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should getCurrentUser', () => {
    service.getCurrentUser().subscribe();
    const req = httpMock.expectOne(`${API_URL}/syncUser`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should createUser', () => {
    const request = { username: 'testuser' } as unknown as CreateUserRequest;
    service.createUser(request).subscribe();
    const req = httpMock.expectOne(`${API_URL}/createUser`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('should getAllUsers', () => {
    service.getAllUsers().subscribe();
    const req = httpMock.expectOne(`${API_URL}/userAdminController/getAllUser`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should getUserById', () => {
    service.getUserById('k1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/userAdminController/getUserById/k1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should updateUser', () => {
    const dto = { firstName: 'Test' } as UserDTO;
    service.updateUser('k1', dto).subscribe();
    const req = httpMock.expectOne(`${API_URL}/updateUser/k1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush({});
  });
});
