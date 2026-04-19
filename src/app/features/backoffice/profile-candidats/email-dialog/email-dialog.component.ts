import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
  EmailSendRequest,
  MeetingEmailService,
} from '../../../../core/services/meeting-email.service';

export interface EmailDialogData {
  email: string;
  nom: string;
}

@Component({
  selector: 'app-email-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './email-dialog.component.html',
  styleUrl: './email-dialog.component.scss',
})
export class EmailDialogComponent {
  toEmail: string;
  subject = '';
  message = '';
  serviceSendEmail = inject(MeetingEmailService);

  constructor(
    public dialogRef: MatDialogRef<EmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmailDialogData
  ) {
    this.toEmail = data.email;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSend(): void {
    if (this.subject && this.message) {
      const emailRequest: EmailSendRequest = {
        recipientEmail: this.toEmail,
        recipientName: this.data.nom,
        confirmedSubject: this.subject,
        confirmedBody: this.message,
      };
      this.serviceSendEmail.sendEmailContact(emailRequest).subscribe(() => {
        console.log('message envoi');
      });
      this.dialogRef.close({
        to: this.toEmail,
        subject: this.subject,
        message: this.message,
      });
    }
  }
}
