import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CandidateService,
  CandidateDTO,
  StepDTO,
  CandidateStatus,
} from '../../../core/services/candidate.service';

@Component({
  selector: 'app-my-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-application-details.component.html',
  styleUrls: ['./my-application-details.component.scss'],
})
export class MyApplicationDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly candidateSvc = inject(CandidateService);

  candidatureId: string | null = null;
  candidature: CandidateDTO | null = null;
  steps: StepDTO[] = [];

  isLoading = true;
  errorMessage = '';

  readonly CandidateStatus = CandidateStatus;

  ngOnInit(): void {
    this.candidatureId = this.route.snapshot.paramMap.get('id');
    if (!this.candidatureId) {
      this.errorMessage = 'ID de candidature introuvable.';
      this.isLoading = false;
      return;
    }

    this.loadDetails();
  }

  loadDetails(): void {
    this.isLoading = true;
    this.candidateSvc.getAllCandidatureById(this.candidatureId!).subscribe({
      next: (candidates) => {
        if (candidates && candidates.length > 0) {
          this.candidature = candidates[0];
          this.loadSteps();
        } else {
          this.errorMessage = 'Candidature introuvable.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Erreur chargement détails candidature:', err);
        this.errorMessage = 'Impossible de charger la candidature.';
        this.isLoading = false;
      },
    });
  }

  loadSteps(): void {
    this.candidateSvc.getSteps(this.candidatureId!).subscribe({
      next: (steps) => {
        this.steps = steps;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement étapes:', err);
        // On continue même si les étapes ne chargent pas
        this.isLoading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
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

  getStatusBadgeClass(status?: CandidateStatus): string {
    switch (status) {
      case CandidateStatus.NOUVEAU:
        return 'badge-nouveau';
      case CandidateStatus.EN_COURS:
        return 'badge-en-cours';
      case CandidateStatus.EN_ATTENTE:
        return 'badge-en-attente';
      case CandidateStatus.ACCEPTE:
        return 'badge-accepte';
      case CandidateStatus.REFUSE:
        return 'badge-refuse';
      default:
        return 'badge-default';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
