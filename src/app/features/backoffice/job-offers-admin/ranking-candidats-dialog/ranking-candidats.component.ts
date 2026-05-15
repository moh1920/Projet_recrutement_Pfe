// ranking-candidats.component.ts
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
import { MatchResult } from '../../../../core/models/matching.model';
import { MatchingService } from '../../../../core/services/matching.service';
import { CandidateService } from '../../../../core/services/candidate.service';

@Component({
  selector: 'app-ranking-candidats',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './ranking-candidats-dialog.component.html',
  styleUrl: './ranking-candidats-dialog.component.scss',
})
export class RankingCandidatsComponent implements OnInit, OnDestroy {
  offerId = '';
  offerTitle = '';
  results: MatchResult[] = [];
  loading = false;
  error: string | null = null;
  candidateNames: Map<string, string> = new Map();

  private readonly AVATAR_COLORS = [
    '#8B0000',
    '#1a3a5c',
    '#0f6e56',
    '#7c3aed',
    '#b45309',
    '#1e40af',
    '#065f46',
    '#9f1239',
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private matchingService: MatchingService,
    private candidateService: CandidateService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.offerId = params['offerId'] ?? '';
    });

    this.route.queryParams.subscribe((qp) => {
      this.offerTitle = qp['offerTitle'] ?? '';
    });

    if (this.offerId) {
      this.loadRanking();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data ───────────────────────────────────────────────────────────────────

  loadRanking(): void {
    this.loading = true;
    this.error = null;

    this.candidateService
      .getAllCandidatureByOffre(this.offerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (candidatures) => {
          candidatures.forEach((c) => {
            if (c.id) {
              const name =
                c.fullName || (c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.id);
              this.candidateNames.set(c.id, name);
            }
          });
        },
        error: (err) => console.error('Failed to load candidatures', err),
      });

    this.matchingService
      .getBestCandidatesForOffer(this.offerId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (results) => {
          this.results = results.sort((a, b) => b.globalScore - a.globalScore);
        },
        error: (err) => {
          this.error = 'Erreur lors du chargement du classement.';
          console.error(err);
        },
      });
  }

  // ── Score helpers ──────────────────────────────────────────────────────────

  /** Retourne la classe CSS de couleur selon le score. */
  getScoreColor(score: number): string {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  /** Retourne l'icône Material selon le score. */
  getScoreIcon(score: number): string {
    if (score >= 75) return 'emoji_events';
    if (score >= 50) return 'thumb_up';
    return 'thumb_down';
  }

  // ── Avatar helpers ─────────────────────────────────────────────────────────

  /** Retourne la couleur de fond de l'avatar selon la position. */
  getAvatarColor(index: number): string {
    return this.AVATAR_COLORS[index % this.AVATAR_COLORS.length];
  }

  /**
   * Retourne un label court pour l'avatar à partir de l'ID candidat.
   * Ex. : "C-2041" → "041"  |  "John Doe" → "JD"
   */
  getAvatarLabel(candidateId: string): string {
    if (!candidateId) return '?';

    const name = this.getCandidateName(candidateId);

    // S'il s'agit encore de l'ID
    if (name === candidateId) {
      const numeric = candidateId.match(/\d+$/);
      if (numeric) return numeric[0].slice(-3);
      return candidateId.slice(0, 2).toUpperCase();
    }

    // Nom complet → initiales (max 2)
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => (w[0] ? w[0].toUpperCase() : ''))
      .join('');
  }

  getCandidateName(candidateId: string): string {
    return this.candidateNames.get(candidateId) || candidateId;
  }

  // ── Details helper ─────────────────────────────────────────────────────────

  /** Retourne les clés d'un objet de détails. */
  getDetailKeys(details: Record<string, unknown>): string[] {
    return details ? Object.keys(details) : [];
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['admin/offres']);
  }

  goToEvaluation(candidateId: string): void {
    this.router.navigate(['admin/manual-evaluation', this.offerId, candidateId]);
  }
}
