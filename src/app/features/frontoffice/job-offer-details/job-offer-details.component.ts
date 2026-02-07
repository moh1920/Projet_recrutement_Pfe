
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { JobOfferService, JobOffer } from '../../../core/services/job-offer.service';
import { Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-job-offer-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './job-offer-details.component.html',
  styleUrl: './job-offer-details.component.scss'
})
export class JobOfferDetailsComponent {
  private route = inject(ActivatedRoute);
  private jobOfferService = inject(JobOfferService);

  offer$: Observable<JobOffer | undefined> = this.route.paramMap.pipe(
    switchMap(params => this.jobOfferService.getOfferById(params.get('id')!))
  );
}
