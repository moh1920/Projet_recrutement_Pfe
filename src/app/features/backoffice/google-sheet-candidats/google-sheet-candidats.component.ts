import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';

import { GoogleSheetsService, GoogleSheetCandidat } from '../../../core/services/google-sheets.service';

@Component({
  selector: 'app-google-sheet-candidats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatBadgeModule,
  ],
  templateUrl: './google-sheet-candidats.component.html',
  styleUrl: './google-sheet-candidats.component.scss',
})
export class GoogleSheetCandidatsComponent implements OnInit {
  private sheetsService = inject(GoogleSheetsService);
  private snackBar = inject(MatSnackBar);

  isLoading = true;
  allCandidats: GoogleSheetCandidat[] = [];

  // Filter state
  searchQuery = '';
  selectedNiveauMatch = '';
  selectedRecommandation = '';
  selectedOffre = '';

  niveauMatchOptions: string[] = [];
  recommandationOptions: string[] = [];
  offreOptions: string[] = [];

  expandedIndex: number | null = null;

  ngOnInit(): void {
    this.loadCandidats();
  }

  loadCandidats(): void {
    this.isLoading = true;
    this.sheetsService.getCandidats().subscribe({
      next: (data) => {
        // Only include rows that have a candidate name (exclude summary rows)
        this.allCandidats = data.filter(c => !!c.nom?.trim());
        this.buildFilterOptions();
        this.isLoading = false;
        this.snackBar.open(
          `✅ ${this.allCandidats.length} candidat(s) chargé(s) depuis Google Sheets`,
          'Fermer',
          { duration: 3000 }
        );
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          'Erreur lors du chargement depuis Google Sheets : ' + (err?.message ?? 'Erreur inconnue'),
          'Fermer',
          { duration: 5000 }
        );
      },
    });
  }

  private buildFilterOptions(): void {
    this.niveauMatchOptions = [...new Set(this.allCandidats.map(c => c.niveau_match).filter(Boolean))];
    this.recommandationOptions = [...new Set(this.allCandidats.map(c => c.recommandation).filter(Boolean))];
    this.offreOptions = [...new Set(this.allCandidats.map(c => c.offre_titre).filter(Boolean))];
  }

  get filteredCandidats(): GoogleSheetCandidat[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.allCandidats.filter(c => {
      const matchSearch = !q ||
        c.nom?.toLowerCase().includes(q) ||
        c.titre?.toLowerCase().includes(q) ||
        c.offre_titre?.toLowerCase().includes(q) ||
        c.offre_specialite?.toLowerCase().includes(q);
      const matchNiveau = !this.selectedNiveauMatch || c.niveau_match === this.selectedNiveauMatch;
      const matchRec = !this.selectedRecommandation || c.recommandation === this.selectedRecommandation;
      const matchOffre = !this.selectedOffre || c.offre_titre === this.selectedOffre;
      return matchSearch && matchNiveau && matchRec && matchOffre;
    });
  }

  get totalContacter(): number {
    return this.allCandidats.filter(c => c.recommandation?.toLowerCase().includes('contacter')).length;
  }

  get totalConsiderer(): number {
    return this.allCandidats.filter(c =>
      c.recommandation?.toLowerCase().includes('considerer') ||
      c.recommandation?.toLowerCase().includes('considérer')
    ).length;
  }

  get bestScore(): number {
    const scores = this.allCandidats.map(c => Number(c.score)).filter(s => !isNaN(s) && s > 0);
    return scores.length ? Math.max(...scores) : 0;
  }

  get uniqueOffresCount(): number {
    return new Set(this.allCandidats.map(c => c.offre_titre).filter(Boolean)).size;
  }

  toggleExpand(idx: number): void {
    this.expandedIndex = this.expandedIndex === idx ? null : idx;
  }

  isExpanded(idx: number): boolean {
    return this.expandedIndex === idx;
  }

  getNiveauMatchClass(niveau: string): string {
    switch (niveau?.toLowerCase()) {
      case 'excellent': return 'match-excellent';
      case 'bon':       return 'match-bon';
      case 'moyen':     return 'match-moyen';
      case 'faible':    return 'match-faible';
      default:          return 'match-default';
    }
  }

  getNiveauMatchIcon(niveau: string): string {
    switch (niveau?.toLowerCase()) {
      case 'excellent': return 'star';
      case 'bon':       return 'thumb_up';
      case 'moyen':     return 'thumbs_up_down';
      case 'faible':    return 'thumb_down';
      default:          return 'help_outline';
    }
  }

  getRecommandationClass(rec: string): string {
    const r = rec?.toLowerCase();
    if (r?.includes('contacter'))                              return 'rec-contacter';
    if (r?.includes('considerer') || r?.includes('considérer')) return 'rec-considerer';
    if (r?.includes('rejeter'))                                return 'rec-rejeter';
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

  getBarWidth(value: number, max: number): string {
    if (!max || isNaN(value)) return '0%';
    return `${Math.min(100, Math.round((value / max) * 100))}%`;
  }

  getScoreBreakdown(c: GoogleSheetCandidat): { label: string; value: number; max: number }[] {
    return [
      { label: 'Modules',      value: Number(c.score_modules)      || 0, max: 30 },
      { label: 'Niveau acad.', value: Number(c.score_niveau)       || 0, max: 20 },
      { label: 'Expérience',   value: Number(c.score_experience)   || 0, max: 25 },
      { label: 'Enseignement', value: Number(c.score_enseignement) || 0, max: 15 },
      { label: 'Autres',       value: Number(c.score_autres)       || 0, max: 10 },
    ];
  }

  formatDate(raw: string): string {
    if (!raw) return '';
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    }
    return raw;
  }

  getInitials(nom: string): string {
    if (!nom) return '?';
    return nom.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  openLinkedIn(url: string): void {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedNiveauMatch = '';
    this.selectedRecommandation = '';
    this.selectedOffre = '';
  }
}
