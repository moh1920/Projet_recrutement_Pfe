import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OffreService } from '../../../core/services/offre.service';
import { Offre } from '../../../core/models/offre.model';
import { N8nScoringResponse, ProfilScore } from '../../../core/models/n8n-scoring.model';

@Component({
  selector: 'app-linkedin-scoring',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    MatBadgeModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './linkedin-scoring.component.html',
  styleUrl: './linkedin-scoring.component.scss',
})
export class LinkedinScoringComponent implements OnInit {
  private offreService = inject(OffreService);
  private snackBar = inject(MatSnackBar);

  offres: Offre[] = [];
  selectedOffre: Offre | null = null;
  isLoadingOffres = true;
  isScoring = false;

  scoringResult: N8nScoringResponse | null = null;
  expandedProfiles = new Set<number>();

  ngOnInit(): void {
    this.loadOffres();
  }

  loadOffres(): void {
    this.isLoadingOffres = true;
    this.offreService.getAllOffres(0, 100).subscribe({
      next: (data) => {

        this.offres = data.content;
        console.log('Offres chargées :', this.offres);
        this.isLoadingOffres = false;
      },
      error: () => {
        this.isLoadingOffres = false;
        this.snackBar.open('Erreur lors du chargement des offres', 'Fermer', { duration: 3000 });
      },
    });
  }

  lancerScoring(): void {
    if (!this.selectedOffre) return;
    this.isScoring = true;
    this.scoringResult = null;

    this.offreService.scorerOffre(this.selectedOffre).subscribe({
      next: (results) => {
        this.scoringResult = results[0] ?? null;
        this.isScoring = false;
        if (this.scoringResult) {
          this.snackBar.open(
            `✅ Scoring terminé — ${this.scoringResult.total_profils} profil(s) analysé(s)`,
            'Fermer',
            { duration: 4000 }
          );
        }
      },
      error: (err) => {
        this.isScoring = false;
        this.snackBar.open('Erreur lors du scoring n8n : ' + (err?.message ?? 'Erreur inconnue'), 'Fermer', {
          duration: 5000,
        });
      },
    });
  }

  toggleProfile(rang: number): void {
    if (this.expandedProfiles.has(rang)) {
      this.expandedProfiles.delete(rang);
    } else {
      this.expandedProfiles.add(rang);
    }
  }

  isExpanded(rang: number): boolean {
    return this.expandedProfiles.has(rang);
  }

  getNiveauMatchClass(niveau: string): string {
    switch (niveau?.toLowerCase()) {
      case 'excellent': return 'match-excellent';
      case 'bon':       return 'match-bon';
      case 'moyen':     return 'match-moyen';
      case 'faible':    return 'match-faible';
      default:          return 'match-moyen';
    }
  }

  getNiveauMatchIcon(niveau: string): string {
    switch (niveau?.toLowerCase()) {
      case 'excellent': return 'star';
      case 'bon':       return 'thumb_up';
      case 'moyen':     return 'thumbs_up_down';
      case 'faible':    return 'thumb_down';
      default:          return 'help';
    }
  }

  getRecommandationClass(rec: string): string {
    const r = rec?.toLowerCase();
    if (r?.includes('contacter'))    return 'rec-contacter';
    if (r?.includes('considerer') || r?.includes('considérer')) return 'rec-considerer';
    if (r?.includes('rejeter'))      return 'rec-rejeter';
    return 'rec-default';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  getScoreGradient(score: number): string {
    const color = this.getScoreColor(score);
    return `conic-gradient(${color} ${score * 3.6}deg, #e2e8f0 0deg)`;
  }

  getBarWidth(value: number, max = 30): string {
    return `${Math.round((value / max) * 100)}%`;
  }

  getScoreDetailMax(key: string): number {
    const maxMap: Record<string, number> = {
      modules: 30,
      niveau: 20,
      experience: 25,
      enseignement: 15,
      autres: 10,
    };
    return maxMap[key] ?? 30;
  }

  getScoreDetailEntries(detail: ProfilScore['scores_detail']): { key: string; label: string; value: number; max: number }[] {
    return [
      { key: 'modules',      label: 'Modules',       value: detail.modules,      max: 30 },
      { key: 'niveau',       label: 'Niveau acad.',  value: detail.niveau,       max: 20 },
      { key: 'experience',   label: 'Expérience',    value: detail.experience,   max: 25 },
      { key: 'enseignement', label: 'Enseignement',  value: detail.enseignement, max: 15 },
      { key: 'autres',       label: 'Autres',        value: detail.autres,       max: 10 },
    ];
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  openLinkedIn(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
