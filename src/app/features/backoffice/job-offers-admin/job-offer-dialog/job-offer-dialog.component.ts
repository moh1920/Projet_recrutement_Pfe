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
  selector: 'app-job-offer-dialog',
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
  templateUrl: './job-offer-dialog.component.html',
  styleUrl: './job-offer-dialog.component.scss'
})
export class JobOfferDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<JobOfferDialogComponent>);

  offerForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    department: ['', Validators.required],
    type: ['Full-Time', Validators.required],
    location: ['', Validators.required],
    description: ['', Validators.required],
    requirements: ['', Validators.required],
    status: ['Active', Validators.required]
  });

  onSubmit(): void {
    if (this.offerForm.valid) {
      const formValue = this.offerForm.value;
      // Convert requirements string to array
      const requirements = formValue.requirements.split('\n').filter((r: string) => r.trim());
      this.dialogRef.close({ ...formValue, requirements });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
