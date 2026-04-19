import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SlicePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProfileResponseDTO, ProfileService } from '../../../core/services/profile.service';
import { EmailDialogComponent } from './email-dialog/email-dialog.component';
@Component({
  selector: 'app-profile-candidats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile-candidats.component.html',
  styleUrl: './profile-candidats.component.scss',
})
export class ProfileCandidatsComponent implements OnInit {
  private profileService = inject(ProfileService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // ── Data ─────────────────────────────────────────────────────────────────
  prfileCandiadatsList: ProfileResponseDTO[] = [];
  filteredList: ProfileResponseDTO[] = [];

  // ── UI State ──────────────────────────────────────────────────────────────
  loading = true;
  viewMode: 'grid' | 'list' = 'list';
  selectedProfile: ProfileResponseDTO | null = null;

  // ── Filters ───────────────────────────────────────────────────────────────
  searchQuery = '';
  filterVille = '';
  filterDiplome = '';

  // ── Table Columns ─────────────────────────────────────────────────────────
  displayedColumns = [
    'candidat',
    'specialite',
    'diplome',
    'experience',
    'ville',
    'langages',
    'cv',
    'actions',
  ];

  // ── Avatar Gradients ──────────────────────────────────────────────────────
  private readonly gradients = [
    'linear-gradient(135deg, #8B0000 0%, #a50000 100%)',
    'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
    'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #0f4c8a 0%, #0ea5e9 100%)',
    'linear-gradient(135deg, #9f1239 0%, #f43f5e 100%)',
  ];

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.profileService.getAllProfiles().subscribe({
      next: (data) => {
        this.prfileCandiadatsList = data;
        this.filteredList = data;
        this.loading = false;
        console.log(this.prfileCandiadatsList);
      },
      error: (err) => {
        console.error('Erreur chargement profils :', err);
        this.loading = false;
      },
    });
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.filteredList = this.prfileCandiadatsList.filter((p) => {
      const matchSearch =
        !q ||
        p.nom?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.specialite?.toLowerCase().includes(q) ||
        p.universite?.toLowerCase().includes(q) ||
        p.langages?.some((l) => l.toLowerCase().includes(q));

      const matchVille = !this.filterVille || p.ville === this.filterVille;
      const matchDiplome = !this.filterDiplome || p.niveauDiplome === this.filterDiplome;

      return matchSearch && matchVille && matchDiplome;
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterVille = '';
    this.filterDiplome = '';
    this.filteredList = [...this.prfileCandiadatsList];
  }

  // ── Unique values for filter dropdowns ───────────────────────────────────

  getUniqueVilles(): string[] {
    return [...new Set(this.prfileCandiadatsList.map((p) => p.ville).filter(Boolean))].sort();
  }

  getUniqueDiplomes(): string[] {
    return [
      ...new Set(this.prfileCandiadatsList.map((p) => p.niveauDiplome).filter(Boolean)),
    ].sort();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getWithCV(): number {
    return this.prfileCandiadatsList.filter((p) => p.cvPath).length;
  }

  getAvgExp(): string {
    if (!this.prfileCandiadatsList.length) return '0';
    const avg =
      this.prfileCandiadatsList.reduce((sum, p) => sum + (p.nbAnneesExperience || 0), 0) /
      this.prfileCandiadatsList.length;
    return avg.toFixed(1);
  }

  // ── UI Helpers ────────────────────────────────────────────────────────────

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getAvatarGradient(name: string): string {
    const idx = name ? name.charCodeAt(0) % this.gradients.length : 0;
    return this.gradients[idx];
  }

  // ── Detail Drawer ─────────────────────────────────────────────────────────

  openDetail(profile: ProfileResponseDTO): void {
    this.selectedProfile = profile;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.selectedProfile = null;
    document.body.style.overflow = '';
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  contact(profile: ProfileResponseDTO): void {
    const dialogRef = this.dialog.open(EmailDialogComponent, {
      width: '600px',
      data: { email: profile.email, nom: profile.nom },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Mock email sending
        console.log('Sending email:', result);
        this.snackBar.open(`Email envoyé à ${result.to}`, 'Fermer', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
      }
    });
  }
}
