import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProfileService, ProfileRequestDTO } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8020/profiles_users';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should createProfile', () => {
    const mockProfile = { nom: 'Test', email: 'test@example.com' } as ProfileRequestDTO;
    service.createProfile(mockProfile).subscribe();
    const req = httpMock.expectOne(`${API_URL}/createProfile`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should getAllProfiles', () => {
    service.getAllProfiles().subscribe();
    const req = httpMock.expectOne(`${API_URL}/getAllProfiles`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should getProfileById', () => {
    service.getProfileById('1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/getProfileById/1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should updateCvPath', () => {
    service.updateCvPath('1', 'new/path').subscribe();
    const req = httpMock.expectOne(`${API_URL}/updateCvPath/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ cvPath: 'new/path' });
    req.flush({});
  });

  it('should uploadCV', () => {
    const file = new File([''], 'cv.pdf');
    service.uploadCV('1', file).subscribe();
    const req = httpMock.expectOne(`${API_URL}/1/upload-cv`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({});
  });
});
