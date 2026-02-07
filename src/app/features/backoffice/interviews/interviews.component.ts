
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { InterviewService, Interview } from '../../../core/services/interview.service';
import { InterviewDialogComponent } from './interview-dialog/interview-dialog.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-interviews',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './interviews.component.html',
  styleUrl: './interviews.component.scss'
})
export class InterviewsComponent {
  interviewService = inject(InterviewService);
  dialog = inject(MatDialog);
  interviews$: Observable<Interview[]> = this.interviewService.getInterviews();
  selectedDate: Date = new Date();

  days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  hours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  openAddDialog(): void {
    const dialogRef = this.dialog.open(InterviewDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Nouvel entretien:', result);
        // Ici vous pouvez appeler interviewService.addInterview(result) quand le backend sera prêt
      }
    });
  }

  // Mock for Calendar Grid logic (simplified)
  getEventFor(day: string, hour: string): Interview | undefined {
    // In a real app, this would check actual dates. 
    // Here we just simulate random distribution for demo UI
    if (day === 'Mardi' && hour === '10:00') return { id: '1', candidateName: 'Rania Mezhoud', time: '10:00', position: 'Enseignant Web' } as any;
    if (day === 'Jeudi' && hour === '14:00') return { id: '2', candidateName: 'Ahmed Khelif', time: '14:00', position: 'Vacataire AI' } as any;
    return undefined;
  }
}
