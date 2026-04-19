import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ApplicationService } from './application.service';

describe('ApplicationService', () => {
  let service: ApplicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return mock applications', fakeAsync(() => {
    let applications: any[] | undefined;
    service.getUserApplications('user1').subscribe((apps) => (applications = apps));

    // Simulate delay
    tick(500);

    expect(applications).toBeDefined();
    expect(applications?.length).toBe(3);
    expect(applications![0].offerTitle).toBe('Enseignant Chercheur - Intelligence Artificielle');
  }));

  it('should withdraw application', fakeAsync(() => {
    let result: boolean = false;
    service.withdrawApplication('app1').subscribe(() => (result = true));

    tick(300);

    expect(result).toBeTrue();
  }));
});
