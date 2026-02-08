import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Application {
  id: number;
  offerTitle: string;
  department: string;
  location: string;
  contractType: string;
  status: 'interview' | 'in-progress' | 'rejected' | 'accepted';
  statusLabel: string;
  statusIcon: string;
  currentStep: number;
  totalSteps: number;
  nextStep?: string;
  nextStepDate?: string;
  aiScore: number;
  appliedDate: string;
  updatedDate: string;
  hasMessages?: boolean;
  messageCount?: number;
}

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit {

  applications: Application[] = [
    {
      id: 1,
      offerTitle: 'Enseignant Chercheur - Intelligence Artificielle',
      department: 'Informatique',
      location: 'Ariana',
      contractType: 'CDI',
      status: 'interview',
      statusLabel: 'Entretien programmé',
      statusIcon: 'event',
      currentStep: 3,
      totalSteps: 5,
      nextStep: 'Entretien technique',
      nextStepDate: '20 Fév 2024',
      aiScore: 88,
      appliedDate: '15 Jan 2024',
      updatedDate: '10 Fév 2024',
      hasMessages: true,
      messageCount: 2
    },
    {
      id: 2,
      offerTitle: 'Responsable Pédagogique - Développement Web',
      department: 'Informatique',
      location: 'Ariana',
      contractType: 'CDI',
      status: 'in-progress',
      statusLabel: 'En cours d\'analyse',
      statusIcon: 'visibility',
      currentStep: 2,
      totalSteps: 5,
      aiScore: 76,
      appliedDate: '20 Jan 2024',
      updatedDate: '05 Fév 2024'
    },
    {
      id: 3,
      offerTitle: 'Ingénieur de Recherche - IoT',
      department: 'Électronique',
      location: 'Ariana',
      contractType: 'CDD',
      status: 'rejected',
      statusLabel: 'Refusée',
      statusIcon: 'cancel',
      currentStep: 0,
      totalSteps: 5,
      aiScore: 62,
      appliedDate: '10 Déc 2023',
      updatedDate: '15 Jan 2024'
    }
  ];

  filteredApplications: Application[] = [];
  activeFilter: string = 'all';

  // Statistiques
  get totalApplications(): number {
    return this.applications.length;
  }

  get inProgressCount(): number {
    return this.applications.filter(app =>
      app.status === 'in-progress' || app.status === 'interview'
    ).length;
  }

  get acceptedCount(): number {
    return this.applications.filter(app => app.status === 'accepted').length;
  }

  get interviewCount(): number {
    return this.applications.filter(app => app.status === 'interview').length;
  }

  ngOnInit(): void {
    this.filterApplications('all');
  }

  filterApplications(filter: string): void {
    this.activeFilter = filter;

    switch(filter) {
      case 'in-progress':
        this.filteredApplications = this.applications.filter(app =>
          app.status === 'in-progress' || app.status === 'interview'
        );
        break;
      case 'interview':
        this.filteredApplications = this.applications.filter(app =>
          app.status === 'interview'
        );
        break;
      case 'closed':
        this.filteredApplications = this.applications.filter(app =>
          app.status === 'rejected' || app.status === 'accepted'
        );
        break;
      default:
        this.filteredApplications = this.applications;
    }
  }

  getProgressWidth(currentStep: number, totalSteps: number): string {
    return `${(currentStep / totalSteps) * 100}%`;
  }

  getScoreClass(score: number): string {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    return 'low';
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'interview': return 'primary';
      case 'in-progress': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  }

  viewDetails(application: Application): void {
    console.log('Voir détails:', application);
    // Navigation vers les détails
  }

  deleteApplication(application: Application): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) {
      this.applications = this.applications.filter(app => app.id !== application.id);
      this.filterApplications(this.activeFilter);
    }
  }

  openChat(application: Application): void {
    console.log('Ouvrir chat:', application);
  }
}
