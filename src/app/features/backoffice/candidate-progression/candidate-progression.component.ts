import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import {
  CandidateService,
  CandidateDTO,
  StepDTO,
  StepStatus
} from '../../../core/services/candidate.service';

// ─── Toast model ─────────────────────────────────────────────────────────────
interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-candidate-progression',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './candidate-progression.component.html',
  styleUrl: './candidate-progression.component.scss'
})
export class CandidateProgressionComponent implements OnInit {

  private route           = inject(ActivatedRoute);
  private candidateService = inject(CandidateService);

  // ─── State ──────────────────────────────────────────────────────────────────
  candidates:        CandidateDTO[] = [];
  selectedCandidate: CandidateDTO | null = null;
  loading = true;

  // Add panel
  showAddPanel = false;
  savingStep   = false;
  newStep: StepDTO = this.emptyStep();

  // Edit panel - utilise l'index pour une identification fiable
  editingStepIndex: number | null = null;
  editStep: StepDTO = this.emptyStep();

  // Delete confirm
  showDeleteConfirm = false;
  deletingStep      = false;
  stepToDelete:     StepDTO | null = null;
  stepToDeleteIndex: number | null = null;

  // Toasts
  toasts: Toast[] = [];

  // ─── Init ────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const candidateId = params['candidateId'];
      const offerId     = params['offerId'];

