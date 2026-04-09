import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import {Subject, forkJoin, of} from 'rxjs';
import {takeUntil, finalize, catchError} from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

import { MatchResult } from '../../../core/models/matching.model';
import { MatchingService } from '../../../core/services/matching.service';
import { OffreService } from '../../../core/services/offre.service';

@Component({
  selector: 'app-candidate-best-offers',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    RouterLink
  ],
  templateUrl: './candidate-best-offers.component.html',
  styleUrls: ['./candidate-best-offers.component.scss']
})
export class CandidateBestOffersComponent implements OnInit, OnDestroy {
  candidateId: string = '';
  results: MatchResult[] = [];
  loading = false;
  error: string | null = null;
  offerNames: Map<string, string> = new Map();

  private keycloakService = inject(KeycloakService);

  private readonly AVATAR_COLORS = [
    '#8B0000', '#1a3a5c', '#0f6e56', '#7c3aed',
    '#b45309', '#1e40af', '#065f46', '#9f1239',
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private matchingService: MatchingService,
    private offreService: OffreService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const userId = this.keycloakService.getKeycloakInstance().tokenParsed?.sub;
    if (userId) {
      this.candidateId = userId;
      this.loadRanking();
    } else {
      this.error = 'Utilisateur non connecté.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRanking(): void {
    this.loading = true;
    this.error = null;
    this.results = [];

    // Étape 1 : charger le matching UNIQUEMENT → affichage immédiat
    this.matchingService.rankOffersForProfile(this.candidateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matches: MatchResult[]) => {
          this.results = matches.sort((a, b) => b.globalScore - a.globalScore);
          this.loading = false; // ← UI visible immédiatement

          // Étape 2 : charger les noms en arrière-plan (sans bloquer l'affichage)
          const ids = this.results.map(r => r.offerId);
          if (ids.length > 0) {
            this.loadOfferNames(ids);
          }
        },
        error: (err: any) => {
          this.error = 'Erreur lors du chargement de vos meilleures offres.';
          this.loading = false;
          console.error(err);
        }
      });
  }

  private loadOfferNames(ids: string[]): void {
    const requests = ids.map(id =>
      this.offreService.getOffreById(id).pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe(offres => {
      offres.forEach((o: any) => {
        if (o?.id) this.offerNames.set(o.id, o.title);
      });
    });
  }


  getScoreColor(score: number): string {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  getScoreIcon(score: number): string {
    if (score >= 75) return 'emoji_events';
    if (score >= 50) return 'thumb_up';
    return 'thumb_down';
  }

  getAvatarColor(index: number): string {
    return this.AVATAR_COLORS[index % this.AVATAR_COLORS.length];
  }

  getAvatarLabel(offerId: string): string {
    const title = this.getOfferName(offerId);
    if (!title || title === offerId) {
       const numeric = offerId.match(/\d+$/);
       if (numeric) return numeric[0].slice(-3);
       return offerId.slice(0, 2).toUpperCase();
    }
    return title.split(' ').slice(0, 2).map(w => w[0] ? w[0].toUpperCase() : '').join('');
  }

  getOfferName(offerId: string): string {
    return this.offerNames.get(offerId) || offerId;
  }

  getDetailKeys(details: Record<string, unknown>): string[] {
    return details ? Object.keys(details) : [];
  }

  goBack(): void {
    this.router.navigate(['/offers']);
  }
}
