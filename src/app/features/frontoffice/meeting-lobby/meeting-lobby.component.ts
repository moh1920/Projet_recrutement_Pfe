import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MeetingApiService } from '../../../core/services/meeting-api.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-meeting-lobby',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIcon,
  ],
  templateUrl: './meeting-lobby.component.html',
  styleUrls: ['./meeting-lobby.component.scss'],
})
export class MeetingLobbyComponent {
  roomCode = '';
  loading = false;
  error = '';

  private router = inject(Router);
  private meetingApi = inject(MeetingApiService);

  joinMeeting(): void {
    if (!this.roomCode.trim()) return;
    this.loading = true;
    this.error = '';
    this.meetingApi.checkRoom(this.roomCode.toUpperCase()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/meeting', this.roomCode.toUpperCase()]);
      },
      error: () => {
        this.error = 'Salon introuvable. Vérifiez le code et réessayez.';
        this.loading = false;
      },
    });
  }

  openHelp() {}

  testAudio() {}
}
