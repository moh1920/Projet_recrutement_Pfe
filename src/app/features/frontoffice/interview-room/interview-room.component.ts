import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Interview, InterviewService } from '../../../core/services/interview.service';
import { InterviewStatus } from '../../../core/models/Interview.models';
import { KeycloakService } from 'keycloak-angular';

interface CalendarCell {
  day: number;
  dateStr: string;
  currentMonth: boolean;
  isToday: boolean;
  interviews: Interview[];
}

@Component({
  selector: 'app-interview-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview-room.component.html',
  styleUrl: './interview-room.component.scss',
})
export class InterviewRoomComponent implements OnInit {
  private interviewService = inject(InterviewService);
  private keycloakService = inject(KeycloakService);

  // View state
  currentView: 'calendar' | 'list' = 'calendar';
  activeFilter = 'all';

  // Data
  interviews: Interview[] = [];
  loading = false;

  // Calendar state
  currentDate = new Date();
  selectedDate: string | null = null;

  dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  calendarCells: CalendarCell[] = [];

  monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  shortMonths = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Jun',
    'Jul',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ];

  ngOnInit(): void {
    this.loadInterviews();
  }

  loadInterviews(): void {
    const email = this.keycloakService.getKeycloakInstance().tokenParsed?.['email'];
    this.loading = true;

    this.interviewService.getInterviewsByEmail(email).subscribe({
      next: (data) => {
        this.interviews = data;
        this.buildCalendar();
        this.loading = false;
      },
      error: () => {
        // Fallback mock data for demo
        this.interviews = this.getMockInterviews();
        this.buildCalendar();
        this.loading = false;
      },
    });
  }

  // ==================== Calendar Logic ====================

  get currentMonthLabel(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();
    const todayStr = this.toDateStr(today);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-based week: 0=Mon … 6=Sun
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: CalendarCell[] = [];

    // ── Previous month padding ──
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = this.toDateStr(d);
      cells.push({
        day: d.getDate(),
        dateStr,
        currentMonth: false,
        isToday: dateStr === todayStr,
        interviews: this.getInterviewsForDate(dateStr),
      });
    }

    // ── Current month ──
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = this.toDateStr(date);
      cells.push({
        day: d,
        dateStr,
        currentMonth: true,
        isToday: dateStr === todayStr,
        interviews: this.getInterviewsForDate(dateStr),
      });
    }

    // ── Next month padding to complete rows ──
    const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      const dateStr = this.toDateStr(date);
      cells.push({
        day: d,
        dateStr,
        currentMonth: false,
        isToday: dateStr === todayStr,
        interviews: this.getInterviewsForDate(dateStr),
      });
    }

    this.calendarCells = cells;
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.selectedDate = null;
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.selectedDate = null;
    this.buildCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.buildCalendar();
  }

  selectDate(cell: CalendarCell): void {
    if (!cell.currentMonth || cell.interviews.length === 0) {
      this.selectedDate = null;
      return;
    }
    this.selectedDate = this.selectedDate === cell.dateStr ? null : cell.dateStr;
  }

  clearSelection(): void {
    this.selectedDate = null;
  }

  get selectedDayInterviews(): Interview[] {
    if (!this.selectedDate) return [];
    return this.interviews
      .filter((iv) => iv.date === this.selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  get selectedDateLabel(): string {
    if (!this.selectedDate) return '';
    const d = new Date(this.selectedDate + 'T00:00:00');
    return `${d.getDate()} ${this.monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }

  // ==================== Filters & Stats ====================

  getCountByStatus(status: string): number {
    if (status === 'all') return this.interviews.length;
    return this.interviews.filter((iv) => iv.status === status).length;
  }

  get filteredInterviews(): Interview[] {
    const list =
      this.activeFilter === 'all'
        ? this.interviews
        : this.interviews.filter((iv) => iv.status === this.activeFilter);

    return [...list].sort((a, b) => {
      const da = new Date(`${a.date}T${a.time}`);
      const db = new Date(`${b.date}T${b.time}`);
      return db.getTime() - da.getTime();
    });
  }

  // ==================== Helpers ====================

  getInterviewsForDate(dateStr: string): Interview[] {
    return this.interviews.filter((iv) => iv.date === dateStr);
  }

  getStatusClass(status: InterviewStatus | string): string {
    switch (status) {
      case 'Planifié':
        return 'planned';
      case 'En cours':
        return 'ongoing';
      case 'Terminé':
        return 'done';
      case 'Annulé':
        return 'cancelled';
      default:
        return 'planned';
    }
  }

  toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatMonth(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return this.shortMonths[d.getMonth()];
  }

  formatDay(dateStr: string): string {
    if (!dateStr) return '';
    return String(new Date(dateStr + 'T00:00:00').getDate()).padStart(2, '0');
  }

  // ==================== Mock Data ====================

  getMockInterviews(): Interview[] {
    const today = new Date();
    const fmt = (d: Date) => this.toDateStr(d);
    const next = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d;
    };

    return [
      {
        id: '1',
        candidateName: 'Maryem Sayari',
        position: 'Enseignant Informatique',
        department: 'Génie Logiciel',
        date: fmt(next(2)),
        time: '09:00',
        duration: 60,
        type: 'interview',
        status: 'Planifié',
        jury: ['Dr. Ben Ali', 'Prof. Chaabane'],
        meetLink: 'https://meet.google.com/abc-defg-hij',
      },
      {
        id: '2',
        candidateName: 'Maryem Sayari',
        position: 'Chargé de cours IA',
        department: 'Intelligence Artificielle',
        date: fmt(next(5)),
        time: '14:30',
        duration: 45,
        type: 'evaluation',
        status: 'Planifié',
        jury: ['Prof. Haddad'],
        room: 'Salle A104',
      },
      {
        id: '3',
        candidateName: 'Maryem Sayari',
        position: 'Enseignant Réseaux',
        department: 'Réseaux & Télécom',
        date: fmt(next(-3)),
        time: '10:00',
        duration: 60,
        type: 'interview',
        status: 'Terminé',
        jury: ['Dr. Mansour', 'Dr. Karray'],
        room: 'Salle B201',
      },
      {
        id: '4',
        candidateName: 'Maryem Sayari',
        position: 'Maître assistant',
        department: 'Génie Logiciel',
        date: fmt(today),
        time: '11:00',
        duration: 90,
        type: 'interview',
        status: 'En cours',
        jury: ['Prof. Romdhane'],
        meetLink: 'https://meet.google.com/xyz-uvwx-yz1',
      },
      {
        id: '5',
        candidateName: 'Maryem Sayari',
        position: 'Chargé de cours BD',
        department: "Systèmes d'Information",
        date: fmt(next(2)),
        time: '15:00',
        duration: 60,
        type: 'interview',
        status: 'Planifié',
        jury: ['Prof. Gharbi'],
        room: 'Salle C305',
      },
    ] as Interview[];
  }
}
