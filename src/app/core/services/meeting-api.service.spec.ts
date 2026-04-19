import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MeetingApiService } from './meeting-api.service';

describe('MeetingApiService', () => {
  let service: MeetingApiService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8020/meetings';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(MeetingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should createMeeting', () => {
    service.createMeeting('New Meeting').subscribe();
    const req = httpMock.expectOne(`${API_URL}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'New Meeting' });
    req.flush({});
  });

  it('should checkRoom', () => {
    service.checkRoom('room123').subscribe();
    const req = httpMock.expectOne(`${API_URL}/check/room123`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
