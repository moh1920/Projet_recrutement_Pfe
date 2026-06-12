import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
    ReactiveFormsModule,
  ],
  templateUrl: './job-offer-dialog.component.html',
  styleUrl: './job-offer-dialog.component.scss',
})
export class JobOfferDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<JobOfferDialogComponent>);
  private offreService = inject(OffreService);

  // MAT_DIALOG_DATA will be null for "add" mode, or an Offre object for "edit" mode
  data: { offre?: Offre } | null = inject(MAT_DIALOG_DATA, { optional: true });

  offreForm: FormGroup;
  loading = false;

  // True when opened with an existing offre
  get isEditMode(): boolean {
    return !!this.data?.offre;
  }

  get dialogTitle(): string {
    return this.isEditMode ? "Modifier l'Offre d'Emploi" : "Créer une Offre d'Emploi";
  }

  get submitLabel(): string {
    return this.isEditMode ? 'Modifier' : 'Créer';
  }

  get loadingLabel(): string {
    return this.isEditMode ? 'Modification...' : 'Création...';
  }

  constructor() {
    const existing = this.data?.offre;

    this.offreForm = this.fb.group({
      title: [existing?.title ?? '', [Validators.required, Validators.minLength(5)]],
      department: [existing?.department ?? '', Validators.required],
      speciality: [existing?.speciality ?? '', Validators.required],
      type: [existing?.type ?? 'Permanent', Validators.required],
      workload: [
        existing?.workload ?? 1,
        [Validators.required, Validators.min(1), Validators.max(40)],
      ],
      requiredLevel: [existing?.requiredLevel ?? 'Master', Validators.required],
      minYearsExperience: [
        existing?.minYearsExperience ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      description: [existing?.description ?? '', [Validators.required, Validators.minLength(20)]],
      modules: [existing?.modules?.join(', ') ?? '', Validators.required],
      requiredSkills: [existing?.requiredSkills?.join(', ') ?? '', Validators.required],
      deadline: [existing?.deadline ? new Date(existing.deadline) : null],
      status: [existing?.status ?? 'Ouverte', Validators.required],
      academicExperience: [existing?.academicExperience ?? false],
    });
  }

  submit(): void {
    if (this.offreForm.invalid) {
      this.offreForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.offreForm.value;

    // 🔍 DIAGNOSTIC
    console.log('isEditMode:', this.isEditMode);
    console.log('data:', this.data);
    console.log('offre.id:', this.data?.offre?.id);

    const offre: Offre = {
      ...(this.isEditMode ? this.data!.offre : {}),
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
      postedDate: this.isEditMode
        ? this.data!.offre!.postedDate
        : new Date().toISOString().split('T')[0],
      deadline: formValue.deadline ? formValue.deadline.toISOString().split('T')[0] : undefined,
      createdAt: this.isEditMode ? this.data!.offre!.createdAt : new Date().toISOString(),
    };

    // 🔍 DIAGNOSTIC
    console.log('offre envoyé:', offre);
    console.log('updateOffre existe?', typeof this.offreService.updateOffre);

    const request$ = this.isEditMode
      ? this.offreService.updateOffre(offre.id!, offre)
      : this.offreService.createOffre(offre);

    request$.subscribe({
      next: (result) => {
        this.loading = false;
        this.dialogRef.close(result); // ✅ reçoit bien l'Offre
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Erreur:', err);
      },
    });
  }
  onCancel(): void {
    this.dialogRef.close();
  }

  private parseCommaSeparated(value: string): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
