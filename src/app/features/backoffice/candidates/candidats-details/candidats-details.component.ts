import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe, NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CandidateDTO,
  CandidateService,
  CandidateStatus,
  EducationDTO,
} from '../../../../core/services/candidate.service';

@Component({
  selector: 'app-candidats-details',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './candidats-details.component.html',
  styleUrl: './candidats-details.component.scss',
})
export class CandidatsDetailsComponent implements OnInit {
  candidate: CandidateDTO | null = null;
  loading = true;
  error = false;

  CandidateStatus = CandidateStatus;

  statusConfig: Record<CandidateStatus, { label: string; color: string; icon: string }> = {
    [CandidateStatus.NOUVEAU]: { label: 'Nouveau', color: '#3b82f6', icon: 'fiber_new' },
    [CandidateStatus.EN_COURS]: { label: 'En cours', color: '#f59e0b', icon: 'pending' },
    [CandidateStatus.ACCEPTE]: { label: 'Accepté', color: '#10b981', icon: 'check_circle' },
    [CandidateStatus.REFUSE]: { label: 'Refusé', color: '#ef4444', icon: 'cancel' },
    [CandidateStatus.EN_ATTENTE]: {
      label: 'En attente',
      color: '#8b5cf6',
      icon: 'hourglass_empty',
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = true;
      this.loading = false;
      return;
    }
    this.candidateService.getAllCandidatureById(id).subscribe({
      next: (data) => {
        this.candidate = Array.isArray(data) ? data[0] : data;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  getInitials(c: CandidateDTO): string {
    return `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase();
  }

  goBack(): void {
    this.router.navigate(['/admin/candidates']);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
