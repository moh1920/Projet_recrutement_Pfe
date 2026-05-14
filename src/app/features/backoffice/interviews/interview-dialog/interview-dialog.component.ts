import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Interview,
  InterviewStatus,
  InterviewType,
  EvaluationCriteria,
} from '../../../../core/services/interview.service';

// ==================== Interface locale pour le jury ====================
interface JuryMember {
  name: string;
  id?: string;
  email?: string;
}

// ==================== Validateurs personnalisés ====================

/** Vérifie que la date n'est pas dans le passé */
function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const selected = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today ? { pastDate: true } : null;
  };
}

/** Vérifie le format d'un numéro de téléphone tunisien ou international */
function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null; // optionnel
    const pattern = /^(\+?\d[\d\s\-().]{6,19})$/;
    return pattern.test(control.value.trim()) ? null : { invalidPhone: true };
  };
}

/** Vérifie que la durée est un multiple de 5 minutes */
function durationStepValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return control.value % 5 !== 0 ? { durationStep: true } : null;
  };
}

/** Vérifie que le nom ne contient pas de chiffres ou caractères spéciaux indésirables */
function nameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const pattern = /^[a-zA-ZÀ-ÿ\s'\-\.]+$/;
    return pattern.test(control.value.trim()) ? null : { invalidName: true };
  };
}

/** Vérifie que l'URL est bien https:// ou http:// ou vide */
function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value.trim() === '') return null;
    try {
      const url = new URL(control.value.trim());
      return url.protocol === 'http:' || url.protocol === 'https:' ? null : { invalidUrl: true };
    } catch {
      return { invalidUrl: true };
    }
  };
}

@Component({
  selector: 'app-interview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatNativeDateModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './interview-dialog.component.html',
  styleUrl: './interview-dialog.component.scss',
})
export class InterviewDialogComponent implements OnInit {
  // ==================== Injection ====================
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InterviewDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data: Partial<Interview> = inject(MAT_DIALOG_DATA) ?? {};

  // ==================== État ====================
  isSubmitting = false;
  isEditMode = false;
  isCandidatePreFilled = false;
  activeTabIndex = 0;

  // ==================== Formulaire ====================
  interviewForm!: FormGroup;

  // ==================== Jury ====================
  juryMembers: JuryMember[] = [];
  newJuryName = '';
  newJuryId = '';
  newJuryEmail = '';
  newJuryEmailError = '';

  // ==================== Prérequis ====================
  requirements: string[] = [];
  newRequirement = '';

  // ==================== Critères d'évaluation ====================
  evaluationCriteria: EvaluationCriteria[] = [];
  newCriteria: Partial<EvaluationCriteria> = { criterion: '', weight: 30, description: '' };
  criteriaWeightError = '';

  // ==================== Durées prédéfinies ====================
  durationPresets = [
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1h', value: 60 },
    { label: '1h30', value: 90 },
    { label: '2h', value: 120 },
  ];

  // ==================== Lifecycle ====================
  ngOnInit(): void {
    this.isEditMode = !!this.data?.id;
    this.buildForm();
    this.prefillFromData();
  }

