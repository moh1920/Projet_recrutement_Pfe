
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { JobOfferService, JobOffer } from '../../../core/services/job-offer.service';
import { JobOfferDialogComponent } from './job-offer-dialog/job-offer-dialog.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-job-offers-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  templateUrl: './job-offers-admin.component.html',
  styleUrl: './job-offers-admin.component.scss'
})
export class JobOffersAdminComponent {
  jobOfferService = inject(JobOfferService);
  dialog = inject(MatDialog);
  displayedColumns: string[] = ['title', 'department', 'type', 'candidates', 'status', 'actions'];
  offers$: Observable<JobOffer[]> = this.jobOfferService.getOffers();

  openAddDialog(): void {
    const dialogRef = this.dialog.open(JobOfferDialogComponent, {
      width: '700px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Nouvelle offre d\'emploi:', result);
        // Ici vous pouvez appeler jobOfferService.addOffer(result) quand le backend sera prêt
      }
    });
  }
}
