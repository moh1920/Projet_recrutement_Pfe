
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // KPI Data
  stats = [
    { title: 'Candidatures', value: '142', icon: 'description', color: 'primary', trend: '+12%' },
    { title: 'CV Analysés', value: '138', icon: 'psychology', color: 'accent', trend: '98%' },
    { title: 'Score Moyen', value: '76/100', icon: 'analytics', color: 'warn', trend: '+2pts' },
    { title: 'Entretiens', value: '24', icon: 'event', color: 'primary', trend: 'Ce jour' }
  ];

  // Candidates Table Data
  displayedColumns: string[] = ['name', 'specialty', 'score', 'status'];
  recentCandidates = [
    { name: 'Sarra Ben Ali', specialty: 'Data Science', score: 88, status: 'Admis' },
    { name: 'Ahmed Khelif', specialty: 'Cloud Computing', score: 92, status: 'Entretien' },
    { name: 'Mariem Jaziri', specialty: 'Cyber Security', score: 65, status: 'Rejeté' },
    { name: 'Karim Ouerghi', specialty: 'DevOps', score: 78, status: 'En cours' },
  ];

  getStatusColor(status: string): string {
    switch (status) {
      case 'Admis': return 'green'; // Class or style
      case 'Rejeté': return 'red';
      case 'Entretien': return 'orange';
      default: return 'grey';
    }
  }
}
