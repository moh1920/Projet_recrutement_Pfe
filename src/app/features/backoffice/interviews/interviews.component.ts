import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  InterviewService,
  Interview,
  InterviewStatus,
  InterviewType,
} from '../../../core/services/interview.service';
import { InterviewDialogComponent } from './interview-dialog/interview-dialog.component';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';
import { map, takeUntil, catchError, tap, shareReplay, switchMap } from 'rxjs/operators';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { LobbyComponent } from '../lobby/lobby.component';

// ==================== Interfaces ====================
interface CalendarDay {
  name: string;
  date: Date;
  isToday: boolean;
  isWeekend?: boolean;
  isPast?: boolean;
  eventCount?: number;
}

interface CalendarEvent {
  id: string;
  interviewId: string;
  day: number;
  hour: string;
  time: string;
  endTime?: string;
  candidateName: string;
  candidateId?: string;
  position: string;
  type: InterviewType;
  duration: number;
  jury: string[];
  juryIds?: string[];
  status: InterviewStatus;
  meetLink?: string;
  room?: string;
  location?: string;
  notes?: string;
  color?: string;
  heightPx?: number;
  topOffsetPx?: number;
}

interface TimeSlot {
  hour: string;
  events: CalendarEvent[];
  isAvailable: boolean;
}

interface CalendarDaySlots {
  day: CalendarDay;
  dayIndex: number;
  slots: TimeSlot[];
}

interface FilterOptions {
  status?: InterviewStatus[];
  type?: InterviewType[];
  searchTerm?: string;
  juryMember?: string;
}

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
  pending: number;
  completed: number;
  cancelled: number;
}

@Component({
  selector: 'app-interviews',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DragDropModule,
    MatChipsModule,
    FormsModule,
    MatDividerModule,
    LobbyComponent,
  ],
  templateUrl: './interviews.component.html',
  styleUrl: './interviews.component.scss',
})
export class InterviewsComponent implements OnInit, OnDestroy {
  @ViewChild('lobbyDialog') lobbyDialog!: LobbyComponent;

  // ==================== Services ====================
  private interviewService = inject(InterviewService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  // ==================== Destruction ====================
  private destroy$ = new Subject<void>();

  // ==================== State ====================
  private filterSubject$ = new BehaviorSubject<FilterOptions>({
    status: [],
    type: [],
    searchTerm: '',
    juryMember: '',
  });

  interviews$!: Observable<Interview[]>;
  filteredInterviews$!: Observable<Interview[]>;
  calendarEvents$!: Observable<CalendarEvent[]>;
  calendarDaySlots$!: Observable<CalendarDaySlots[]>;
  stats$!: Observable<Stats>;

  currentWeekStart: Date = new Date();
  weekDays: CalendarDay[] = [];

  // Toutes les heures du jour de travail
  hours: string[] = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  // Connexion entre les dropLists du calendrier
  connectedDropLists: string[] = [];

  // Filtres (copie locale pour le binding ngModel)
  filterOptions: FilterOptions = { status: [], type: [], searchTerm: '', juryMember: '' };

  // UI State
  isLoading = false;
  selectedDate: Date | null = null;
  showCurrentTimeIndicator = false;
  currentTimeTop = 0;

  readonly interviewStatuses: InterviewStatus[] = ['Planifié', 'En cours', 'Terminé', 'Annulé'];
  readonly interviewTypes: InterviewType[] = ['interview', 'evaluation'];

  // Expose window
  readonly window = window;

  // ==================== Lifecycle ====================

  ngOnInit(): void {
    this.generateWeekDays();
    this.initializeStreams();
    this.loadInterviews();
    this.updateCurrentTimePosition();
    this.setupAutoRefresh();

    // Mise à jour de la position de l'heure actuelle toutes les minutes
    setInterval(() => {
      this.updateCurrentTimePosition();
      this.cdr.markForCheck();
    }, 60_000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== Initialisation des streams ====================

  private initializeStreams(): void {
    // Stream principal des entretiens (depuis le service)
    this.interviews$ = this.interviewService.getInterviews().pipe(
      shareReplay(1),
      catchError((error) => {
        this.showError('Erreur lors du chargement des entretiens');
        console.error('Error loading interviews:', error);
        return of([]);
      })
    );

    // Stream filtré — se recalcule à chaque changement de filtre OU de données
    this.filteredInterviews$ = this.filterSubject$.pipe(
      switchMap((filters) =>
        this.interviews$.pipe(map((interviews) => this.applyFilters(interviews, filters)))
      ),
      shareReplay(1)
    );

    // Événements calendrier (dépend des entretiens filtrés ET de la semaine courante)
    this.calendarEvents$ = this.filteredInterviews$.pipe(
      map((interviews) => this.convertToCalendarEvents(interviews)),
      shareReplay(1)
    );

    // Grille calendrier structurée pour le template
    this.calendarDaySlots$ = this.calendarEvents$.pipe(
      map((events) => this.buildCalendarGrid(events)),
      tap(() => {
        this.updateConnectedDropLists();
        this.cdr.markForCheck();
      }),
      shareReplay(1)
    );

    // Statistiques
    this.stats$ = this.interviews$.pipe(
      map((interviews) => this.computeStats(interviews)),
      shareReplay(1)
    );
  }

  // ==================== Chargement ====================

  loadInterviews(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.interviewService
      .refreshInterviews()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.showError('Erreur lors du chargement des entretiens');
          console.error('Error refreshing interviews:', error);
          this.cdr.markForCheck();
        },
      });
  }

