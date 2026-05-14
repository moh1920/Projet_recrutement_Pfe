import { Component, inject, OnInit } from '@angular/core';
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
import { ProfileRequestDTO, ProfileService } from '../../../core/services/profile.service';
import { KeycloakService } from 'keycloak-angular';
import {Country, CountryService} from "../../../core/services/country.service";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

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
    MatCardModule,
    MatProgressSpinner,
  ],
  templateUrl: './profile-builder.component.html',
  styleUrl: './profile-builder.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('0.3s ease', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class ProfileBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private keycloak = inject(KeycloakService);

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

  // Skills Lists
  langagesList = [
    'Java',
    'Python',
    'JavaScript',
    'C++',
    'C#',
    'PHP',
    'Ruby',
    'Go',
    'Kotlin',
    'Swift',
  ];
  frameworksList = [
    'Spring Boot',
    'Angular',
    'React',
    'Vue.js',
    'Django',
    'Flask',
    'Node.js',
    'Express',
  ];
  dataSkillsList = [
    'SQL',
    'MongoDB',
    'PostgreSQL',
    'MySQL',
    'Redis',
    'Elasticsearch',
    'Hadoop',
    'Spark',
  ];
  iaSkillsList = [
    'Machine Learning',
    'Deep Learning',
    'NLP',
    'Computer Vision',
    'TensorFlow',
    'PyTorch',
    'Scikit-learn',
  ];
  erpSkillsList = ['SAP', 'Oracle', 'Odoo', 'Microsoft Dynamics'];
  methodesList = [
    'Cours Magistral',
    'TD/TP',
    'Projet',
    'E-Learning',
    'Classe Inversée',
    'Apprentissage par Problèmes',
  ];

  // Date limits for DatePicker
  minDate: Date;
  maxDate: Date;


  private countryService = inject(CountryService);

  // Remplacer le tableau statique par :
  nationalites: Country[] = [];
  nationalitesLoading = true;

  constructor() {
    const today = new Date();
    // Minimum age 18, maximum age 70
    this.maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    this.minDate = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate());

    this.initForms();
  }




  ngOnInit(): void {
    // Charger les nationalités depuis l'API
    this.countryService.getCountries().subscribe({
      next: (countries) => {
        this.nationalites = countries;
        this.nationalitesLoading = false;
      },
      error: () => {
        // Fallback en cas d'erreur réseau
        this.nationalites = [
          { name: 'Tunisienne', code: 'TN', flagUrl: '🇹🇳' },
          { name: 'Française',  code: 'FR', flagUrl: '🇫🇷' },
          { name: 'Algérienne', code: 'DZ', flagUrl: '🇩🇿' },
          { name: 'Marocaine',  code: 'MA', flagUrl: '🇲🇦' },
        ];
        this.nationalitesLoading = false;
      }
    });

    // Garder l'extraction des données CV
    const extractedData = history.state.extractedData;
    if (extractedData) {
      this.patchExtractedData(extractedData);
    }
  }

  private patchExtractedData(data: any): void {
    if (!data) return;

    // Mapping according to new LLM JSON output structure
    if (data.identification) {
      this.personalInfoForm.patchValue({
        nom: data.identification.nom || this.personalInfoForm.value.nom,
        email: data.identification.email || this.personalInfoForm.value.email,
        telephone: data.identification.telephone || this.personalInfoForm.value.telephone,
      });
    }

    if (data.formation) {
      this.educationForm.patchValue({
        niveauDiplome: data.formation.niveau_diplome || this.educationForm.value.niveauDiplome,
        specialite: data.formation.specialite || this.educationForm.value.specialite,
        universite: data.formation.universite || this.educationForm.value.universite,
        anneeDiplome: data.formation.annee_diplome || this.educationForm.value.anneeDiplome,
        gradeAcademique:
          data.formation.grade_academique || this.educationForm.value.gradeAcademique,
      });
    }

    if (data.experience) {
      this.experienceForm.patchValue({
        nbAnneesExperience:
          data.experience.nb_annees_experience || this.experienceForm.value.nbAnneesExperience,
        experienceAcademique:
          data.experience.experience_academique || this.experienceForm.value.experienceAcademique,
      });

      if (data.experience.institutions && Array.isArray(data.experience.institutions)) {
        this.institutions.clear();
        data.experience.institutions.forEach((inst: string) => {
          if (inst) this.institutions.push(this.fb.control(inst, Validators.required));
        });
      }

      if (data.experience.modules_enseignes && Array.isArray(data.experience.modules_enseignes)) {
        this.modulesEnseignes.clear();
        data.experience.modules_enseignes.forEach((mod: string) => {
          if (mod) this.modulesEnseignes.push(this.fb.control(mod, Validators.required));
        });
      }
    }

    if (data.competences) {
      const getMatches = (skills: string[], predefinedList: string[]) => {
        if (!skills || !Array.isArray(skills)) return [];
        return predefinedList.filter((l) =>
          skills.some(
            (s) =>
              s?.toLowerCase() === l.toLowerCase() ||
              s?.toLowerCase().includes(l.toLowerCase()) ||
              l.toLowerCase().includes(s?.toLowerCase())
          )
        );
      };

      this.technicalSkillsForm.patchValue({
        langages: getMatches(data.competences.langages, this.langagesList),
        frameworks: getMatches(data.competences.frameworks, this.frameworksList),
        dataSkills: getMatches(data.competences.data, this.dataSkillsList),
        iaSkills: getMatches(data.competences.ia, this.iaSkillsList),
        erpSkills: getMatches(data.competences.erp, this.erpSkillsList),
      });
    }

    // Mapping according to Spacy NER basic output (fallback)
    if (data.PER && data.PER.length > 0 && !data.identification?.nom) {
      this.personalInfoForm.patchValue({ nom: data.PER[0] });
    }
    if (data.EMAIL && data.EMAIL.length > 0 && !data.identification?.email) {
      this.personalInfoForm.patchValue({ email: data.EMAIL[0] });
    }
    if (data.PHONE && data.PHONE.length > 0 && !data.identification?.telephone) {
      this.personalInfoForm.patchValue({ telephone: data.PHONE[0] });
    }
    if (data.LOC && data.LOC.length > 0 && !data.identification?.localisation) {
      this.personalInfoForm.patchValue({ ville: data.LOC[0] });
    }

    if (data.SKILL && Array.isArray(data.SKILL)) {
      const getMatches = (skills: string[], predefinedList: string[]) => {
        if (!skills || !Array.isArray(skills)) return [];
        return predefinedList.filter((l) =>
          skills.some(
            (s) =>
              s?.toLowerCase() === l.toLowerCase() ||
              s?.toLowerCase().includes(l.toLowerCase()) ||
              l.toLowerCase().includes(s?.toLowerCase())
          )
        );
      };

      this.technicalSkillsForm.patchValue({
        langages: getMatches(data.SKILL, this.langagesList),
        frameworks: getMatches(data.SKILL, this.frameworksList),
      });
    }

    // Support for older LLM / Hybrid model outputs (JSON objects)
    if (data.information_personnelles) {
      this.personalInfoForm.patchValue({
        nom:
          data.information_personnelles.nom ||
          data.information_personnelles.prenom ||
          this.personalInfoForm.value.nom,
        email: data.information_personnelles.email || this.personalInfoForm.value.email,
        telephone: data.information_personnelles.telephone || this.personalInfoForm.value.telephone,
        ville: data.information_personnelles.localisation || this.personalInfoForm.value.ville,
      });
    }
  }

  private initForms(): void {
    const userId = this.keycloak.getKeycloakInstance().tokenParsed?.sub;

    this.personalInfoForm = this.fb.group({
      userId: [userId],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[+]?[0-9]{8,15}$/)]],
      nationalite: ['', Validators.required],
      ville: ['', Validators.required],
      dateNaissance: ['', Validators.required],
    });

    this.educationForm = this.fb.group({
      niveauDiplome: ['', Validators.required],
      specialite: ['', Validators.required],
      universite: ['', Validators.required],
      anneeDiplome: ['', [Validators.required, Validators.min(1950), Validators.max(2030)]],
      gradeAcademique: [''],
    });

    this.experienceForm = this.fb.group({
      nbAnneesExperience: [0, [Validators.required, Validators.min(0)]],
      experienceAcademique: [false],
      institutions: this.fb.array([]),
      modulesEnseignes: this.fb.array([]),
    });

    this.technicalSkillsForm = this.fb.group({
      langages: [[]],
      frameworks: [[]],
      dataSkills: [[]],
      iaSkills: [[]],
      erpSkills: [[]],
    });

    this.pedagogicalSkillsForm = this.fb.group({
      methodesEnseignement: [[]],
      encadrement: [false],
      innovationPedagogique: [false],
    });

    this.softSkillsForm = this.fb.group({
      communication: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      leadership: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      espritEquipe: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      motivation: ['', [Validators.required, Validators.minLength(50)]],
    });
  }

  // ─── Mark steps as touched to display errors ──────────────────────────────

  markStep1AsTouched(): void {
    this.personalInfoForm.markAllAsTouched();
  }

  markStep2AsTouched(): void {
    this.educationForm.markAllAsTouched();
  }

  markStep3AsTouched(): void {
    this.experienceForm.markAllAsTouched();
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
      this.softSkillsForm,
    ];

    const validForms = forms.filter((f) => f.valid).length;
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
    return (
      this.personalInfoForm.valid &&
      this.educationForm.valid &&
      this.experienceForm.valid &&
      this.technicalSkillsForm.valid &&
      this.pedagogicalSkillsForm.valid &&
      this.softSkillsForm.valid
    );
  }

  onSubmit(): void {
    if (this.isAllFormsValid()) {
      const profileData: ProfileRequestDTO = {
        ...this.personalInfoForm.value,
        ...this.educationForm.value,
        ...this.experienceForm.value,
        ...this.technicalSkillsForm.value,
        ...this.pedagogicalSkillsForm.value,
        ...this.softSkillsForm.value,
        dateNaissance:
          this.personalInfoForm.value.dateNaissance?.toISOString?.() ||
          this.personalInfoForm.value.dateNaissance,
      };

      this.profileService.createProfile(profileData).subscribe({
        next: () => {
          this.router.navigate(['/profile-success']);
        },
        error: (error) => {
          console.error('Erreur:', error);
        },
      });
    }
  }
}
