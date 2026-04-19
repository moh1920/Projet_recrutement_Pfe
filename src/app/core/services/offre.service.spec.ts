import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OffreService } from './offre.service';
import { Offre } from '../models/offre.model';

describe('OffreService', () => {
  let service: OffreService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8020/offre';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(OffreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should createOffre', () => {
    const mockOffre = {
      id: '1',
      title: 'Test Offre',
      status: 'Ouverte',
      type: 'Permanent',
      requiredLevel: 'Licence',
    } as Offre;
    service.createOffre(mockOffre).subscribe();
    const req = httpMock.expectOne(`${API_URL}/create`);
    expect(req.request.method).toBe('POST');
    req.flush(mockOffre);
  });

  it('should getAllOffres', () => {
    service.getAllOffres(0, 5).subscribe();
    const req = httpMock.expectOne(`${API_URL}/getAll?page=0&size=5`);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [] });
  });

  it('should getOffreById', () => {
    service.getOffreById('1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/getById/1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should updateOffre', () => {
    const mockOffre = { id: '1' } as Offre;
    service.updateOffre('1', mockOffre).subscribe();
    const req = httpMock.expectOne(`${API_URL}/update/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should deleteOffre', () => {
    service.deleteOffre('1').subscribe();
    const req = httpMock.expectOne(`${API_URL}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush('Deleted');
  });
});
