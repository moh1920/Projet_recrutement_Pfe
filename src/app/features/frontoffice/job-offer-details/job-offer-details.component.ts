
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { JobOfferService, JobOffer } from '../../../core/services/job-offer.service';
import {Observable, of, switchMap} from 'rxjs';
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatCard} from "@angular/material/card";

@Component({
  selector: 'app-job-offer-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCard
  ],
  templateUrl: './job-offer-details.component.html',
  styleUrl: './job-offer-details.component.scss'
})
export class JobOfferDetailsComponent {
  private route = inject(ActivatedRoute);
  private jobOfferService = inject(JobOfferService);
  private snackBar = inject(MatSnackBar);

  offer$: Observable<JobOffer | undefined> = this.route.params.pipe(
    switchMap(params => {
      const id = params['id'];
      return id ? this.jobOfferService.getOfferById(id) : of(undefined);
    })
  );

  similarOffers: JobOffer[] = [];

  private departmentColors: { [key: string]: string } = {
    'Informatique': 'linear-gradient(135deg, #8B0000 0%, #d32f2f 100%)',
    'Électronique': 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    'Mécanique': 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    'Gestion': 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
  };

  private departmentIcons: { [key: string]: string } = {
    'Informatique': 'computer',
    'Électronique': 'memory',
    'Mécanique': 'precision_manufacturing',
    'Gestion': 'business'
  };

  getDepartmentColor(department: string): string {
    return this.departmentColors[department] || 'linear-gradient(135deg, #8B0000 0%, #d32f2f 100%)';
  }

  getDepartmentIcon(department: string): string {
    return this.departmentIcons[department] || 'work';
  }

  copyLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Lien copié !', 'Fermer', { duration: 3000 });
    });
  }
}
