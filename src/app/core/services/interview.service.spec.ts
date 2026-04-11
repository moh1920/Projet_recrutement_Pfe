import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InterviewService, Interview } from './interview.service';

describe('InterviewService', () => {
  let service: InterviewService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8020/interviews';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(InterviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should refresh interviews and populate cache', () => {
    const mockInterviews: Partial<Interview>[] = [{ id: '1', position: 'Developer' }];
    
    let result: any;
    service.refreshInterviews().subscribe(data => result = data);
    
    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockInterviews);
    
    expect(result).toEqual(mockInterviews);
  });

  it('should format date and time correcty', () => {
      const date = new Date('2026-08-15T12:00:00Z');
      expect(service.formatDateForAPI(date)).toBe('2026-08-15');
      
      expect(service.formatTimeForAPI('12:5')).toBe('12:05');
  });

  it('should get interview by ID', () => {
    service.getInterviewById('123').subscribe();
    
    const req = httpMock.expectOne(`${API_URL}/123`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should create an interview', () => {
    const newInterview: Partial<Interview> = { candidateName: 'John Doe' };
    service.createInterview(newInterview).subscribe();
    
    const req = httpMock.expectOne(`${API_URL}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newInterview);
    req.flush({});
  });

  it('should invalidate cache when updating interview', () => {
    spyOn(service as any, 'invalidateCache').and.callThrough();
    service.updateInterview('1', { notes: 'Updated notes' }).subscribe();
    
    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
    
    expect((service as any).invalidateCache).toHaveBeenCalled();
  });
});
