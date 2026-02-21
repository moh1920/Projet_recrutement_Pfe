// ==================== Core Models ====================

export interface Interview {
  id: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  position: string;
  department?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  type: InterviewType;
  status: InterviewStatus;
  jury: string[]; // Names
  juryIds?: string[];
  juryEmails?: string[];
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

export type InterviewStatus = 'Planifié' | 'En cours' | 'Terminé' | 'Annulé';
export type InterviewType = 'interview' | 'evaluation';

// ==================== Supporting Models ====================

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resume?: string; // URL to resume
  portfolio?: string;
  linkedin?: string;
  experience?: number; // years
  education?: Education[];
  skills?: string[];
  appliedPosition?: string;
  appliedDate?: string;
  status?: CandidateStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CandidateStatus = 'Nouveau' | 'En cours' | 'Accepté' | 'Refusé' | 'En attente';

export interface Education {
  degree: string;
  institution: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export interface JuryMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  role?: JuryRole;
  expertise?: string[];
  availability?: Availability[];
  maxInterviewsPerDay?: number;
  preferredTimeSlots?: TimeSlot[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type JuryRole = 'Président' | 'Membre' | 'Observateur' | 'Expert';

export interface Availability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  available: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type
  size: number; // bytes
  uploadedBy?: string;
  uploadedAt: string;
}

export interface EvaluationCriteria {
  id: string;
  criterion: string;
  weight: number; // 0-100
  description?: string;
  category?: string;
}

export interface Evaluation {
  id: string;
  interviewId: string;
  juryMemberId: string;
  scores: CriterionScore[];
  overallScore?: number;
  recommendation?: Recommendation;
  comments?: string;
  strengths?: string[];
  weaknesses?: string[];
  decidedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CriterionScore {
  criterionId: string;
  criterionName: string;
  score: number; // 0-10 or 0-100 depending on scale
  comment?: string;
}

export type Recommendation = 'Fortement recommandé' | 'Recommandé' | 'Neutre' | 'Non recommandé' | 'Fortement non recommandé';

// ==================== Request/Response Models ====================

export interface CreateInterviewRequest {
  candidateId?: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  position: string;
  department?: string;
  date: string;
  time: string;
  duration: number;
  type: InterviewType;
  juryIds: string[];
  meetLink?: string;
  room?: string;
  location?: string;
  notes?: string;
  requirements?: string[];
  evaluationCriteria?: Partial<EvaluationCriteria>[];
}

export interface UpdateInterviewRequest {
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  position?: string;
  department?: string;
  date?: string;
  time?: string;
  duration?: number;
  type?: InterviewType;
  status?: InterviewStatus;
  juryIds?: string[];
  meetLink?: string;
  room?: string;
  location?: string;
  notes?: string;
  requirements?: string[];
}

export interface RescheduleRequest {
  date: string;
  time: string;
  notifyParticipants?: boolean;
  reason?: string;
}

export interface NotificationRequest {
  interview: Interview;
  action: NotificationAction;
  recipients: string[];
  customMessage?: string;
  sendEmail?: boolean;
  sendSMS?: boolean;
}

export type NotificationAction = 'created' | 'updated' | 'cancelled' | 'reminder' | 'rescheduled';

export interface BulkOperationRequest {
  interviewIds: string[];
  action: BulkAction;
  data?: any;
}

export type BulkAction = 'delete' | 'cancel' | 'reschedule' | 'update_status' | 'send_reminder';

export interface FilterRequest {
  status?: InterviewStatus[];
  type?: InterviewType[];
  dateFrom?: string;
  dateTo?: string;
  candidateName?: string;
  position?: string;
  juryMember?: string;
  department?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AvailabilityRequest {
  date: string;
  juryIds?: string[];
  duration?: number;
  includeBreaks?: boolean;
}

export interface AvailabilityResponse {
  date: string;
  timeSlots: {
    hour: string;
    available: boolean;
    conflictingInterviews?: number;
    availableJury?: string[];
  }[];
}

export interface ConflictCheckRequest {
  date: string;
  time: string;
  duration?: number;
  juryIds: string[];
  room?: string;
  excludeInterviewId?: string;
}

export interface ConflictCheckResponse {
  hasConflict: boolean;
  conflicts: {
    type: ConflictType;
    interviewId?: string;
    juryMemberId?: string;
    juryMemberName?: string;
    room?: string;
    details: string;
  }[];
}

export type ConflictType = 'jury_unavailable' | 'room_occupied' | 'time_overlap' | 'max_interviews_exceeded';

export interface SuggestTimeSlotsRequest {
  juryIds: string[];
  dateRange: {
    start: string;
    end: string;
  };
  duration?: number;
  preferredDays?: number[]; // 0-6
  preferredTimeRanges?: TimeSlot[];
  maxSuggestions?: number;
}

export interface SuggestTimeSlotsResponse {
  suggestions: {
    date: string;
    time: string;
    score: number; // 0-100 based on preferences
    availableJury: string[];
    reason?: string;
  }[];
}

// ==================== Statistics Models ====================

export interface InterviewStatistics {
  total: number;
  byStatus: Record<InterviewStatus, number>;
  byType: Record<InterviewType, number>;
  byDepartment: Record<string, number>;
  byMonth: MonthlyStatistic[];
  averageDuration: number;
  upcomingCount: number;
  completionRate: number;
  cancellationRate: number;
  mostActiveJuryMembers: {
    id: string;
    name: string;
    count: number;
  }[];
  busyDays: {
    date: string;
    count: number;
  }[];
}

export interface MonthlyStatistic {
  month: string; // YYYY-MM
  count: number;
  completed: number;
  cancelled: number;
}

export interface JuryStatistics {
  juryMemberId: string;
  juryMemberName: string;
  totalInterviews: number;
  upcomingInterviews: number;
  completedInterviews: number;
  averageScore?: number;
  participationRate: number;
  availability: number; // percentage
}

export interface DepartmentStatistics {
  department: string;
  totalInterviews: number;
  byPosition: Record<string, number>;
  averageDuration: number;
  completionRate: number;
}

// ==================== Export Models ====================

export interface ExportRequest {
  format: ExportFormat;
  interviews: Interview[];
  weekDays?: {
    name: string;
    date: string;
    isToday: boolean;
  }[];
  includeEvaluations?: boolean;
  includeStatistics?: boolean;
}

export type ExportFormat = 'excel' | 'pdf' | 'csv' | 'ical' | 'json';

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  locale?: string;
}

// ==================== Calendar Models ====================

export interface CalendarEvent {
  id: string;
  interviewId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  location?: string;
  attendees?: string[];
  recurrence?: RecurrenceRule;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
  occurrences?: number;
}

export interface CalendarView {
  startDate: string;
  endDate: string;
  events: CalendarEvent[];
  holidays?: {
    date: string;
    name: string;
  }[];
}

// ==================== Notification Models ====================

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationAction;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables?: string[];
  active?: boolean;
}

export interface NotificationHistory {
  id: string;
  interviewId: string;
  type: NotificationAction;
  recipients: string[];
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

// ==================== Validation Models ====================

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ==================== Meeting Integration Models ====================

export interface MeetingProvider {
  type: 'google' | 'zoom' | 'teams' | 'custom';
  apiKey?: string;
  credentials?: any;
  settings?: MeetingSettings;
}

export interface MeetingSettings {
  autoRecording?: boolean;
  waitingRoom?: boolean;
  muteOnEntry?: boolean;
  allowScreenSharing?: boolean;
  maxParticipants?: number;
}

export interface MeetingDetails {
  link: string;
  meetingId?: string;
  password?: string;
  dialInNumbers?: string[];
  accessCode?: string;
}

// ==================== Search Models ====================

export interface SearchRequest {
  query: string;
  filters?: FilterRequest;
  facets?: string[];
  highlight?: boolean;
}

export interface SearchResponse {
  results: Interview[];
  total: number;
  facets?: Record<string, { value: string; count: number }[]>;
  took?: number; // milliseconds
}

// ==================== Audit Models ====================

export interface AuditLog {
  id: string;
  entityType: 'interview' | 'candidate' | 'jury';
  entityId: string;
  action: AuditAction;
  userId: string;
  userName: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: string;
  ipAddress?: string;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'send_notification';

// ==================== Error Models ====================

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
}

export interface ErrorResponse {
  error: ApiError;
  statusCode: number;
}

// ==================== Utility Types ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
