import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { ProfileService, ProfileDetails } from '../../../core/services/profile.service';

@Component({
  selector: 'app-profile-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatIconModule,
    MatSliderModule,
    MatCardModule
  ],
  templateUrl: './profile-builder.component.html',
  styleUrl: './profile-builder.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('0.3s ease', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class ProfileBuilderComponent {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  currentStep = 1;

  // Form Groups
  personalInfoForm!: FormGroup;
  educationForm!: FormGroup;
  experienceForm!: FormGroup;
  technicalSkillsForm!: FormGroup;
  pedagogicalSkillsForm!: FormGroup;
  softSkillsForm!: FormGroup;

  // Options
  niveauxDiplome = ['Licence', 'Master', 'Doctorat', 'HDR', 'Ingénieur'];
  gradesAcademiques = ['Assistant', 'Maître Assistant', 'Maître de Conférences', 'Professeur'];
  nationalites = ['Tunisienne', 'Française', 'Algérienne', 'Marocaine', 'Autre'];

  // Skills Lists
  langagesList = ['Java', 'Python', 'JavaScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Kotlin', 'Swift'];
  frameworksList = ['Spring Boot', 'Angular', 'React', 'Vue.js', 'Django', 'Flask', 'Node.js', 'Express'];
  dataSkillsList = ['SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Hadoop', 'Spark'];
  iaSkillsList = ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Scikit-learn'];
  erpSkillsList = ['SAP', 'Oracle', 'Odoo', 'Microsoft Dynamics'];
  methodesList = ['Cours Magistral', 'TD/TP', 'Projet', 'E-Learning', 'Classe Inversée', 'Apprentissage par Problèmes'];

  constructor() {
    this.initForms();
  }

  private initForms(): void {
    this.personalInfoForm = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      nationalite: ['', Validators.required],
      ville: ['', Validators.required],
      dateNaissance: ['', Validators.required]
    });

    this.educationForm = this.fb.group({
      niveauDiplome: ['', Validators.required],
      specialite: ['', Validators.required],
      universite: ['', Validators.required],
      anneeDiplome: ['', [Validators.required, Validators.min(1950), Validators.max(2030)]],
      gradeAcademique: ['']
    });

    this.experienceForm = this.fb.group({
      nbAnneesExperience: [0, [Validators.required, Validators.min(0)]],
      experienceAcademique: [false],
      institutions: this.fb.array([]),
      modulesEnseignes: this.fb.array([])
    });

    this.technicalSkillsForm = this.fb.group({
      langages: [[]],
      frameworks: [[]],
      dataSkills: [[]],
      iaSkills: [[]],
      erpSkills: [[]]
    });

    this.pedagogicalSkillsForm = this.fb.group({
      methodesEnseignement: [[]],
      encadrement: [false],
      innovationPedagogique: [false]
    });

    this.softSkillsForm = this.fb.group({
      communication: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      leadership: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      espritEquipe: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      motivation: ['', [Validators.required, Validators.minLength(50)]]
    });
  }

  get institutions(): FormArray {
    return this.experienceForm.get('institutions') as FormArray;
  }

  get modulesEnseignes(): FormArray {
    return this.experienceForm.get('modulesEnseignes') as FormArray;
  }

  onStepChange(event: StepperSelectionEvent): void {
    this.currentStep = event.selectedIndex + 1;
  }

  calculateProgress(): number {
    const forms = [
      this.personalInfoForm,
      this.educationForm,
      this.experienceForm,
      this.technicalSkillsForm,
      this.pedagogicalSkillsForm,
      this.softSkillsForm
    ];

    const validForms = forms.filter(f => f.valid).length;
    return Math.round((validForms / forms.length) * 100);
  }

  addInstitution(): void {
    this.institutions.push(this.fb.control('', Validators.required));
  }

  removeInstitution(index: number): void {
    this.institutions.removeAt(index);
  }

  addModule(): void {
    this.modulesEnseignes.push(this.fb.control('', Validators.required));
  }

  removeModule(index: number): void {
    this.modulesEnseignes.removeAt(index);
  }

  toggleCheckbox(controlName: string): void {
    const control = this.pedagogicalSkillsForm.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }

  isAllFormsValid(): boolean {
    return this.personalInfoForm.valid &&
      this.educationForm.valid &&
      this.experienceForm.valid &&
      this.technicalSkillsForm.valid &&
      this.pedagogicalSkillsForm.valid &&
      this.softSkillsForm.valid;
  }

  onSubmit(): void {
    if (this.isAllFormsValid()) {
      const profileData: ProfileDetails = {
        ...this.personalInfoForm.value,
        ...this.educationForm.value,
        ...this.experienceForm.value,
        ...this.technicalSkillsForm.value,
        ...this.pedagogicalSkillsForm.value,
        ...this.softSkillsForm.value,
        dateNaissance: this.personalInfoForm.value.dateNaissance?.toISOString?.() || this.personalInfoForm.value.dateNaissance
      };

      this.profileService.saveProfile(profileData).subscribe({
        next: () => {
          this.router.navigate(['/profile-success']);
        },
        error: (error) => {
          console.error('Erreur:', error);
        }
      });
    }
  }
}
