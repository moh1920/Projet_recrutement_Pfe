// lobby-dialog.component.ts
import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MeetingApiService } from '../../../core/services/meeting-api.service';

@Component({
  selector: 'app-lobby-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent {
  @Output() closed = new EventEmitter<void>();

  isOpen = false; // ← contrôle l'affichage
  meetingTitle = '';
  roomCode = '';
  loading = false;
  error = '';

  private router = inject(Router);
  private meetingApi = inject(MeetingApiService);

  /** Appeler depuis le parent pour ouvrir */
  open(): void {
    this.meetingTitle = '';
    this.roomCode = '';
    this.error = '';
    this.loading = false;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.close();
    }
  }

  createMeeting(): void {
    this.loading = true;
    this.error = '';
    this.meetingApi.createMeeting(this.meetingTitle || 'Réunion Esprit').subscribe({
      next: (meeting) => {
        this.close();
        this.router.navigate(['/admin/meeting', meeting.roomCode]);
      },
      error: () => {
        this.error = 'Impossible de créer le salon. Veuillez réessayer.';
        this.loading = false;
      },
    });
  }

  joinMeeting(): void {
    if (!this.roomCode.trim()) return;
    this.loading = true;
    this.error = '';
    this.meetingApi.checkRoom(this.roomCode.toUpperCase()).subscribe({
      next: () => {
        this.close();
        this.router.navigate(['/admin/meeting', this.roomCode.toUpperCase()]);
      },
      error: () => {
        this.error = 'Salon introuvable. Vérifiez le code et réessayez.';
        this.loading = false;
      },
    });
  }
}
