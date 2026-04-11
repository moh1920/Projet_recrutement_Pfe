import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CandidateService, CandidateDTO, StepDTO, StepStatus } from './candidate.service';

describe('CandidateService', () => {
  let service: CandidateService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8020/candidature';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CandidateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should postulerCandidature', () => {
    service.postulerCandidature('p1', 'o1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/postulerCandidature/p1/o1`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should createCandidature', () => {
    const mockCandidate: CandidateDTO = { firstName: 'Test' };
    service.createCandidature(mockCandidate).subscribe();
    const req = httpMock.expectOne(`${API_URL}/createCandidature`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCandidate);
    req.flush({});
  });

  it('should getAllCandidature', () => {
    service.getAllCandidature().subscribe();
    const req = httpMock.expectOne(`${API_URL}/getAllCandidature`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should getAllCandidatureByProfile', () => {
    service.getAllCandidatureByProfile('p1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/getAllCandidatureByProfile/p1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should getAllCandidatureByOffre', () => {
    service.getAllCandidatureByOffre('o1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/getAllCandidatureByOffre/o1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should getAllCandidatureById', () => {
    service.getAllCandidatureById('1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/getAllCandidatureById/1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should getSteps', () => {
    service.getSteps('1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/1/steps`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should addStep', () => {
    const step: StepDTO = { name: 'Step1' };
    service.addStep('1', step).subscribe();
    const req = httpMock.expectOne(`${API_URL}/1/steps`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(step);
    req.flush({});
  });

  it('should updateSteps', () => {
    const steps: StepDTO[] = [{ name: 'Step1' }];
    service.updateSteps('1', steps).subscribe();
    const req = httpMock.expectOne(`${API_URL}/1/steps`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(steps);
    req.flush({});
  });

  it('should updateStepStatus', () => {
    service.updateStepStatus('1', 'Step 1', StepStatus.completed, '21 Mars 2026').subscribe();
    const req = httpMock.expectOne((request) => request.url === `${API_URL}/1/steps/Step%201`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.params.get('status')).toBe(StepStatus.completed);
    expect(req.request.params.get('date')).toBe('21 Mars 2026');
    req.flush({});
  });

  it('should deleteStep', () => {
    service.deleteStep('1', 'Step 1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/1/steps/Step%201`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
