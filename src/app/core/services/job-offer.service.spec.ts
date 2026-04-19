import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { JobOfferService, JobOffer } from './job-offer.service';

describe('JobOfferService', () => {
  let service: JobOfferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobOfferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return mock offers', fakeAsync(() => {
    let offers: JobOffer[] | undefined;
    service.getOffers().subscribe((o) => (offers = o));

    tick(500);

    expect(offers).toBeDefined();
    expect(offers?.length).toBe(3);
    expect(offers![0].title).toBe('Enseignant Permanent - Génie Logiciel');
  }));

  it('should return a specific offer by id', fakeAsync(() => {
    let offer: JobOffer | undefined;
    service.getOfferById('2').subscribe((o) => (offer = o));

    tick(300);

    expect(offer).toBeDefined();
    expect(offer?.id).toBe('2');
    expect(offer?.title).toBe('Vacataire - Intelligence Artificielle');
  }));
});
