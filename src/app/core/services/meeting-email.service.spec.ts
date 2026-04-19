import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MeetingEmailService, EmailRequest, EmailSendRequest } from './meeting-email.service';

describe('MeetingEmailService', () => {
  let service: MeetingEmailService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8020/meeting-email';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(MeetingEmailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generateEmail', () => {
    const request: EmailRequest = {
      recipientEmail: 'test@example.com',
      recipientName: 'Test',
      meetingDate: '2026-05-05',
      meetingTime: '10:00',
      meetingSubject: 'Interview',
      interviewType: 'ONLINE',
    };
    service.generateEmail(request).subscribe();
    const req = httpMock.expectOne(`${API_URL}/generate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('should sendEmail', () => {
    const request: EmailSendRequest = {
      recipientEmail: 'test@example.com',
      recipientName: 'Test',
      confirmedSubject: 'Subject',
      confirmedBody: 'Body',
    };
    service.sendEmail(request).subscribe();
    const req = httpMock.expectOne(`${API_URL}/send`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush('Success');
  });

  it('should sendEmailContact', () => {
    const request: EmailSendRequest = {
      recipientEmail: 'test@example.com',
      recipientName: 'Test',
      confirmedSubject: 'Subject',
      confirmedBody: 'Body',
    };
    service.sendEmailContact(request).subscribe();
    const req = httpMock.expectOne(`${API_URL}/sendEmail`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });
});
