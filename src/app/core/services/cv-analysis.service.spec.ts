import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CvAnalysisService } from './cv-analysis.service';
import {environment} from "../../../environments/environment";

describe('CvAnalysisService', () => {
  let service: CvAnalysisService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(CvAnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should evaluate cv file', () => {
    const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const mockOfferJson = { title: 'Test Offer' };

    service.evaluateCvFile(mockFile, mockOfferJson).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrlFastApi}/api/v2/evaluate-cv-file`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({});
  });
});
