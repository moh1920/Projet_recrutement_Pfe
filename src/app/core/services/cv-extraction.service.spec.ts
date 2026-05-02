import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CvExtractionService } from './cv-extraction.service';
import {environment} from "../../../environments/environment";

describe('CvExtractionService', () => {
  let service: CvExtractionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
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

    const req = httpMock.expectOne(`${environment.apiUrlFastApi}/api/v3/extract-cv-file-hybrid`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({});
  });
});
