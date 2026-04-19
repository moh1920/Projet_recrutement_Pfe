import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatchingService } from './matching.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8020/api/matching';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(MatchingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should getBestCandidatesForOffer', () => {
    service.getBestCandidatesForOffer('offer1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/offers/offer1/candidates`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should getBestOffersForCandidate', () => {
    service.getBestOffersForCandidate('candidate1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/candidates/candidate1/offers`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should rankOffersForProfile', () => {
    service.rankOffersForProfile('profile1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/rankOffersForProfile/profile1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
