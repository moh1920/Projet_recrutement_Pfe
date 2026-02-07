import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-candidate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './candidate-dialog.component.html',
  styleUrl: './candidate-dialog.component.scss'
})
export class CandidateDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CandidateDialogComponent>);

  candidateForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    position: ['', Validators.required],
    experience: ['', Validators.required],
    status: ['En Attente', Validators.required]
  });

  onSubmit(): void {
    if (this.candidateForm.valid) {
      this.dialogRef.close(this.candidateForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
