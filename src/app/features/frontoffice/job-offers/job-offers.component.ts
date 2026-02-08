import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { JobOfferService, JobOffer } from '../../../core/services/job-offer.service';

@Component({
  selector: 'app-job-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule
  ],
  templateUrl: './job-offers.component.html',
  styleUrl: './job-offers.component.scss'
})
export class JobOffersComponent implements OnInit {
  jobOfferService = inject(JobOfferService);

  searchTerm = '';
  selectedType = 'all';
  selectedDepartment = 'all';

  allOffers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];

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

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.jobOfferService.getOffers().subscribe(offers => {
      this.allOffers = offers;
      this.filteredOffers = offers;
    });
  }

  applyFilters(): void {
    this.filteredOffers = this.allOffers.filter(offer => {
      const matchesSearch = !this.searchTerm ||
        offer.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        offer.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesType = this.selectedType === 'all' || offer.type === this.selectedType;
      const matchesDept = this.selectedDepartment === 'all' || offer.department === this.selectedDepartment;

      return matchesSearch && matchesType && matchesDept;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = 'all';
    this.selectedDepartment = 'all';
    this.applyFilters();
  }

  getDepartmentColor(department: string): string {
    return this.departmentColors[department] || 'linear-gradient(135deg, #8B0000 0%, #d32f2f 100%)';
  }

  getDepartmentIcon(department: string): string {
    return this.departmentIcons[department] || 'work';
  }

  isNewOffer(date: Date): boolean {
    const daysDiff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 3;
  }
}
