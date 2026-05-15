import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe, SlicePipe } from '@angular/common';
import {
  CandidateService,
  CandidateDTO,
  CandidateStatus,
} from '../../../core/services/candidate.service';
import { CalendarDay, Interview, InterviewService } from '../../../core/services/interview.service';
import { takeUntil } from 'rxjs/operators';
import { InterviewDialogComponent } from '../interviews/interview-dialog/interview-dialog.component';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { OffreService } from '../../../core/services/offre.service';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    DatePipe,
    SlicePipe,
  ],
  templateUrl: './candidates.component.html',
  styleUrl: './candidates.component.scss',
})
export class CandidatesComponent implements OnInit, AfterViewInit {
  // ─── Services ────────────────────────────────────────────────────────────────
  private candidateService = inject(CandidateService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private interviewService = inject(InterviewService);
  private offreService = inject(OffreService);
  private router = inject(Router);

  // ─── ViewChild ───────────────────────────────────────────────────────────────
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ─── Table ───────────────────────────────────────────────────────────────────
  dataSource = new MatTableDataSource<CandidateDTO>([]);
  selection = new SelectionModel<CandidateDTO>(true, []);

  displayedColumns: string[] = [
    'select',
    'name',
    'email',
    'appliedPosition',
    'experience',
    'skills',
    'status',
    'appliedDate',
    'offre',
    'actions',
  ];

  availableColumns: string[] = [
    'name',
    'email',
    'appliedPosition',
    'experience',
    'skills',
    'status',
    'appliedDate',
    'offre',
  ];

  // ─── Filters ─────────────────────────────────────────────────────────────────
  // On garde l'état en propriétés de classe.
  // Le filterPredicate les lit directement → pas besoin de sérialiser en JSON.
  searchValue = '';
  selectedStatus = 'Tous';

  // ─── Offre Filter ─────────────────────────────────────────────────────────────
  selectedOffre = 'Tous';
  availableOffres: { id: string; title: string }[] = [];

  availableStatuses: string[] = [
    'Tous',
    CandidateStatus.NOUVEAU,
    CandidateStatus.EN_COURS,
    CandidateStatus.ACCEPTE,
    CandidateStatus.REFUSE,
    CandidateStatus.EN_ATTENTE,
  ];

  // ─── Stats ───────────────────────────────────────────────────────────────────
  get totalCandidates(): number {
    return this.dataSource.data.length;
  }

  get admittedCandidates(): number {
    return this.dataSource.data.filter((c) => c.status === CandidateStatus.ACCEPTE).length;
  }

  get pendingCandidates(): number {
    return this.dataSource.data.filter(
      (c) => c.status === CandidateStatus.EN_ATTENTE || c.status === CandidateStatus.EN_COURS
    ).length;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.setupFilter();
    this.loadCandidates();
  }

  filterByOffre(offreId: string): void {
    this.selectedOffre = offreId;
    this.refreshFilter();
  }

  offreNameMap: { [id: string]: string } = {};

  loadOffreNames(candidates: any[]) {
    const uniqueIds = [...new Set(candidates.map((c) => c.idOffre).filter(Boolean))];

    // Reset
    this.availableOffres = [{ id: 'Tous', title: 'Toutes les offres' }];

    uniqueIds.forEach((id) => {
      this.offreService.getOffreById(id).subscribe((offre) => {
        this.offreNameMap[id] = offre.title;
        // Ajouter à la liste des filtres
        this.availableOffres.push({ id, title: offre.title });
      });
    });
  }

  getOffreName(id: string): string {
    return this.offreNameMap[id] || '—';
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ─── Data Loading ────────────────────────────────────────────────────────────
  private loadCandidates(): void {
    this.candidateService.getAllCandidature().subscribe({
      next: (candidates) => {
        this.dataSource.data = candidates;
        this.loadOffreNames(candidates);
      },
      error: (err) => {
        console.error('Erreur chargement candidatures:', err);
        this.showSnackBar('Erreur lors du chargement des candidatures', 'error');
      },
    });
  }

  // ─── Filter Setup ────────────────────────────────────────────────────────────
  // Le filterPredicate lit `this.searchValue` et `this.selectedStatus` directement.
  // On déclenche la réévaluation en assignant dataSource.filter à un timestamp
  // (valeur toujours différente → Angular relance le predicate sur chaque ligne).
  private setupFilter(): void {
    this.dataSource.filterPredicate = (data: CandidateDTO): boolean => {
      const search = this.searchValue.trim().toLowerCase();

      const matchesSearch =
        !search ||
        (data.fullName?.toLowerCase().includes(search) ?? false) ||
        (data.email?.toLowerCase().includes(search) ?? false) ||
        (data.appliedPosition?.toLowerCase().includes(search) ?? false) ||
        (data.skills?.some((s) => s.toLowerCase().includes(search)) ?? false);

      const matchesStatus = this.selectedStatus === 'Tous' || data.status === this.selectedStatus;

      // ✅ Nouveau filtre offre
      const matchesOffre = this.selectedOffre === 'Tous' || data.idOffre === this.selectedOffre;

      return matchesSearch && matchesStatus && matchesOffre;
    };
  }

  // Déclenche la réévaluation du filterPredicate
  private refreshFilter(): void {
    this.dataSource.filter = String(Date.now());
    this.dataSource.paginator?.firstPage();
  }

  // ─── Search & Filter ─────────────────────────────────────────────────────────
  applyFilter(event: Event): void {
    this.searchValue = (event.target as HTMLInputElement).value;
    this.refreshFilter();
  }

  clearFilter(input: HTMLInputElement): void {
    input.value = '';
    this.searchValue = '';
    this.refreshFilter();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.refreshFilter();
  }

  // ─── Column Visibility ───────────────────────────────────────────────────────
  isColumnVisible(col: string): boolean {
    return this.displayedColumns.includes(col);
  }

  toggleColumn(col: string): void {
    if (['select', 'name', 'actions'].includes(col)) return;
    if (this.isColumnVisible(col)) {
      this.displayedColumns = this.displayedColumns.filter((c) => c !== col);
    } else {
      const idx = this.displayedColumns.indexOf('actions');
      this.displayedColumns.splice(idx, 0, col);
    }
  }

  // ─── Selection ───────────────────────────────────────────────────────────────
  isAllSelected(): boolean {
    return (
      this.selection.selected.length === this.dataSource.filteredData.length &&
      this.dataSource.filteredData.length > 0
    );
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.filteredData.forEach((row) => this.selection.select(row));
    }
  }

  // ─── CRUD Actions ────────────────────────────────────────────────────────────
  openAddDialog(): void {
    // TODO: this.dialog.open(CandidateDialogComponent, { width: '600px', data: null })
    //   .afterClosed().subscribe(result => { if (result) this.loadCandidates(); });
    this.showSnackBar("Dialog d'ajout à implémenter", 'info');
  }

  openEditDialog(candidate: CandidateDTO): void {
    // TODO: this.dialog.open(CandidateDialogComponent, { width: '600px', data: candidate })
    //   .afterClosed().subscribe(result => { if (result) this.loadCandidates(); });
    this.showSnackBar(`Modification de ${candidate.fullName}`, 'info');
  }

  viewDetais(candidate: CandidateDTO): void {
    console.log(candidate.id);
    this.router.navigate(['/admin/candidatsDetais', candidate.id]);
  }

  viewProgression(candidate: CandidateDTO): void {
    this.router.navigate(['/admin/candidate-progression'], {
      queryParams: { candidateId: candidate.id },
    });
  }

  goToManualEvaluation(candidate: CandidateDTO): void {
    if (!candidate.idOffre || !candidate.id) {
      this.showSnackBar('Identifiant de l\'offre ou du candidat manquant.', 'error');
      return;
    }
    this.router.navigate(['/admin/manual-evaluation', candidate.idOffre, candidate.id]);
  }

  downloadResume(candidate: CandidateDTO): void {
    if (!candidate.resume) {
      this.showSnackBar('Aucun CV disponible pour ce candidat', 'warning');
      return;
    }
    window.open(candidate.resume, '_blank');
  }

  openAddDialogInterview(day?: CalendarDay, hour?: string): void {
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

    dialogRef.afterClosed();
  }

  updateStatus(candidate: CandidateDTO, newStatus: string): void {
    if (!candidate.id) return;
    this.candidateService.updateStatus(candidate.id, newStatus).subscribe({
      next: () => {
        candidate.status = newStatus as CandidateStatus;
        this.dataSource.data = [...this.dataSource.data];
        this.showSnackBar(`Statut mis à jour : ${newStatus}`, 'success');
      },
      error: (err) => {
        console.error('Erreur mise à jour statut:', err);
        this.showSnackBar('Erreur lors de la mise à jour du statut', 'error');
      },
    });
  }

  deleteCandidate(id?: string): void {
    if (!id) return;
    this.candidateService.deleteCandidate(id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter((c) => c.id !== id);
        this.showSnackBar('Candidat supprimé avec succès', 'success');
      },
      error: (err) => {
        console.error('Erreur suppression candidat:', err);
        this.showSnackBar('Erreur lors de la suppression', 'error');
      },
    });
  }

  deleteSelected(): void {
    if (!this.selection.selected.length) return;
    const toDelete = new Set(this.selection.selected);
    const count = toDelete.size;
    this.dataSource.data = this.dataSource.data.filter((c) => !toDelete.has(c));
    this.selection.clear();
    this.showSnackBar(`${count} candidat(s) supprimé(s)`, 'success');
  }

  exportData(): void {
    const csv = this.convertToCSV(this.dataSource.filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidats_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.showSnackBar('Export CSV téléchargé', 'success');
  }

  // ─── Display Helpers ─────────────────────────────────────────────────────────
  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getAvatarColor(name?: string): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
      'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    ];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  }

  getStatusClass(status?: string): string {
    const map: Record<string, string> = {
      [CandidateStatus.NOUVEAU]: 'status-nouveau',
      [CandidateStatus.EN_COURS]: 'status-en-cours',
      [CandidateStatus.ACCEPTE]: 'status-accepte',
      [CandidateStatus.REFUSE]: 'status-refuse',
      [CandidateStatus.EN_ATTENTE]: 'status-en-attente',
    };
    return map[status ?? ''] ?? 'status-en-attente';
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────
  private convertToCSV(data: CandidateDTO[]): string {
    const headers = [
      'Nom',
      'Email',
      'Téléphone',
      'Poste visé',
      'Expérience',
      'Statut',
      'Date de candidature',
    ];
    const rows = data.map((c) => [
      c.fullName ?? '',
      c.email ?? '',
      c.phone ?? '',
      c.appliedPosition ?? '',
      c.experience ?? '',
      c.status ?? '',
      c.appliedDate ?? '',
    ]);
    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const panelClass: Record<string, string> = {
      success: 'snack-success',
      error: 'snack-error',
      warning: 'snack-warning',
      info: 'snack-info',
    };
    this.snackBar.open(message, 'Fermer', {
      duration: 3500,
      panelClass: [panelClass[type]],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private destroy$ = new Subject<void>();

  scheduleInterview(candidate: CandidateDTO): void {
    const dialogRef = this.dialog.open(InterviewDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'modern-dialog',
      data: {
        candidateName: candidate.fullName,
        candidateId: candidate.id,
        candidateEmail: candidate.email,
        candidatePhone: candidate.phone,
        position: candidate.appliedPosition, // adapte selon ton DTO
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result) this.createInterview(result);
      }
    });

    this.showSnackBar(`Planification entretien pour ${candidate.fullName}`, 'info');
  }

  private createInterview(interviewData: Partial<Interview>): void {
    this.interviewService
      .createInterview(interviewData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interview) => {
          console.log(interviewData);
        },
        error: (error) => {
          console.error('Error creating interview:', error);
        },
      });
  }

  protected readonly CandidateStatus = CandidateStatus;
}
