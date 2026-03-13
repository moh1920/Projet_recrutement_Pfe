import { Component } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  EmailGenerateResponse,
  EmailRequest,
  EmailSendRequest,
  MeetingEmailService
} from "../../../core/services/meeting-email.service";
import {NgIf} from "@angular/common";

type Step = 'form' | 'preview' | 'success';

@Component({
  selector: 'app-send-meeting-email',
  templateUrl: './send-meeting-email.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf
  ],
  styleUrls: ['./send-meeting-email.component.scss']
})
export class SendMeetingEmailComponent {

  step: Step = 'form';
  form: FormGroup;
  preview: EmailGenerateResponse | null = null;

  editableSubject = '';
  editableBody = '';
  interviewType: 'ONLINE' | 'PRESENTIEL' = 'ONLINE';

  isGenerating = false;
  isSending = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private emailService: MeetingEmailService
  ) {
    this.form = this.fb.group({
      recipientName:     ['', Validators.required],
      recipientEmail:    ['', [Validators.required, Validators.email]],
      meetingDate:       ['', Validators.required],
      meetingTime:       ['', Validators.required],
      meetingSubject:    ['', Validators.required],
      interviewType:     ['ONLINE', Validators.required],
      roomCode:          [''],
      location:          [''],
      additionalDetails: ['']
    });

    // Mise à jour dynamique des validateurs
    this.form.get('interviewType')!.valueChanges.subscribe(type => {
      this.interviewType = type;
      this.updateValidators(type);
    });
  }

  updateValidators(type: string): void {
    const roomCodeCtrl = this.form.get('roomCode')!;
    const locationCtrl = this.form.get('location')!;

    if (type === 'ONLINE') {
      roomCodeCtrl.setValidators([Validators.required]);
      locationCtrl.clearValidators();
      locationCtrl.setValue('');
    } else {
      locationCtrl.setValidators([Validators.required]);
      roomCodeCtrl.clearValidators();
      roomCodeCtrl.setValue('');
    }

    roomCodeCtrl.updateValueAndValidity();
    locationCtrl.updateValueAndValidity();
  }

  // ---- Étape 1 : Générer via Gemini ----
  onGenerate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isGenerating = true;
    this.errorMessage = '';

    const request: EmailRequest = this.form.value;

    this.emailService.generateEmail(request).subscribe({
      next: (res: EmailGenerateResponse) => {
        this.preview       = res;
        this.editableSubject = res.subject;
        this.editableBody    = res.body;
        this.step          = 'preview';
        this.isGenerating  = false;
      },
      error: (err) => {
        this.errorMessage = err.error || 'Erreur lors de la génération IA.';
        this.isGenerating = false;
      }
    });
  }

  // ---- Étape 2 : Envoyer l'email confirmé ----
  onSend(): void {
    this.isSending    = true;
    this.errorMessage = '';

    const sendRequest: EmailSendRequest = {
      recipientEmail:   this.preview!.recipientEmail,
      recipientName:    this.preview!.recipientName,
      confirmedSubject: this.editableSubject,
      confirmedBody:    this.editableBody
    };

    this.emailService.sendEmail(sendRequest).subscribe({
      next: () => {
        this.step     = 'success';
        this.isSending = false;
      },
      error: (err) => {
        this.errorMessage = err.error || "Erreur lors de l'envoi.";
        this.isSending    = false;
      }
    });
  }

  onBackToForm(): void {
    this.step = 'form';
  }

  onReset(): void {
    this.step         = 'form';
    this.preview      = null;
    this.errorMessage = '';
    this.form.reset({ interviewType: 'ONLINE' });
    this.interviewType = 'ONLINE';
  }
}