      if (candidateId)    this.loadCandidateById(candidateId);
      else if (offerId)   this.loadCandidatesByOffer(offerId);
      else                this.loadAllCandidates();
    });
  }

  // ─── Load ────────────────────────────────────────────────────────────────────
  loadCandidateById(id: string): void {
    this.loading = true;
    this.candidateService.getAllCandidatureById(id).subscribe({
      next:  data  => this.handleCandidatesLoaded(data),
      error: err   => this.handleLoadError(err)
    });
  }

  loadCandidatesByOffer(idOffre: string): void {
    this.loading = true;
    this.candidateService.getAllCandidatureByOffre(idOffre).subscribe({
      next:  data => this.handleCandidatesLoaded(data),
      error: err  => this.handleLoadError(err)
    });
  }

  loadAllCandidates(): void {
    this.loading = true;
    this.candidateService.getAllCandidature().subscribe({
      next:  data => this.handleCandidatesLoaded(data),
      error: err  => this.handleLoadError(err)
    });
  }

  private handleCandidatesLoaded(data: CandidateDTO[]): void {
    this.candidates = data || [];
    if (this.candidates.length > 0) this.selectedCandidate = this.candidates[0];
    this.loading = false;
  }

  private handleLoadError(err: any): void {
    console.error('Erreur chargement', err);
    this.loading = false;
    this.showToast('Erreur lors du chargement des données', 'error');
  }

  // ─── Candidate selection ──────────────────────────────────────────────────────
  selectCandidate(candidate: CandidateDTO): void {
    this.selectedCandidate = candidate;
    this.closeAddPanel();
    this.cancelEdit();
    this.cancelDelete();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ═══ AJOUTER UNE ÉTAPE ═══
  // ═══════════════════════════════════════════════════════════════════════════════
  openAddStepPanel(): void {
    this.newStep     = this.emptyStep();
    this.showAddPanel = true;
    this.cancelEdit();
  }

  closeAddPanel(): void {
    this.showAddPanel = false;
    this.newStep      = this.emptyStep();
  }

  addStep(): void {
    if (!this.selectedCandidate?.id || !this.newStep.name?.trim()) return;

    this.savingStep = true;
    this.candidateService.addStep(this.selectedCandidate.id, this.newStep).subscribe({
      next: (updated) => {
        this.refreshSelectedCandidate(updated);
        this.closeAddPanel();
        this.savingStep = false;
        this.showToast(`Étape « ${this.newStep.name} » ajoutée avec succès`, 'success');
      },
      error: (err) => {
        console.error('Erreur ajout step', err);
        this.savingStep = false;
        this.showToast('Erreur lors de l\'ajout de l\'étape', 'error');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ═══ MODIFIER UNE ÉTAPE ═══
  // ═══════════════════════════════════════════════════════════════════════════════
  openEditStep(step: StepDTO, index: number): void {
    this.editingStepIndex = index;
    this.editStep = { ...step }; // Copie profonde pour éviter les modifications directes
    this.closeAddPanel();
    this.cancelDelete();
  }

  cancelEdit(): void {
    this.editingStepIndex = null;
    this.editStep        = this.emptyStep();
  }

  /**
   * Sauvegarde les modifications d'une étape
   * Utilise l'index pour identifier l'étape à modifier
   */
  saveEditStep(index: number): void {
    if (!this.selectedCandidate?.id || !this.editStep.name?.trim()) return;

    this.savingStep = true;

    // Créer une copie des étapes avec la modification
    const updatedSteps: StepDTO[] = (this.selectedCandidate.steps || []).map((s, i) =>
      i === index ? { ...this.editStep } : s
    );

    this.candidateService.updateSteps(this.selectedCandidate.id, updatedSteps).subscribe({
      next: (updated) => {
        this.refreshSelectedCandidate(updated);
        this.cancelEdit();
        this.savingStep = false;
        this.showToast('Étape modifiée avec succès', 'success');
      },
      error: (err) => {
        console.error('Erreur modification step', err);
        this.savingStep = false;
        this.showToast('Erreur lors de la modification de l\'étape', 'error');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ═══ MISE À JOUR RAPIDE DU STATUT ═══
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Met à jour rapidement le statut d'une étape
   * @param step L'étape à modifier
   * @param status Le nouveau statut (pending, current, completed)
   */
  quickUpdateStatus(step: StepDTO, status: StepStatus | string): void {
    if (!this.selectedCandidate?.id || !step.name) return;

    // Si on marque comme complété, on ajoute la date automatiquement
    const date = status === StepStatus.completed
      ? new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : step.date;

    // Mettre à jour localement d'abord pour une UI réactive
    step.status = status as StepStatus;
    if (date) step.date = date;

    // Appel API pour persister la modification
    this.candidateService.updateStepStatus(
      this.selectedCandidate.id,
      step.name,
      status as StepStatus,
      date
    ).subscribe({
      next: (updated) => {
        this.refreshSelectedCandidate(updated);
        const statusLabel = this.getStatusLabel(status as StepStatus);
        this.showToast(`Statut mis à jour : ${statusLabel}`, 'success');
      },
      error: (err) => {
        console.error('Erreur statut step', err);
        this.showToast('Erreur lors de la mise à jour du statut', 'error');
        // Recharger pour annuler la modification locale en cas d'erreur
        this.loadAllCandidates();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ═══ SUPPRIMER UNE ÉTAPE ═══
  // ═══════════════════════════════════════════════════════════════════════════════
  confirmDeleteStep(step: StepDTO, index: number): void {
    this.stepToDelete     = step;
    this.stepToDeleteIndex = index;
    this.showDeleteConfirm = true;
    this.cancelEdit();
    this.closeAddPanel();
  }

  cancelDelete(): void {
    this.stepToDelete     = null;
    this.stepToDeleteIndex = null;
    this.showDeleteConfirm = false;
  }

  deleteStep(): void {
    if (!this.selectedCandidate?.id || !this.stepToDelete?.name) return;

    this.deletingStep = true;
    this.candidateService.deleteStep(this.selectedCandidate.id, this.stepToDelete.name).subscribe({
      next: (updated) => {
        const deletedName = this.stepToDelete?.name;
        this.refreshSelectedCandidate(updated);
        this.cancelDelete();
        this.deletingStep = false;
        this.showToast(`Étape « ${deletedName} » supprimée`, 'info');
      },
      error: (err) => {
        console.error('Erreur suppression step', err);
        this.deletingStep = false;
        this.showToast('Erreur lors de la suppression de l\'étape', 'error');
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Sync the selected candidate with updated data from the API */
  private refreshSelectedCandidate(updated: CandidateDTO): void {
    this.selectedCandidate = updated;
    const idx = this.candidates.findIndex(c => c.id === updated.id);
    if (idx !== -1) this.candidates[idx] = updated;
  }

  private emptyStep(): StepDTO {
    return { name: '', status: StepStatus.pending, icon: '', date: '', description: '' };
  }

  // ─── Progress helpers ────────────────────────────────────────────────────────
  calculateProgress(): number {
    if (!this.selectedCandidate?.steps?.length) return 0;
    const w = 100 / this.selectedCandidate.steps.length;
    return this.selectedCandidate.steps.reduce((acc, s) => {
      if (s.status === 'completed') return acc + w;
      if (s.status === 'current')  return acc + w / 2;
      return acc;
    }, 0);
  }

  getCompletedCount(): number {
    return this.selectedCandidate?.steps?.filter(s => s.status === 'completed').length ?? 0;
  }

  getCurrentCount(): number {
    return this.selectedCandidate?.steps?.filter(s => s.status === 'current').length ?? 0;
  }

  getPendingCount(): number {
    return this.selectedCandidate?.steps?.filter(s => s.status === 'pending').length ?? 0;
  }

  getCompletedStepsCount(cand: CandidateDTO): number {
    return cand.steps?.filter(s => s.status === 'completed').length ?? 0;
  }

  // ─── Avatar helpers ──────────────────────────────────────────────────────────
  getInitials(name?: string): string {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getAvatarColor(name?: string): string {
    const colors = ['#8B0000', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  }

  // ─── Label helpers ───────────────────────────────────────────────────────────
  getStatusLabel(status?: StepStatus | string): string {
    switch (status) {
      case 'completed': return 'Complétée';
      case 'current':   return 'En cours';
      case 'pending':   return 'En attente';
      default:          return status || '';
    }
  }

  // ─── Toast ───────────────────────────────────────────────────────────────────
  showToast(message: string, type: Toast['type'] = 'info'): void {
    const toast: Toast = { message, type };
    this.toasts.push(toast);
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 3500);
  }
}
