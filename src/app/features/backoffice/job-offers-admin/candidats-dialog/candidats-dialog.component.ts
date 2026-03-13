import {Component, inject, Inject} from '@angular/core';
import {CandidateDTO, CandidateStatus} from '../../../../core/services/candidate.service';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef} from "@angular/material/dialog";
import {Offre} from "../../../../core/models/offre.model";
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatIconButton} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import {MatTooltip} from "@angular/material/tooltip";
import {Router} from "@angular/router";


export interface CandidatsDialogData {
  offer: Offre;
  candidats: CandidateDTO[];
}
@Component({
  selector: 'app-candidats-dialog',
  standalone: true,
  imports: [
    MatIcon,
    MatIconButton,
    FormsModule,
    NgIf,
    DatePipe,
    MatDialogActions,
    MatButton,
    MatDialogContent,
    NgForOf,
    MatTooltip
  ],
  templateUrl: './candidats-dialog.component.html',
  styleUrl: './candidats-dialog.component.scss'
})
export class CandidatsDialogComponent {
  searchTerm = '';
  CandidateStatus = CandidateStatus;
  router = inject(Router);

  statusConfig: Record<CandidateStatus, { label: string; color: string }> = {
    [CandidateStatus.NOUVEAU]:    { label: 'Nouveau',     color: '#3b82f6' },
    [CandidateStatus.EN_COURS]:   { label: 'En cours',    color: '#f59e0b' },
    [CandidateStatus.ACCEPTE]:    { label: 'Accepté',     color: '#10b981' },
    [CandidateStatus.REFUSE]:     { label: 'Refusé',      color: '#ef4444' },
    [CandidateStatus.EN_ATTENTE]: { label: 'En attente',  color: '#8b5cf6' },
  };

  constructor(
    public dialogRef: MatDialogRef<CandidatsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CandidatsDialogData
  ) {}

  get filteredCandidats(): CandidateDTO[] {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.data.candidats;
    return this.data.candidats.filter(c =>
      c.fullName?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.appliedPosition?.toLowerCase().includes(term)
    );
  }

  getInitials(c: CandidateDTO): string {
    return `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase();
  }

  close(): void {
    this.dialogRef.close();
  }

  viewDetails(c: CandidateDTO) {
    this.router.navigate(['/admin/candidatsDetais', c.id]);

  }
}
