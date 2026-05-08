import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import {
  CandidateDTO,
  CandidateService,
  CandidateStatus,
  StepDTO,
  StepStatus,
} from '../../../core/services/candidate.service';
import { KeycloakService } from 'keycloak-angular';
import { ProfileService } from '../../../core/services/profile.service';

interface CandidatureWithSteps {
  candidature: CandidateDTO;
  steps: StepDTO[];
  isExpanded: boolean;
  isLoadingSteps: boolean;
}

@Component({
  selector: 'app-candidature-steps',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidature-steps.component.html',
  styleUrls: ['./candidature-steps.component.scss'],
})
export class CandidatureStepsComponent implements OnInit, OnDestroy {
  candidaturesWithSteps: CandidatureWithSteps[] = [];
  isLoading = false;
  errorMessage = '';

  readonly CandidateStatus = CandidateStatus;
  readonly StepStatus = StepStatus;

  private readonly keycloakService = inject(KeycloakService);
  private readonly profileService = inject(ProfileService);
  private readonly candidateSvc = inject(CandidateService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    const userId = this.keycloakService.getKeycloakInstance().tokenParsed?.['sub'];

    if (!userId) {
      this.errorMessage = 'Utilisateur non authentifié. Veuillez vous reconnecter.';
      return;
    }

    this.isLoading = true;

    this.profileService
      .getProfileByUserId(userId)
      .pipe(
        switchMap((profile) => {
          if (!profile?.id) throw new Error('Profil introuvable');
          return this.candidateSvc.getAllCandidatureByProfile(profile.id);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: CandidateDTO[]) => {
          this.candidaturesWithSteps = data.map((c) => ({
            candidature: c,
            steps: [],
            isExpanded: false,
            isLoadingSteps: false,
          }));
          this.isLoading = false;
          // Auto-load steps for each candidature
          this.candidaturesWithSteps.forEach((item, index) => {
            this.loadStepsFor(index);
          });
        },
        error: (err) => {
          console.error('Erreur chargement candidatures :', err);
          this.errorMessage = err?.message?.includes('Profil')
            ? 'Profil introuvable. Veuillez vous reconnecter.'
            : 'Impossible de charger vos candidatures. Veuillez réessayer.';
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStepsFor(index: number): void {
    const item = this.candidaturesWithSteps[index];
    if (!item.candidature.id) return;

    item.isLoadingSteps = true;
    this.candidateSvc.getSteps(item.candidature.id).subscribe({
      next: (steps) => {
        item.steps = steps;
        item.isLoadingSteps = false;
      },
      error: () => {
        item.isLoadingSteps = false;
      },
    });
  }

  toggleExpand(index: number): void {
    this.candidaturesWithSteps[index].isExpanded =
      !this.candidaturesWithSteps[index].isExpanded;
  }

  getCompletedCount(steps: StepDTO[]): number {
    return steps.filter((s) => s.status === StepStatus.completed).length;
  }

  getCurrentStep(steps: StepDTO[]): StepDTO | null {
    return steps.find((s) => s.status === StepStatus.current) ?? null;
  }

  getProgressPercent(steps: StepDTO[]): number {
    if (!steps.length) return 0;
    return Math.round((this.getCompletedCount(steps) / steps.length) * 100);
  }

  getStatusLabel(status?: CandidateStatus): string {
    switch (status) {
      case CandidateStatus.NOUVEAU:
        return 'Nouvelle candidature';
      case CandidateStatus.EN_COURS:
        return "En cours d'analyse";
      case CandidateStatus.EN_ATTENTE:
        return 'En attente';
      case CandidateStatus.ACCEPTE:
        return 'Acceptée';
      case CandidateStatus.REFUSE:
        return 'Refusée';
      default:
        return 'Inconnu';
    }
  }

  getStatusIcon(status?: CandidateStatus): string {
    switch (status) {
      case CandidateStatus.NOUVEAU:
        return 'send';
      case CandidateStatus.EN_COURS:
        return 'visibility';
      case CandidateStatus.EN_ATTENTE:
        return 'hourglass_empty';
      case CandidateStatus.ACCEPTE:
        return 'check_circle';
      case CandidateStatus.REFUSE:
        return 'cancel';
      default:
        return 'help_outline';
    }
  }

  getStatusClass(status?: CandidateStatus): string {
    switch (status) {
      case CandidateStatus.NOUVEAU:
        return 'status-nouveau';
      case CandidateStatus.EN_COURS:
        return 'status-en-cours';
      case CandidateStatus.EN_ATTENTE:
        return 'status-en-attente';
      case CandidateStatus.ACCEPTE:
        return 'status-accepte';
      case CandidateStatus.REFUSE:
        return 'status-refuse';
      default:
        return 'status-default';
    }
  }

  getStepIcon(step: StepDTO): string {
    if (step.icon) return step.icon;
    switch (step.status) {
      case StepStatus.completed:
        return 'check_circle';
      case StepStatus.current:
        return 'radio_button_checked';
      default:
        return 'radio_button_unchecked';
    }
  }

  getStepLabel(step: StepDTO): string {
    switch (step.status) {
      case StepStatus.completed:
        return 'Terminé';
      case StepStatus.current:
        return 'En cours';
      default:
        return 'En attente';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  get totalCandidatures(): number {
    return this.candidaturesWithSteps.length;
  }

  get activeCount(): number {
    return this.candidaturesWithSteps.filter(
      (c) =>
        c.candidature.status !== CandidateStatus.ACCEPTE &&
        c.candidature.status !== CandidateStatus.REFUSE
    ).length;
  }

  get acceptedCount(): number {
    return this.candidaturesWithSteps.filter(
      (c) => c.candidature.status === CandidateStatus.ACCEPTE
    ).length;
  }
}
