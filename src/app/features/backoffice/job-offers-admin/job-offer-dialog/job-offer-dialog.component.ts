import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OffreService } from '../../../../core/services/offre.service';
import { Offre } from '../../../../core/models/offre.model';

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
    MatCheckboxModule,
    MatProgressSpinnerModule,
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
  private offreService = inject(OffreService);

  offreForm: FormGroup;
  loading = false;

  constructor() {
    this.offreForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      department: ['', Validators.required],
      speciality: ['', Validators.required],
      type: ['Permanent', Validators.required],
      workload: [1, [Validators.required, Validators.min(1), Validators.max(40)]],
      requiredLevel: ['Master', Validators.required],
      minYearsExperience: [0, [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      modules: ['', Validators.required],
      requiredSkills: ['', Validators.required],
      deadline: [null],
      status: ['Ouverte', Validators.required],
      academicExperience: [false]
    });
  }

  create(): void {
    if (this.offreForm.invalid) {
      this.offreForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.offreForm.value;

    const offre: Offre = {
      title: formValue.title,
      description: formValue.description,
      department: formValue.department,
      speciality: formValue.speciality,
      type: formValue.type,
      workload: formValue.workload,
      requiredLevel: formValue.requiredLevel,
      modules: this.parseCommaSeparated(formValue.modules),
      minYearsExperience: formValue.minYearsExperience,
      academicExperience: formValue.academicExperience,
      requiredSkills: this.parseCommaSeparated(formValue.requiredSkills),
      status: formValue.status,
      postedDate: new Date().toISOString().split('T')[0],
      deadline: formValue.deadline ? formValue.deadline.toISOString().split('T')[0] : undefined,
      createdAt: new Date().toISOString()
    };

    this.offreService.createOffre(offre).subscribe({
      next: (created) => {
        this.loading = false;
        this.dialogRef.close(created);
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur création offre:', err);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private parseCommaSeparated(value: string): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
}
