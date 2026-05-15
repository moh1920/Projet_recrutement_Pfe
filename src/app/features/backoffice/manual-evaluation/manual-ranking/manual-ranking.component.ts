import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ManualEvaluation, ManualEvaluationService, CritereDeSelection } from '../../../../core/services/manual-evaluation.service';
import { CandidateService } from '../../../../core/services/candidate.service';
import { LucideAngularModule, ChevronLeft, Award, FileText } from 'lucide-angular';

@Component({
  selector: 'app-manual-ranking',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    LucideAngularModule
  ],
  templateUrl: './manual-ranking.component.html',
  styleUrl: './manual-ranking.component.scss',
})
export class ManualRankingComponent implements OnInit, OnDestroy {
  offerId = '';
  evaluations: ManualEvaluation[] = [];
  criteres: CritereDeSelection[] = [];
  candidateNames: Map<string, string> = new Map();
  
  loading = false;
  error: string | null = null;
  
  // Icons
  ChevronLeft = ChevronLeft;
  Award = Award;
  FileText = FileText;

  private readonly AVATAR_COLORS = [
    '#8B0000', '#1a3a5c', '#0f6e56', '#7c3aed', 
    '#b45309', '#1e40af', '#065f46', '#9f1239'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private evaluationService: ManualEvaluationService,
    private candidateService: CandidateService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.offerId = this.route.snapshot.paramMap.get('offerId') || '';

    if (this.offerId) {
      this.loadData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Load candidate names
    this.candidateService.getAllCandidatureByOffre(this.offerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (candidatures) => {
          candidatures.forEach((c) => {
            if (c.id) {
              const name = c.fullName || (c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.id);
              this.candidateNames.set(c.id, name);
            }
          });
        },
        error: (err) => console.error('Failed to load candidatures', err),
      });

    // Load criteres for columns
    this.evaluationService.getCriteres(this.offerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (criteres) => {
          this.criteres = criteres;
        }
      });

    // Load evaluations
    this.evaluationService.getClassement(this.offerId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (evaluations) => {
          this.evaluations = evaluations.sort((a, b) => b.scoreFinal - a.scoreFinal);
        },
        error: (err) => {
          this.error = 'Erreur lors du chargement des évaluations manuelles.';
          console.error(err);
        },
      });
  }

  // Helpers
  getCandidateName(candidateId: string): string {
    return this.candidateNames.get(candidateId) || candidateId;
  }

  getAvatarColor(index: number): string {
    return this.AVATAR_COLORS[index % this.AVATAR_COLORS.length];
  }

  getAvatarLabel(candidateId: string): string {
    if (!candidateId) return '?';
    const name = this.getCandidateName(candidateId);
    if (name === candidateId) {
      const numeric = candidateId.match(/\d+$/);
      if (numeric) return numeric[0].slice(-3);
      return candidateId.slice(0, 2).toUpperCase();
    }
    return name.split(' ').slice(0, 2).map((w) => (w[0] ? w[0].toUpperCase() : '')).join('');
  }

  getAppreciationClass(app: string): string {
    if (!app) return 'app-moyen';
    const lower = app.toLowerCase();
    if (lower.includes('excellent')) return 'app-excellent';
    if (lower.includes('bon')) return 'app-bon';
    if (lower.includes('insuffisant')) return 'app-insuffisant';
    return 'app-moyen';
  }

  goBack(): void {
    this.router.navigate(['admin/candidates']);
  }
}
