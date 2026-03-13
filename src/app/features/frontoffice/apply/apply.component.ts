import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import {ActivatedRoute, RouterModule} from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { KeycloakService } from "keycloak-angular";
import { ProfileResponseDTO, ProfileService } from "../../../core/services/profile.service";
import {CandidateService} from "../../../core/services/candidate.service";

interface Skill {
  name: string;
  level: 'expert' | 'intermediate' | 'beginner';
}

interface Experience {
  title: string;
  company: string;
  duration: string;
}

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatStepperModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './apply.component.html',
  styleUrl: './apply.component.scss'
})
export class ApplyComponent implements OnInit {



  offerId!: string;

  ngOnInit(): void {
    this.offerId = this.route.snapshot.queryParamMap.get('offer')!;
    console.log("ID Offre :", this.offerId);
    this.loadProfileAndUser();
  }

  private _formBuilder = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);
  keycloakService = inject(KeycloakService);
  private profileService = inject(ProfileService);
  private candidateService = inject(CandidateService)


  profileCurrent!: ProfileResponseDTO;
  currentStep = 1;
  isAnalyzing = false;
  analysisComplete = false;
  fileName = '';
  loadingProgress = 0;
  loadingStep = 'Initialisation...';

  // Initialize with default values first
  firstFormGroup: FormGroup;

  mockAnalysis = {
    score: 85,
    skills: [
      { name: 'Angular', level: 'expert' as const },
      { name: 'Spring Boot', level: 'expert' as const },
      { name: 'Deep Learning', level: 'intermediate' as const },
      { name: 'Pédagogie', level: 'expert' as const },
      { name: 'Python', level: 'intermediate' as const }
    ] as Skill[],
    experience: [
      { title: 'Développeur Full Stack', company: 'TechCorp', duration: '3 ans' },
      { title: 'Enseignant Vacataire', company: 'Université XYZ', duration: '2 ans' }
    ] as Experience[],
    feedback: 'Excellent profil ! Votre expérience en développement web et votre sens pédagogique correspondent parfaitement à nos attentes.',
    feedbackType: 'success' as const,
    feedbackIcon: 'check_circle',
    feedbackTitle: 'Profil recommandé'
  };

  constructor(private route: ActivatedRoute) {
    // Initialize the form with empty/default values
    this.firstFormGroup = this._formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: ['', Validators.required]
    });
  }

  onStepChange(event: StepperSelectionEvent): void {
    this.currentStep = event.selectedIndex + 1;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this._snackBar.open('Fichier trop volumineux (max 5MB)', 'Fermer', { duration: 3000 });
        return;
      }
      this.fileName = file.name;
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.fileName = '';
  }

  startAnalysis(): void {
    this.isAnalyzing = true;
    this.loadingProgress = 0;

    const steps = [
      { progress: 25, text: 'Extraction du texte...' },
      { progress: 50, text: 'Identification des compétences...' },
      { progress: 75, text: 'Analyse de l\'expérience...' },
      { progress: 90, text: 'Matching avec le poste...' },
      { progress: 100, text: 'Finalisation...' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        this.loadingProgress = steps[stepIndex].progress;
        this.loadingStep = steps[stepIndex].text;
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          this.isAnalyzing = false;
          this.analysisComplete = true;
        }, 500);
      }
    }, 600);
  }

  resetAnalysis(): void {
    this.analysisComplete = false;
    this.fileName = '';
    this.loadingProgress = 0;
  }

  loadProfileAndUser() {
    const userId = this.keycloakService.getKeycloakInstance().tokenParsed?.sub;
    if (userId) {
      this.profileService.getProfileByUserId(userId).subscribe({
        next: (data) => {
          this.profileCurrent = data;
          console.log(this.profileCurrent.id);

          this.firstFormGroup.patchValue({
            name: data.nom || '',
            email: data.email || '',
            phone: data.telephone || '',
            position: data.specialite || ''
          });
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this._snackBar.open('Erreur lors du chargement du profil', 'Fermer', { duration: 3000 });
        }
      });
    }
  }



  postulerOffre(){
    this.candidateService.postulerCandidature(this.profileCurrent.id,this.offerId).subscribe(data =>{
      console.log(data);
    })
  }



}
