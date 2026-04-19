import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============ INTERFACES ============

export interface EmailRequest {
  recipientEmail: string;
  recipientName: string;
  meetingDate: string;
  meetingTime: string;
  meetingSubject: string;
  additionalDetails?: string;
  interviewType: 'ONLINE' | 'PRESENTIEL';
  roomCode?: string;
  location?: string;
}

export interface EmailGenerateResponse {
  subject: string;
  body: string;
  recipientEmail: string;
  recipientName: string;
}

export interface EmailSendRequest {
  recipientEmail: string;
  recipientName: string;
  confirmedSubject: string;
  confirmedBody: string;
}

// ============ SERVICE ============

@Injectable({
  providedIn: 'root',
})
export class MeetingEmailService {
  private readonly API_URL = `${environment.apiUrl}/meeting-email`;

  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  // POST /meeting-email/generate
  generateEmail(request: EmailRequest): Observable<EmailGenerateResponse> {
    return this.http.post<EmailGenerateResponse>(`${this.API_URL}/generate`, request, {
      headers: this.headers,
    });
  }

  // POST /meeting-email/send
  sendEmail(sendRequest: EmailSendRequest): Observable<string> {
    return this.http.post(`${this.API_URL}/send`, sendRequest, {
      headers: this.headers,
      responseType: 'text',
    });
  }

  sendEmailContact(sendRequest: EmailSendRequest): Observable<any> {
    // const email = {
    //   recipientEmail: toEmail,
    //   confirmedSubject: subject,
    //   confirmedBody: body
    // };

    return this.http.post(`${this.API_URL}/sendEmail`, sendRequest);
  }
}
