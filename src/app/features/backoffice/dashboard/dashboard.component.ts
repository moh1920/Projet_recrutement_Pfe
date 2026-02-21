import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // KPI Data
  stats = [
    {
      title: 'Candidatures',
      value: '142',
      icon: 'description',
      color: 'primary',
      trend: '+12%',
      trendType: 'up',
      trendIcon: 'trending_up',
      progress: 75
    },
    {
      title: 'CV Analysés',
      value: '138',
      icon: 'psychology',
      color: 'accent',
      trend: '98%',
      trendType: 'neutral',
      trendIcon: 'check_circle',
      progress: 98
    },
    {
      title: 'Score Moyen',
      value: '76/100',
      icon: 'analytics',
      color: 'warn',
      trend: '+2pts',
      trendType: 'up',
      trendIcon: 'trending_up',
      progress: 76
    },
    {
      title: 'Entretiens',
      value: '24',
      icon: 'event',
      color: 'success',
      trend: 'Ce jour',
      trendType: 'neutral',
      trendIcon: 'schedule',
      progress: 60
    }
  ];

  // Timeline Data
  timelineSteps = [
    {
      step: '1',
      icon: 'upload_file',
      label: 'Dépôt CV',
      description: 'Réception des candidatures',
      date: '01 Jan - Terminé',
      status: 'completed'
    },
    {
      step: '2',
      icon: 'psychology',
      label: 'Analyse IA',
      description: 'Analyse automatique des profils',
      date: 'Auto - Terminé',
      status: 'completed'
    },
    {
      step: '3',
      icon: 'analytics',
      label: 'Scoring',
      description: 'Évaluation des compétences',
      date: 'En cours',
      status: 'active'
    },
    {
      step: '4',
      icon: 'video_call',
      label: 'Entretiens',
      description: 'Entretiens avec le jury',
      date: '15 Février',
      status: 'pending'
    },
    {
      step: '5',
      icon: 'gavel',
      label: 'Décision',
      description: 'Décision finale',
      date: '01 Mars',
      status: 'pending'
    }
  ];

  // Bar Chart Data
  barData = [
    { label: '<50', value: 15, type: 'low' },
    { label: '50-70', value: 35, type: 'medium' },
    { label: '70-90', value: 40, type: 'high' },
    { label: '>90', value: 10, type: 'excellent' }
  ];

  // Pie Chart Data
  pieData = [
    { label: 'Admis', value: 25, color: '#22c55e', path: 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831' },
    { label: 'Rejeté', value: 15, color: '#ef4444', path: '' },
    { label: 'En cours', value: 60, color: '#8B0000', path: '' }
  ];

  // Candidates Data
  recentCandidates = [
    { name: 'Sarra Ben Ali', specialty: 'Data Science', score: 88, status: 'Admis' },
    { name: 'Ahmed Khelif', specialty: 'Cloud Computing', score: 92, status: 'Entretien' },
    { name: 'Mariem Jaziri', specialty: 'Cyber Security', score: 65, status: 'Rejeté' },
    { name: 'Karim Ouerghi', specialty: 'DevOps', score: 78, status: 'En cours' },
    { name: 'Nadia Bouzid', specialty: 'IA', score: 95, status: 'Admis' }
  ];

  getScoreClass(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Admis': return 'admitted';
      case 'Entretien': return 'interview';
      case 'Rejeté': return 'rejected';
      default: return 'pending';
    }
  }
}
