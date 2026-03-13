import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError, shareReplay, retry } from 'rxjs/operators';

// Types & Enums
export type InterviewStatus = 'Planifié' | 'En cours' | 'Terminé' | 'Annulé';
export type InterviewType = 'interview' | 'evaluation';

// Interfaces
export interface Interview {
  id: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  position: string;
  department?: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  duration: number; // in minutes
  type: InterviewType;
  status: InterviewStatus;
  jury: string[]; // Array of jury member names
  juryIds?: string[]; // Array of jury member IDs
  juryEmails?: string[]; // Array of jury member emails
  meetLink?: string;
  room?: string;
  location?: string;
  notes?: string;
  requirements?: string[];
  attachments?: Attachment[];
  evaluationCriteria?: EvaluationCriteria[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface EvaluationCriteria {
  id: string;
  criterion: string;
  weight: number;
  description?: string;
}

export interface NotificationData {
  interview: Interview;
  action: 'created' | 'updated' | 'cancelled' | 'reminder';
  recipients: string[];
  customMessage?: string;
}

export interface InterviewFilters {
  status?: InterviewStatus[];
  type?: InterviewType[];
  dateFrom?: string;
  dateTo?: string;
  candidateName?: string;
  position?: string;
  juryMember?: string;
  department?: string;
}

export interface InterviewStatistics {
  total: number;
  byStatus: Record<InterviewStatus, number>;
  byType: Record<InterviewType, number>;
  byDepartment: Record<string, number>;
  byMonth: { month: string; count: number }[];
  averageDuration: number;
  upcomingCount: number;
}

export interface CalendarDay {
  name: string;
  date: Date;
  isToday: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private http = inject(HttpClient);

  // API Base URL
  private readonly API_URL = `http://localhost:8020/interviews`;

  // Cache
  private interviewsCache$ = new BehaviorSubject<Interview[]>([]);
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // ==================== GET Operations ====================

  /**
   * Get all interviews
   * Returns cached data if available and fresh, otherwise fetches from API
   */
  getInterviews(): Observable<Interview[]> {
    const now = Date.now();

    // Return cache if fresh
    if (this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      return this.interviewsCache$.asObservable();
    }

    // Fetch fresh data
    return this.refreshInterviews();
  }

  /**
   * Refresh interviews from API
   */
  refreshInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(this.API_URL).pipe(
      tap(interviews => {
        this.interviewsCache$.next(interviews);
        this.cacheTimestamp = Date.now();
      }),
      catchError(this.handleError),
      shareReplay(1)
    );
  }

  /**
   * Get interview by ID
   */
  getInterviewById(id: string): Observable<Interview> {
    return this.http.get<Interview>(`${this.API_URL}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get interviews with filters
   */
  getInterviewsWithFilters(filters: InterviewFilters): Observable<Interview[]> {
    let params = new HttpParams();

    if (filters.status && filters.status.length > 0) {
      params = params.append('status', filters.status.join(','));
    }

    if (filters.type && filters.type.length > 0) {
      params = params.append('type', filters.type.join(','));
    }

    if (filters.dateFrom) {
      params = params.append('dateFrom', filters.dateFrom);
    }

    if (filters.dateTo) {
      params = params.append('dateTo', filters.dateTo);
    }

    if (filters.candidateName) {
      params = params.append('candidateName', filters.candidateName);
    }

    if (filters.position) {
      params = params.append('position', filters.position);
    }

    if (filters.juryMember) {
      params = params.append('juryMember', filters.juryMember);
    }

    if (filters.department) {
      params = params.append('department', filters.department);
    }

    return this.http.get<Interview[]>(`${this.API_URL}/filter`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get interviews for a specific date range
   */
  getInterviewsByDateRange(startDate: string, endDate: string): Observable<Interview[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<Interview[]>(`${this.API_URL}/date-range`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get interviews for a specific jury member
   */
  getInterviewsByJuryMember(juryMemberId: string): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.API_URL}/jury/${juryMemberId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get interviews for a specific candidate
   */
  getInterviewsByCandidate(candidateId: string): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.API_URL}/candidate/${candidateId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get upcoming interviews (next 7 days)
   */
  getUpcomingInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.API_URL}/upcoming`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get today's interviews
   */
  getTodayInterviews(): Observable<Interview[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getInterviewsByDateRange(today, today);
  }

  // ==================== CREATE Operations ====================

  /**
   * Create a new interview
   */
  createInterview(interview: Partial<Interview>): Observable<Interview> {
    return this.http.post<Interview>(`${this.API_URL}/create`, interview);

  }

  /**
   * Batch create interviews
   */
  batchCreateInterviews(interviews: Partial<Interview>[]): Observable<Interview[]> {
    return this.http.post<Interview[]>(`${this.API_URL}/batch`, interviews).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  // ==================== UPDATE Operations ====================

  /**
   * Update an interview
   */
  updateInterview(id: string, updates: Partial<Interview>): Observable<Interview> {
    return this.http.put<Interview>(`${this.API_URL}/${id}`, updates).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  /**
   * Update interview status
   */
  updateInterviewStatus(id: string, status: InterviewStatus): Observable<Interview> {
    return this.http.patch<Interview>(`${this.API_URL}/${id}/status`, { status }).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  /**
   * Reschedule interview
   */
  rescheduleInterview(id: string, date: string, time: string): Observable<Interview> {
    return this.http.patch<Interview>(`${this.API_URL}/${id}/reschedule`, { date, time }).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  /**
   * Update jury members
   */
  updateJury(id: string, juryIds: string[]): Observable<Interview> {
    return this.http.patch<Interview>(`${this.API_URL}/${id}/jury`, { juryIds }).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  // ==================== DELETE Operations ====================

  /**
   * Delete an interview
   */
  deleteInterview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  /**
   * Batch delete interviews
   */
  batchDeleteInterviews(ids: string[]): Observable<void> {
    const options = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: { ids }
    };

    return this.http.delete<void>(`${this.API_URL}/batch`, options).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  // ==================== Notifications ====================

  /**
   * Send notification about interview
   */
  sendNotification(notificationData: NotificationData): Observable<any> {
    return this.http.post(`${this.API_URL}/notifications`, notificationData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Send reminder for upcoming interviews
   */
  sendReminder(interviewId: string, reminderType: 'email' | 'sms' | 'both'): Observable<any> {
    return this.http.post(`${this.API_URL}/${interviewId}/reminder`, { reminderType }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Send bulk reminders
   */
  sendBulkReminders(interviewIds: string[], reminderType: 'email' | 'sms' | 'both'): Observable<any> {
    return this.http.post(`${this.API_URL}/reminders/bulk`, { interviewIds, reminderType }).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Attachments ====================

  /**
   * Upload attachment to interview
   */
  uploadAttachment(interviewId: string, file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Attachment>(
      `${this.API_URL}/${interviewId}/attachments`,
      formData
    ).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  /**
   * Delete attachment
   */
  deleteAttachment(interviewId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${interviewId}/attachments/${attachmentId}`
    ).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  /**
   * Download attachment
   */
  downloadAttachment(interviewId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(
      `${this.API_URL}/${interviewId}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Statistics & Reports ====================

  /**
   * Get interview statistics
   */
  getStatistics(dateFrom?: string, dateTo?: string): Observable<InterviewStatistics> {
    let params = new HttpParams();

    if (dateFrom) {
      params = params.append('dateFrom', dateFrom);
    }

    if (dateTo) {
      params = params.append('dateTo', dateTo);
    }

    return this.http.get<InterviewStatistics>(`${this.API_URL}/statistics`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get availability for time slots
   */
  checkAvailability(date: string, juryIds?: string[]): Observable<{ hour: string; available: boolean }[]> {
    let params = new HttpParams().set('date', date);

    if (juryIds && juryIds.length > 0) {
      params = params.append('juryIds', juryIds.join(','));
    }

    return this.http.get<{ hour: string; available: boolean }[]>(
      `${this.API_URL}/availability`,
      { params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get conflicts for a specific time slot
   */
  checkConflicts(date: string, time: string, juryIds: string[], excludeInterviewId?: string): Observable<any[]> {
    let params = new HttpParams()
      .set('date', date)
      .set('time', time)
      .set('juryIds', juryIds.join(','));

    if (excludeInterviewId) {
      params = params.append('excludeId', excludeInterviewId);
    }

    return this.http.get<any[]>(`${this.API_URL}/conflicts`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Export Functions ====================

  /**
   * Export interviews to Excel
   */
  exportToExcel(interviews: Interview[], weekDays: CalendarDay[]): Observable<Blob> {
    const exportData = {
      interviews,
      weekDays: weekDays.map(d => ({
        name: d.name,
        date: d.date.toISOString(),
        isToday: d.isToday
      }))
    };

    return this.http.post(
      `${this.API_URL}/export/excel`,
      exportData,
      { responseType: 'blob' }
    ).pipe(
      tap(blob => this.downloadFile(blob, 'interviews.xlsx')),
      catchError(this.handleError)
    );
  }

  /**
   * Export interviews to PDF
   */
  exportToPDF(interviews: Interview[], weekDays: CalendarDay[]): Observable<Blob> {
    const exportData = {
      interviews,
      weekDays: weekDays.map(d => ({
        name: d.name,
        date: d.date.toISOString(),
        isToday: d.isToday
      }))
    };

    return this.http.post(
      `${this.API_URL}/export/pdf`,
      exportData,
      { responseType: 'blob' }
    ).pipe(
      tap(blob => this.downloadFile(blob, 'interviews.pdf')),
      catchError(this.handleError)
    );
  }

  /**
   * Export interviews to CSV
   */
  exportToCSV(interviews: Interview[]): Observable<Blob> {
    return this.http.post(
      `${this.API_URL}/export/csv`,
      { interviews },
      { responseType: 'blob' }
    ).pipe(
      tap(blob => this.downloadFile(blob, 'interviews.csv')),
      catchError(this.handleError)
    );
  }

  /**
   * Export calendar to iCal format
   */
  exportToICal(interviews: Interview[]): Observable<Blob> {
    return this.http.post(
      `${this.API_URL}/export/ical`,
      { interviews },
      { responseType: 'blob' }
    ).pipe(
      tap(blob => this.downloadFile(blob, 'interviews.ics')),
      catchError(this.handleError)
    );
  }

  // ==================== Utility Functions ====================

  /**
   * Generate meeting link (Google Meet, Zoom, etc.)
   */
  generateMeetingLink(interviewId: string, provider: 'google' | 'zoom' | 'teams'): Observable<{ link: string }> {
    return this.http.post<{ link: string }>(
      `${this.API_URL}/${interviewId}/generate-meeting`,
      { provider }
    ).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  /**
   * Suggest optimal time slots based on jury availability
   */
  suggestTimeSlots(juryIds: string[], dateRange: { start: string; end: string }): Observable<any[]> {
    return this.http.post<any[]>(
      `${this.API_URL}/suggest-slots`,
      { juryIds, dateRange }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validate interview data before creation/update
   */
  validateInterview(interview: Partial<Interview>): Observable<{ valid: boolean; errors?: string[] }> {
    return this.http.post<{ valid: boolean; errors?: string[] }>(
      `${this.API_URL}/validate`,
      interview
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Duplicate interview
   */
  duplicateInterview(id: string): Observable<Interview> {
    return this.http.post<Interview>(`${this.API_URL}/${id}/duplicate`, {}).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  // ==================== Cache Management ====================

  /**
   * Invalidate cache to force refresh
   */
  private invalidateCache(): void {
    this.cacheTimestamp = 0;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.interviewsCache$.next([]);
    this.cacheTimestamp = 0;
  }

  // ==================== Helper Methods ====================

  /**
   * Download file helper
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Error handler
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Erreur ${error.status}: ${error.statusText}`;
    }

    console.error('Interview Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Format date for API
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format time for API
   */
  formatTimeForAPI(time: string): string {
    // Ensure HH:MM format
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  /**
   * Calculate interview end time
   */
  calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  /**
   * Check if interview is in the past
   */
  isInterviewPast(interview: Interview): boolean {
    const interviewDateTime = new Date(`${interview.date}T${interview.time}`);
    return interviewDateTime < new Date();
  }

  /**
   * Check if interview is today
   */
  isInterviewToday(interview: Interview): boolean {
    const today = new Date().toISOString().split('T')[0];
    return interview.date === today;
  }

  /**
   * Check if interview is upcoming (within next 7 days)
   */
  isInterviewUpcoming(interview: Interview): boolean {
    const interviewDate = new Date(interview.date);
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return interviewDate >= today && interviewDate <= nextWeek;
  }



  getInterviewsByEmail(candidateEmail: string): Observable<Interview[]> {
    return this.http.get<Interview[]>(
      `${this.API_URL}/getInterviewsByEmail/${candidateEmail}`
    );
  }
}
