import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CvExtractionService } from './cv-extraction.service';

describe('CvExtractionService', () => {
  let service: CvExtractionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CvExtractionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should extract cv', () => {
    const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    
    service.extractCv(mockFile).subscribe();
    
    const req = httpMock.expectOne('http://127.0.0.1:8000/api/v2/extract-cv-file-llm');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({});
  });
});