  // ==================== Construction du formulaire ====================
  private buildForm(): void {
    this.interviewForm = this.fb.group({
      // --- Candidat ---
      candidateName: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(100), nameValidator()],
      ],
      candidateId: ['', [Validators.maxLength(50)]],
      candidateEmail: ['', [Validators.email, Validators.maxLength(150)]],
      candidatePhone: ['', [phoneValidator()]],

      // --- Poste ---
      position: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
      department: [''],

      // --- Classification ---
      type: ['interview' as InterviewType, Validators.required],
      status: ['Planifié' as InterviewStatus, Validators.required],

      // --- Planning ---
      date: [null, [Validators.required, futureDateValidator()]],
      time: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      duration: [
        45,
        [
          Validators.required,
          Validators.min(15),
          Validators.max(480),
          durationStepValidator(),
        ],
      ],

      // --- Lieu ---
      room: ['', [Validators.maxLength(50)]],
      location: ['', [Validators.maxLength(200)]],
      meetLink: ['', [urlValidator()]],

      // --- Détails ---
      notes: ['', [Validators.maxLength(1000)]],
      createdBy: [''],
    });
  }

  // ==================== Préremplissage ====================
  private prefillFromData(): void {
    if (!this.data) return;

    this.interviewForm.patchValue({
      candidateName: this.data.candidateName ?? '',
      candidateId: this.data.candidateId ?? '',
      candidateEmail: this.data.candidateEmail ?? '',
      candidatePhone: this.data.candidatePhone ?? '',
      position: this.data.position ?? '',
      department: this.data.department ?? '',
      type: this.data.type ?? 'interview',
      status: this.data.status ?? 'Planifié',
      date: this.data.date ? new Date(this.data.date) : null,
      time: this.data.time ?? '',
      duration: this.data.duration ?? 45,
      room: this.data.room ?? '',
      location: this.data.location ?? '',
      meetLink: this.data.meetLink ?? '',
      notes: this.data.notes ?? '',
    });

    this.isCandidatePreFilled = !!(this.data.candidateName && !this.isEditMode);

    if (this.isCandidatePreFilled) {
      this.f['candidateName'].disable();
      this.f['candidateId'].disable();
      this.f['candidateEmail'].disable();
      this.f['candidatePhone'].disable();
    }

    if (this.data.jury?.length) {
      this.juryMembers = this.data.jury.map((name, i) => ({
        name,
        id: this.data.juryIds?.[i] ?? '',
        email: this.data.juryEmails?.[i] ?? '',
      }));
    }

    if (this.data.requirements) this.requirements = [...this.data.requirements];

    if (this.data.evaluationCriteria) {
      this.evaluationCriteria = this.data.evaluationCriteria.map((c) => ({ ...c }));
    }
  }

  // ==================== Accesseur rapide aux contrôles ====================
  get f(): { [key: string]: AbstractControl } {
    return this.interviewForm.controls;
  }

  /** Retourne les messages d'erreur d'un contrôle */
  getError(controlName: string): string {
    const ctrl = this.f[controlName];
    if (!ctrl || !ctrl.errors || (!ctrl.touched && !ctrl.dirty)) return '';

    const errors = ctrl.errors;
    if (errors['required']) return 'Ce champ est obligatoire.';
    if (errors['minlength'])
      return `Minimum ${errors['minlength'].requiredLength} caractères.`;
    if (errors['maxlength'])
      return `Maximum ${errors['maxlength'].requiredLength} caractères.`;
    if (errors['email']) return 'Adresse email invalide.';
    if (errors['invalidPhone']) return 'Numéro de téléphone invalide.';
    if (errors['invalidName']) return 'Nom invalide (lettres et espaces uniquement).';
    if (errors['min']) return `Valeur minimum : ${errors['min'].min}.`;
    if (errors['max']) return `Valeur maximum : ${errors['max'].max}.`;
    if (errors['pastDate']) return 'La date ne peut pas être dans le passé.';
    if (errors['pattern']) return 'Format invalide.';
    if (errors['invalidUrl']) return 'URL invalide (ex: https://meet.google.com/...).';
    if (errors['durationStep']) return 'La durée doit être un multiple de 5 minutes.';
    return 'Valeur invalide.';
  }

  /** Vérifie si un contrôle est en erreur et touché */
  isInvalid(controlName: string): boolean {
    const ctrl = this.f[controlName];
    return !!(ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty));
  }

  // ==================== Jury ====================

  addJuryMember(): void {
    const name = this.newJuryName.trim();
    if (!name) return;

    if (this.juryMembers.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      this.snackBar.open('Ce membre est déjà dans le jury.', 'OK', { duration: 3000 });
      return;
    }

    // Validation email jury (optionnelle)
    if (this.newJuryEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(this.newJuryEmail.trim())) {
        this.newJuryEmailError = 'Email invalide';
        return;
      }
    }
    this.newJuryEmailError = '';

    this.juryMembers.push({
      name,
      id: this.newJuryId.trim() || undefined,
      email: this.newJuryEmail.trim() || undefined,
    });

    this.newJuryName = '';
    this.newJuryId = '';
    this.newJuryEmail = '';
  }

  removeJuryMember(index: number): void {
    this.juryMembers.splice(index, 1);
  }

  // ==================== Prérequis ====================

  addRequirement(): void {
    const req = this.newRequirement.trim();
    if (!req) return;
    if (req.length > 200) {
      this.snackBar.open('Exigence trop longue (200 caractères max).', 'OK', { duration: 3000 });
      return;
    }
    if (this.requirements.includes(req)) {
      this.snackBar.open('Cette exigence existe déjà.', 'OK', { duration: 3000 });
      return;
    }
    this.requirements.push(req);
    this.newRequirement = '';
  }

  removeRequirement(index: number): void {
    this.requirements.splice(index, 1);
  }

  // ==================== Critères d'évaluation ====================

  addCriteria(): void {
    const criterion = this.newCriteria.criterion?.trim();
    if (!criterion) return;

    const weight = this.newCriteria.weight ?? 10;
    if (weight < 1 || weight > 100) {
      this.criteriaWeightError = 'Le poids doit être entre 1 et 100.';
      return;
    }

    const newTotal = this.totalCriteriaWeight + weight;
    if (newTotal > 100) {
      this.criteriaWeightError = `Total dépasserait 100% (actuel : ${this.totalCriteriaWeight}%, ajout : ${weight}%).`;
      return;
    }

    if (this.evaluationCriteria.some((c) => c.criterion.toLowerCase() === criterion.toLowerCase())) {
      this.criteriaWeightError = 'Ce critère existe déjà.';
      return;
    }

    this.criteriaWeightError = '';
    this.evaluationCriteria.push({
      id: `crit-${Date.now()}`,
      criterion,
      weight,
      description: this.newCriteria.description?.trim() || undefined,
    });

    this.newCriteria = { criterion: '', weight: 10, description: '' };
  }

  removeCriteria(index: number): void {
    this.evaluationCriteria.splice(index, 1);
    this.criteriaWeightError = '';
  }

  get totalCriteriaWeight(): number {
    return this.evaluationCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  }

  // ==================== Durée rapide ====================

  setDuration(minutes: number): void {
    this.interviewForm.patchValue({ duration: minutes });
    this.f['duration'].markAsTouched();
  }

  // ==================== Onglets avec erreurs ====================

  /** Indique si l'onglet 1 (Informations) a des erreurs */
  get tab1HasErrors(): boolean {
    const fields = ['candidateName', 'candidateEmail', 'candidatePhone', 'candidateId', 'position'];
    return fields.some((f) => this.f[f]?.invalid && this.f[f]?.touched);
  }

  /** Indique si l'onglet 2 (Planning) a des erreurs */
  get tab2HasErrors(): boolean {
    const fields = ['date', 'time', 'duration', 'meetLink'];
    return fields.some((f) => this.f[f]?.invalid && this.f[f]?.touched);
  }

  // ==================== Soumission ====================

  onSubmit(): void {
    this.interviewForm.markAllAsTouched();

    if (this.interviewForm.invalid) {
      // Rediriger vers le premier onglet en erreur
      if (this.tab1HasErrors) this.activeTabIndex = 0;
      else if (this.tab2HasErrors) this.activeTabIndex = 1;

      this.snackBar.open(
        'Veuillez corriger les erreurs avant de soumettre.',
        'OK',
        { duration: 4000, panelClass: 'snack-error' }
      );
      return;
    }

    if (this.totalCriteriaWeight > 100) {
      this.activeTabIndex = 3;
      this.snackBar.open(
        `Le total des critères dépasse 100% (${this.totalCriteriaWeight}%).`,
        'OK',
        { duration: 4000, panelClass: 'snack-error' }
      );
      return;
    }

    this.isSubmitting = true;

    const formValue = this.interviewForm.getRawValue();

    let dateStr = '';
    if (formValue.date instanceof Date) {
      const d = formValue.date;
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (typeof formValue.date === 'string') {
      dateStr = formValue.date;
    }

    const result: Partial<Interview> = {
      ...(this.isEditMode && this.data?.id ? { id: this.data.id } : {}),
      candidateName: formValue.candidateName,
      candidateId: formValue.candidateId || undefined,
      candidateEmail: formValue.candidateEmail || undefined,
      candidatePhone: formValue.candidatePhone || undefined,
      position: formValue.position,
      department: formValue.department || undefined,
      type: formValue.type as InterviewType,
      status: formValue.status as InterviewStatus,
      date: dateStr,
      time: formValue.time,
      duration: Number(formValue.duration),
      room: formValue.room || undefined,
      location: formValue.location || undefined,
      meetLink: formValue.meetLink || undefined,
      jury: this.juryMembers.map((m) => m.name),
      juryIds: this.juryMembers.map((m) => m.id ?? '').filter(Boolean),
      juryEmails: this.juryMembers.map((m) => m.email ?? '').filter(Boolean),
      notes: formValue.notes || undefined,
      requirements: this.requirements.length ? this.requirements : undefined,
      evaluationCriteria: this.evaluationCriteria.length ? this.evaluationCriteria : undefined,
    };

    setTimeout(() => {
      this.isSubmitting = false;
      this.dialogRef.close(result);
    }, 300);
  }

  // ==================== Annulation ====================

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onDateSelected(event: MatDatepickerInputEvent<Date>): void {
    console.log('Date saisie :', event.value);
  }

  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.f['date'].markAsTouched();
  }
}
