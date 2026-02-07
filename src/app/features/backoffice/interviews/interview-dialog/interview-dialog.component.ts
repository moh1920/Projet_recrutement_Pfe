import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-interview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  templateUrl: './interview-dialog.component.html',
  styleUrl: './interview-dialog.component.scss'
})
export class InterviewDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InterviewDialogComponent>);

  interviewForm: FormGroup = this.fb.group({
    candidateName: ['', Validators.required],
    position: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    interviewers: ['', Validators.required],
    type: ['Technique', Validators.required],
    location: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.interviewForm.valid) {
      this.dialogRef.close(this.interviewForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
