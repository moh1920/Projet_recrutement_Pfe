import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {MatDatepickerInputEvent, MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {
  Interview,
  InterviewStatus,
  InterviewType,
  EvaluationCriteria
} from '../../../../core/services/interview.service';

// ==================== Interface locale pour le jury ====================
interface JuryMember {
  name: string;
  id?: string;
  email?: string;
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
  ],
  templateUrl: './interview-dialog.component.html',
  styleUrl: './interview-dialog.component.scss'
})
export class InterviewDialogComponent implements OnInit {

  // ==================== Injection ====================
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InterviewDialogComponent>);
  data: Partial<Interview> = inject(MAT_DIALOG_DATA) ?? {};

  // ==================== État ====================
  isSubmitting = false;
  isEditMode = false;

  // ==================== Formulaire ====================
  interviewForm!: FormGroup;

  // ==================== Jury (géré séparément en listes) ====================
  juryMembers: JuryMember[] = [];
  newJuryName = '';
  newJuryId = '';
  newJuryEmail = '';

  // ==================== Prérequis ====================
  requirements: string[] = [];
  newRequirement = '';

  // ==================== Critères d'évaluation ====================
  evaluationCriteria: EvaluationCriteria[] = [];
  newCriteria: Partial<EvaluationCriteria> = { criterion: '', weight: 30, description: '' };

  // ==================== Durées prédéfinies ====================
  durationPresets = [
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1h',     value: 60 },
    { label: '1h30',   value: 90 },
    { label: '2h',     value: 120 },
  ];

  // ==================== Lifecycle ====================


  isCandidatePreFilled = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.id;
    this.buildForm();
    this.prefillFromData();
  }

  // ==================== Construction du formulaire ====================

  private buildForm(): void {
    this.interviewForm = this.fb.group({
      // --- Candidat ---
      candidateName:  ['', [Validators.required, Validators.minLength(2)]],
      candidateId:    [''],
      candidateEmail: ['', [Validators.email]],
      candidatePhone: [''],

      // --- Poste ---
      position:   ['', Validators.required],
      department: [''],

      // --- Classification ---
      type:   ['interview' as InterviewType, Validators.required],
      status: ['Planifié' as InterviewStatus, Validators.required],

      // --- Planning ---
      date:     [null, Validators.required],
      time:     ['', Validators.required],
      duration: [45, [Validators.required, Validators.min(15), Validators.max(480)]],

      // --- Lieu ---
      room:     [''],
      location: [''],
      meetLink: ['', [Validators.pattern(/^(https?:\/\/.+)?$/)]],

      // --- Détails ---
      notes:    [''],
      createdBy:[''],
    });
  }

  // ==================== Préremplissage (mode édition) ====================

  private prefillFromData(): void {
    if (!this.data) return;

    // Patch les champs du formulaire
    this.interviewForm.patchValue({
      candidateName:  this.data.candidateName  ?? '',
      candidateId:    this.data.candidateId    ?? '',
      candidateEmail: this.data.candidateEmail ?? '',
      candidatePhone: this.data.candidatePhone ?? '',
      position:       this.data.position       ?? '',
      department:     this.data.department     ?? '',
      type:           this.data.type           ?? 'interview',
      status:         this.data.status         ?? 'Planifié',
      date: this.data.date ? new Date(this.data.date) : null,
      time:           this.data.time           ?? '',
      duration:       this.data.duration       ?? 45,
      room:           this.data.room           ?? '',
      location:       this.data.location       ?? '',
      meetLink:       this.data.meetLink       ?? '',
      notes:          this.data.notes          ?? '',
    });


    // Détecter si le candidat vient d'une source externe (tableau candidats)
    this.isCandidatePreFilled = !!(this.data.candidateName && !this.isEditMode);

    if (this.isCandidatePreFilled) {
      this.f['candidateName'].disable();
      this.f['candidateId'].disable();
      this.f['candidateEmail'].disable();
      this.f['candidatePhone'].disable();
    }
    // Jury
    if (this.data.jury && this.data.jury.length > 0) {
      this.juryMembers = this.data.jury.map((name, i) => ({
        name,
        id:    this.data.juryIds?.[i]    ?? '',
        email: this.data.juryEmails?.[i] ?? '',
      }));
    }

    // Prérequis
    if (this.data.requirements) {
      this.requirements = [...this.data.requirements];
    }

    // Critères d'évaluation
    if (this.data.evaluationCriteria) {
      this.evaluationCriteria = this.data.evaluationCriteria.map(c => ({ ...c }));
    }
  }

  // ==================== Accesseur rapide aux contrôles ====================

  get f(): { [key: string]: any } {
    return this.interviewForm.controls;
  }

  // ==================== Jury ====================

  addJuryMember(): void {
    const name = this.newJuryName.trim();
    if (!name) return;

    // Éviter les doublons
    if (this.juryMembers.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    this.juryMembers.push({
      name,
      id:    this.newJuryId.trim()    || undefined,
      email: this.newJuryEmail.trim() || undefined,
    });

    this.newJuryName  = '';
    this.newJuryId    = '';
    this.newJuryEmail = '';
  }

  removeJuryMember(index: number): void {
    this.juryMembers.splice(index, 1);
  }

  // ==================== Prérequis ====================

  addRequirement(): void {
    const req = this.newRequirement.trim();
    if (!req) return;
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

    this.evaluationCriteria.push({
      id:          `crit-${Date.now()}`,
      criterion,
      weight:      this.newCriteria.weight     ?? 10,
      description: this.newCriteria.description?.trim() || undefined,
    });

    this.newCriteria = { criterion: '', weight: 10, description: '' };
  }

  removeCriteria(index: number): void {
    this.evaluationCriteria.splice(index, 1);
  }

  get totalCriteriaWeight(): number {
    return this.evaluationCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  }

  // ==================== Durée rapide ====================

  setDuration(minutes: number): void {
    this.interviewForm.patchValue({ duration: minutes });
  }

  // ==================== Soumission ====================

  onSubmit(): void {
    if (this.interviewForm.invalid) {
      this.interviewForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue = this.interviewForm.getRawValue();



    let dateStr = '';
    if (formValue.date instanceof Date) {
      const d = formValue.date;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else if (typeof formValue.date === 'string') {
      dateStr = formValue.date;
    }

    // Construction de l'objet Interview complet
    const result: Partial<Interview> = {
      // Conserver l'ID si mode édition
      ...(this.isEditMode && this.data?.id ? { id: this.data.id } : {}),
      // Candidat
      candidateName:  formValue.candidateName,
      candidateId:    formValue.candidateId    || undefined,
      candidateEmail: formValue.candidateEmail || undefined,
      candidatePhone: formValue.candidatePhone || undefined,

      // Poste
      position:   formValue.position,
      department: formValue.department || undefined,

      // Classification
      type:   formValue.type   as InterviewType,
      status: formValue.status as InterviewStatus,

      // Planning
      date:     dateStr,
      time:     formValue.time,
      duration: Number(formValue.duration),

      // Lieu
      room:     formValue.room     || undefined,
      location: formValue.location || undefined,
      meetLink: formValue.meetLink || undefined,

      // Jury (sérialisation en tableaux séparés)
      jury:        this.juryMembers.map(m => m.name),
      juryIds:     this.juryMembers.map(m => m.id ?? '').filter(Boolean),
      juryEmails:  this.juryMembers.map(m => m.email ?? '').filter(Boolean),

      // Détails
      notes:              formValue.notes     || undefined,
      requirements:       this.requirements.length ? this.requirements : undefined,
      evaluationCriteria: this.evaluationCriteria.length ? this.evaluationCriteria : undefined,
    };

    // Simuler un léger délai (UX) puis fermer
    setTimeout(() => {
      this.isSubmitting = false;
      this.dialogRef.close(result);
    }, 300);
  }

  // ==================== Annulation ====================

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onDateSelected(event: MatDatepickerInputEvent<Date>) {
    console.log('Date saisie :', event.value);
  }

  onDateChange(event: MatDatepickerInputEvent<Date>) {
    console.log('Date sélectionnée :', event.value);
    // Récupérer la valeur du formulaire
    const dateValue = this.interviewForm.get('date')?.value;
    console.log('Valeur du form :', dateValue);
  }
}
