import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { CandidateDTO, CandidateService, CandidateStatus } from '../../../core/services/candidate.service';
import { KeycloakService } from 'keycloak-angular';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit, OnDestroy {

  candidatures: CandidateDTO[]         = [];
  filteredCandidatures: CandidateDTO[] = [];
  activeFilter  = 'all';
  isLoading     = false;
  errorMessage  = '';


  // Expose enum to template
  readonly CandidateStatus = CandidateStatus;

  private readonly keycloakService = inject(KeycloakService);
  private readonly profileService  = inject(ProfileService);
  private readonly candidateSvc    = inject(CandidateService);
  private readonly destroy$        = new Subject<void>();

  // ─── Statistiques ──────────────────────────────────────────────────────────

  get totalCandidatures(): number {
    return this.candidatures.length;
  }

  get inProgressCount(): number {
    return this.candidatures.filter(c =>
      c.status === CandidateStatus.NOUVEAU   ||
      c.status === CandidateStatus.EN_COURS  ||
      c.status === CandidateStatus.EN_ATTENTE
    ).length;
  }

  get acceptedCount(): number {
    return this.candidatures.filter(c => c.status === CandidateStatus.ACCEPTE).length;
  }

  get refusedCount(): number {
    return this.candidatures.filter(c => c.status === CandidateStatus.REFUSE).length;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const userId = this.keycloakService.getKeycloakInstance().tokenParsed?.['sub'];

    if (!userId) {
      this.errorMessage = 'Utilisateur non authentifié. Veuillez vous reconnecter.';
      return;
    }

    this.isLoading = true;

    this.profileService.getProfileByUserId(userId)
      .pipe(
        switchMap(profile => {
          if (!profile?.id) throw new Error('Profil introuvable');
          return this.candidateSvc.getAllCandidatureByProfile(profile.id);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: CandidateDTO[]) => {
          this.candidatures = data;
          this.filterCandidatures(this.activeFilter);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur chargement candidatures :', err);
          this.errorMessage = err?.message?.includes('Profil')
            ? 'Profil introuvable. Veuillez vous reconnecter.'
            : 'Impossible de charger vos candidatures. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Filtrage ──────────────────────────────────────────────────────────────

  filterCandidatures(filter: string): void {
    this.activeFilter = filter;

    switch (filter) {
      case 'in-progress':
        this.filteredCandidatures = this.candidatures.filter(c =>
          c.status === CandidateStatus.NOUVEAU   ||
          c.status === CandidateStatus.EN_COURS  ||
          c.status === CandidateStatus.EN_ATTENTE
        );
        break;
      case 'accepted':
        this.filteredCandidatures = this.candidatures.filter(c =>
          c.status === CandidateStatus.ACCEPTE
        );
        break;
      case 'closed':
        this.filteredCandidatures = this.candidatures.filter(c =>
          c.status === CandidateStatus.REFUSE ||
          c.status === CandidateStatus.ACCEPTE
        );
        break;
      default:
        this.filteredCandidatures = [...this.candidatures];
    }
  }

  // ─── Helpers d'affichage ───────────────────────────────────────────────────

  getStatusLabel(status?: CandidateStatus): string {
    switch (status) {
      case CandidateStatus.NOUVEAU:    return 'Nouvelle candidature';
      case CandidateStatus.EN_COURS:   return "En cours d'analyse";
      case CandidateStatus.EN_ATTENTE: return 'En attente';
      case CandidateStatus.ACCEPTE:    return 'Acceptée';
      case CandidateStatus.REFUSE:     return 'Refusée';
      default:                         return 'Inconnu';
    }
  }

  getStatusIcon(status?: CandidateStatus): string {
    switch (status) {
      case CandidateStatus.NOUVEAU:    return 'send';
      case CandidateStatus.EN_COURS:   return 'visibility';
      case CandidateStatus.EN_ATTENTE: return 'hourglass_empty';
      case CandidateStatus.ACCEPTE:    return 'check_circle';
      case CandidateStatus.REFUSE:     return 'cancel';
      default:                         return 'help_outline';
    }
  }

  getStatusBadgeClass(status?: CandidateStatus): string {
    switch (status) {
      case CandidateStatus.NOUVEAU:    return 'badge-nouveau';
      case CandidateStatus.EN_COURS:   return 'badge-en-cours';
      case CandidateStatus.EN_ATTENTE: return 'badge-en-attente';
      case CandidateStatus.ACCEPTE:    return 'badge-accepte';
      case CandidateStatus.REFUSE:     return 'badge-refuse';
      default:                         return 'badge-default';
    }
  }

  isActive(status?: CandidateStatus): boolean {
    return status !== CandidateStatus.REFUSE && status !== CandidateStatus.ACCEPTE;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  viewDetails(candidature: CandidateDTO): void {
    console.log('Voir détails :', candidature);
  }

  deleteCandidature(candidature: CandidateDTO): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) {
      this.candidatures = this.candidatures.filter(c => c.id !== candidature.id);
      this.filterCandidatures(this.activeFilter);
    }
  }

  openChat(candidature: CandidateDTO): void {
    console.log('Ouvrir chat :', candidature);
  }
}