  private setupAutoRefresh(): void {
    setInterval(() => this.loadInterviews(), 5 * 60 * 1000);
  }

  // ==================== Filtrage ====================

  private applyFilters(interviews: Interview[], filters: FilterOptions): Interview[] {
    let filtered = [...interviews];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((i) => filters.status!.includes(i.status));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((i) => filters.type!.includes(i.type));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.candidateName.toLowerCase().includes(term) ||
          i.position.toLowerCase().includes(term) ||
          i.jury?.some((j) => j.toLowerCase().includes(term))
      );
    }

    if (filters.juryMember) {
      filtered = filtered.filter((i) => i.jury?.includes(filters.juryMember!));
    }

    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }

  updateFilter(key: keyof FilterOptions, value: any): void {
    this.filterOptions = { ...this.filterOptions, [key]: value };
    this.filterSubject$.next({ ...this.filterOptions });
  }

  toggleArrayFilter<K extends 'status' | 'type'>(key: K, value: NonNullable<FilterOptions[K]>[number]): void {
    const currentArray = (this.filterOptions[key] as any[]) || [];
    const index = currentArray.indexOf(value);
    let newArray;

    if (index === -1) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter((item: any) => item !== value);
    }

    this.filterOptions = { ...this.filterOptions, [key]: newArray } as FilterOptions;
    this.filterSubject$.next({ ...this.filterOptions });
  }

  hasActiveFilters(): boolean {
    return (
      (this.filterOptions.status && this.filterOptions.status.length > 0) ||
      (this.filterOptions.type && this.filterOptions.type.length > 0) ||
      !!this.filterOptions.searchTerm ||
      !!this.filterOptions.juryMember
    );
  }

  clearFilters(): void {
    this.filterOptions = { status: [], type: [], searchTerm: '', juryMember: '' };
    this.filterSubject$.next({ ...this.filterOptions });
  }

  // ==================== Gestion du calendrier ====================

  get currentMonth(): string {
    return this.currentWeekStart.toLocaleDateString('fr-FR', { month: 'long' });
  }

  get currentYear(): number {
    return this.currentWeekStart.getFullYear();
  }

  get weekRangeLabel(): string {
    if (this.weekDays.length === 0) return '';
    const start = this.weekDays[0].date;
    const end = this.weekDays[this.weekDays.length - 1].date;
    const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${startStr} – ${endStr}`;
  }

  generateWeekDays(): void {
    const start = new Date(this.currentWeekStart);
    const day = start.getDay();
    // Aligne au lundi
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.weekDays = dayNames.map((name, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      date.setHours(0, 0, 0, 0);

      return {
        name,
        date,
        isToday: date.getTime() === today.getTime(),
        isWeekend: false,
        isPast: date < today,
        eventCount: 0,
      };
    });

    this.updateConnectedDropLists();

    // Recalcule les événements pour la nouvelle semaine
    if (this.calendarDaySlots$) {
      this.cdr.markForCheck();
    }
  }

  previousWeek(): void {
    this.currentWeekStart = new Date(this.currentWeekStart);
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
    // Force le recalcul du stream (les weekDays ont changé)
    this.filterSubject$.next({ ...this.filterOptions });
  }

  nextWeek(): void {
    this.currentWeekStart = new Date(this.currentWeekStart);
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
    this.filterSubject$.next({ ...this.filterOptions });
  }

  goToToday(): void {
    this.currentWeekStart = new Date();
    this.generateWeekDays();
    this.filterSubject$.next({ ...this.filterOptions });
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
  }

  // ==================== Conversion entretien → événement calendrier ====================

  private convertToCalendarEvents(interviews: Interview[]): CalendarEvent[] {
    if (!this.weekDays.length) return [];

    return interviews
      .filter((interview) => this.isInCurrentWeek(interview))
      .map((interview) => this.interviewToCalendarEvent(interview))
      .filter((evt) => evt.day >= 0); // Exclut les jours non trouvés
  }

  private isInCurrentWeek(interview: Interview): boolean {
    const interviewDate = new Date(interview.date);
    interviewDate.setHours(0, 0, 0, 0);
    const weekStart = this.weekDays[0]?.date;
    const weekEnd = this.weekDays[this.weekDays.length - 1]?.date;
    if (!weekStart || !weekEnd) return false;
    return interviewDate >= weekStart && interviewDate <= weekEnd;
  }

  private interviewToCalendarEvent(interview: Interview): CalendarEvent {
    const interviewDate = new Date(interview.date);
    interviewDate.setHours(0, 0, 0, 0);

    const dayIndex = this.weekDays.findIndex((d) => d.date.getTime() === interviewDate.getTime());

    const duration = interview.duration || 45;
    const [h, m] = interview.time.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const slotHeight = 100; // px par heure (correspond à min-height du slot)
    const topOffsetPx = ((startMinutes - 8 * 60) / 60) * slotHeight;
    const heightPx = Math.max((duration / 60) * slotHeight, 48);

    // Heure d'heure la plus proche (pour le slot)
    const hourSlot = `${h.toString().padStart(2, '0')}:00`;

    return {
      id: `evt-${interview.id}`,
      interviewId: interview.id,
      day: dayIndex,
      hour: hourSlot,
      time: interview.time,
      endTime: this.calculateEndTime(interview.time, duration),
      candidateName: interview.candidateName,
      candidateId: interview.candidateId,
      position: interview.position,
      type: interview.type,
      duration,
      jury: interview.jury || [],
      juryIds: interview.juryIds,
      status: interview.status,
      meetLink: interview.meetLink,
      room: interview.room,
      location: interview.location,
      notes: interview.notes,
      color: this.getEventColor(interview.type, interview.status),
      heightPx,
      topOffsetPx,
    };
  }

  // ==================== Grille du calendrier ====================

  private buildCalendarGrid(events: CalendarEvent[]): CalendarDaySlots[] {
    // Met à jour le compteur d'événements sur les jours
    this.weekDays.forEach((day, dayIndex) => {
      day.eventCount = events.filter((e) => e.day === dayIndex).length;
    });

    return this.weekDays.map((day, dayIndex) => {
      const slots: TimeSlot[] = this.hours.map((hour) => {
        const slotEvents = events.filter((e) => e.day === dayIndex && e.hour === hour);
        const hourNum = parseInt(hour.split(':')[0], 10);
        return {
          hour,
          events: slotEvents,
          isAvailable: !day.isPast && hourNum >= 8 && hourNum <= 17,
        };
      });

      return { day, dayIndex, slots };
    });
  }

  private updateConnectedDropLists(): void {
    const ids: string[] = [];
    this.weekDays.forEach((_, dayIndex) => {
      this.hours.forEach((hour) => {
        ids.push(this.getDropListId(dayIndex, hour));
      });
    });
    this.connectedDropLists = ids;
  }

  getDropListId(dayIndex: number, hour: string): string {
    return `drop-${dayIndex}-${hour.replace(':', '')}`;
  }

  // ==================== Drag & Drop ====================

  onDrop(event: CdkDragDrop<CalendarEvent[]>, targetDay: CalendarDay, targetHour: string): void {
    const targetDayIndex = this.weekDays.findIndex(
      (d) => d.date.getTime() === targetDay.date.getTime()
    );

    if (targetDay.isPast) {
      this.showWarning('Impossible de déplacer un entretien dans le passé');
      return;
    }

    const hourNum = parseInt(targetHour.split(':')[0], 10);
    if (hourNum < 8 || hourNum > 17) {
      this.showWarning('Créneau en dehors des heures de travail');
      return;
    }

    const movedEvent: CalendarEvent = event.item.data;

    if (!movedEvent) {
      console.error('No event data on dragged item');
      return;
    }

    // Même conteneur : réorganisation locale (pas d'API call nécessaire)
    if (event.previousContainer === event.container) {
      return;
    }

    // Déplacement vers un autre slot
    this.updateInterviewDateTime(movedEvent, targetDay, targetHour);
  }

  private updateInterviewDateTime(event: CalendarEvent, day: CalendarDay, hour: string): void {
    const updatedInterview: Partial<Interview> = {
      date: day.date.toISOString().split('T')[0],
      time: hour,
    };

    this.interviewService
      .updateInterview(event.interviewId, updatedInterview)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Entretien déplacé avec succès');
          this.loadInterviews();
        },
        error: (error) => {
          this.showError("Erreur lors du déplacement de l'entretien");
          console.error('Error moving interview:', error);
        },
      });
  }

  // ==================== CRUD ====================

  openAddDialog(day?: CalendarDay, hour?: string): void {
    const initialData =
      day && hour
        ? {
            date: day.date.toISOString().split('T')[0],
            time: hour,
          }
        : {};

    const dialogRef = this.dialog.open(InterviewDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'modern-dialog',
      data: initialData,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) this.createInterview(result);
      });
  }

  private createInterview(interviewData: Partial<Interview>): void {
    this.interviewService
      .createInterview(interviewData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interview) => {
          this.showSuccess('Entretien créé avec succès');
          this.loadInterviews();
          this.sendNotifications(interview, 'created');
        },
        error: (error) => {
          this.showError("Erreur lors de la création de l'entretien");
          console.error('Error creating interview:', error);
        },
      });
  }

  editInterview(interview: Interview): void {
    const dialogRef = this.dialog.open(InterviewDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'modern-dialog',
      data: { ...interview },
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) this.updateInterview(interview.id, result);
      });
  }

  protected updateInterview(id: string, updates: Partial<Interview>): void {
    this.interviewService
      .updateInterview(id, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interview) => {
          this.showSuccess('Entretien mis à jour avec succès');
          this.loadInterviews();
          this.sendNotifications(interview, 'updated');
        },
        error: (error) => {
          this.showError("Erreur lors de la mise à jour de l'entretien");
          console.error('Error updating interview:', error);
        },
      });
  }

  cancelInterview(interview: Interview): void {
    if (confirm(`Êtes-vous sûr de vouloir annuler l'entretien avec ${interview.candidateName} ?`)) {
      this.updateInterview(interview.id, { status: 'Annulé' as InterviewStatus });
    }
  }

  deleteInterview(interview: Interview): void {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer l'entretien avec ${interview.candidateName} ? Cette action est irréversible.`
      )
    ) {
      this.interviewService
        .deleteInterview(interview.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess('Entretien supprimé avec succès');
            this.loadInterviews();
          },
          error: (error) => {
            this.showError("Erreur lors de la suppression de l'entretien");
            console.error('Error deleting interview:', error);
          },
        });
    }
  }

  // ==================== Actions ====================

  joinMeeting(interview: Interview, $event?: Event): void {
    $event?.stopPropagation();
    if (!interview.meetLink || interview.meetLink === '#') {
      this.showWarning('Aucun lien de réunion disponible');
      return;
    }
    if (interview.status === 'Planifié') {
      this.updateInterview(interview.id, { status: 'En cours' as InterviewStatus });
    }
    window.open(interview.meetLink, '_blank');
  }

  markAsCompleted(interview: Interview): void {
    this.updateInterview(interview.id, { status: 'Terminé' as InterviewStatus });
  }

  duplicateInterview(interview: Interview): void {
    const { id, ...interviewData } = interview;
    this.createInterview({
      ...interviewData,
      candidateName: `${interviewData.candidateName} (Copie)`,
      status: 'Planifié' as InterviewStatus,
    });
  }

  quickView(evt: Partial<CalendarEvent> | { id?: string; interviewId?: string }): void {
    const interviewId = (evt as CalendarEvent).interviewId || (evt as any).id;
    if (!interviewId) {
      this.showError("ID d'entretien manquant");
      return;
    }

    this.interviewService
      .getInterviewById(interviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interview) => {
          // Ouvrir le dialog en mode lecture seule / détails
          this.dialog.open(InterviewDialogComponent, {
            width: '700px',
            maxWidth: '95vw',
            panelClass: 'modern-dialog',
            data: { ...interview, readOnly: true },
          });
        },
        error: () => this.showError('Erreur lors du chargement des détails'),
      });
  }

  // ==================== Export ====================

  exportToExcel(): void {
    this.interviews$.pipe(takeUntil(this.destroy$)).subscribe((interviews) => {
      this.interviewService
        .exportToExcel(interviews, this.weekDays)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.showSuccess('Export Excel réussi'),
          error: () => this.showError("Erreur lors de l'export"),
        });
    });
  }

  exportToPDF(): void {
    this.interviews$.pipe(takeUntil(this.destroy$)).subscribe((interviews) => {
      this.interviewService
        .exportToPDF(interviews, this.weekDays)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.showSuccess('Export PDF réussi'),
          error: () => this.showError("Erreur lors de l'export"),
        });
    });
  }

  printCalendar(): void {
    window.print();
  }

  // ==================== Statistiques ====================

  private computeStats(interviews: Interview[]): Stats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = this.weekDays[0]?.date || today;
    const weekEnd = this.weekDays[this.weekDays.length - 1]?.date || today;

    return {
      total: interviews.length,
      today: interviews.filter((i) => {
        const d = new Date(i.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }).length,
      thisWeek: interviews.filter((i) => {
        const d = new Date(i.date);
        d.setHours(0, 0, 0, 0);
        return d >= weekStart && d <= weekEnd;
      }).length,
      pending: interviews.filter((i) => i.status === 'Planifié').length,
      completed: interviews.filter((i) => i.status === 'Terminé').length,
      cancelled: interviews.filter((i) => i.status === 'Annulé').length,
    };
  }

  // ==================== Indicateur d'heure courante ====================

  private updateCurrentTimePosition(): void {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    this.showCurrentTimeIndicator = hour >= 8 && hour <= 18;

    if (this.showCurrentTimeIndicator) {
      // Calcul de la position en % depuis le haut du corps du calendrier
      const totalMinutesFromStart = (hour - 8) * 60 + minutes;
      const totalWorkMinutes = 10 * 60; // 8h à 18h
      this.currentTimeTop = (totalMinutesFromStart / totalWorkMinutes) * 100;
    }
  }

  // ==================== Utilitaires ====================

  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const total = hours * 60 + minutes + duration;
    return `${Math.floor(total / 60)
      .toString()
      .padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
  }

  private getEventColor(type: InterviewType, status: InterviewStatus): string {
    if (status === 'Annulé') return '#64748b';
    if (status === 'Terminé') return '#10b981';
    if (status === 'En cours') return '#f59e0b';
    return type === 'interview' ? '#8B0000' : '#3b82f6';
  }

  getInterviewStatusColor(status: InterviewStatus): string {
    const colors: Record<InterviewStatus, string> = {
      Planifié: '#3b82f6',
      'En cours': '#f59e0b',
      Terminé: '#10b981',
      Annulé: '#64748b',
    };
    return colors[status] || '#64748b';
  }

  getInterviewTypeIcon(type: InterviewType): string {
    return type === 'interview' ? 'people' : 'assignment';
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  }

  isInterviewPast(interview: Interview): boolean {
    return new Date(`${interview.date}T${interview.time}`) < new Date();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  trackByInterviewId(_: number, interview: Interview): string {
    return interview.id;
  }

  trackByEventId(_: number, event: CalendarEvent): string {
    return event.id;
  }

  trackByDayIndex(_: number, daySlot: CalendarDaySlots): number {
    return daySlot.dayIndex;
  }

  trackByHour(_: number, hour: string): string {
    return hour;
  }

  // ==================== Méthodes publiques pour le template calendrier ====================

  editEventFromCalendar(evt: CalendarEvent): void {
    // Récupère l'entretien complet depuis le service pour l'édition
    this.interviewService
      .getInterviewById(evt.interviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interview) => this.editInterview(interview),
        error: () => {
          // Fallback : ouvre le dialog avec les données partielles disponibles
          this.editInterview({
            id: evt.interviewId,
            candidateName: evt.candidateName,
            position: evt.position,
            type: evt.type,
            status: evt.status,
            time: evt.time,
            duration: evt.duration,
            jury: evt.jury,
            date: this.weekDays[evt.day]?.date?.toISOString().split('T')[0] || '',
          } as Interview);
        },
      });
  }

  markEventAsCompleted(evt: CalendarEvent): void {
    this.updateInterview(evt.interviewId, { status: 'Terminé' as InterviewStatus });
  }

  private sendNotifications(
    interview: Interview,
    action: 'created' | 'updated' | 'cancelled'
  ): void {
    console.log('Sending notifications:', { interview, action });
    // À implémenter via un service de notification
  }

  // ==================== Snackbars ====================

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  openLobby(): void {
    this.lobbyDialog.open(); // ← la fonction d'ouverture
  }
}
