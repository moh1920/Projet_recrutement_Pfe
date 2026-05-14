import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
import { KeycloakService } from 'keycloak-angular';
import { ProfileResponseDTO, ProfileService } from '../../../core/services/profile.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { CvAnalysisService, EvaluationResult } from '../../../core/services/cv-analysis.service';
import { OffreService } from '../../../core/services/offre.service';

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
    MatSnackBarModule,
  ],
  templateUrl: './apply.component.html',
  styleUrl: './apply.component.scss',
})
export class ApplyComponent implements OnInit {
  offerId!: string;
  offerData: any = null; // Will hold the full offer object from the backend

  ngOnInit(): void {
    this.offerId = this.route.snapshot.queryParamMap.get('offer')!;
    console.log('ID Offre :', this.offerId);
    this.loadProfileAndUser();
    this.loadOfferData();
  }

  private _formBuilder = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);
  keycloakService = inject(KeycloakService);
  private profileService = inject(ProfileService);
  private candidateService = inject(CandidateService);
  private cvAnalysisService = inject(CvAnalysisService);
  private offerService = inject(OffreService); // uncomment if you have this service

  profileCurrent!: ProfileResponseDTO;
  currentStep = 1;
  isAnalyzing = false;
  analysisComplete = false;
  fileName = '';
  selectedFile: File | null = null;
  loadingProgress = 0;
  loadingStep = 'Initialisation...';

  // Real analysis result from API
  analysisResult: EvaluationResult | null = null;

  firstFormGroup: FormGroup;

  // Fallback mock (used only if API call fails)
  mockAnalysis = {
    score: 85,
    skills: [
      { name: 'Angular', level: 'expert' as const },
      { name: 'Spring Boot', level: 'expert' as const },
      { name: 'Deep Learning', level: 'intermediate' as const },
      { name: 'Pédagogie', level: 'expert' as const },
      { name: 'Python', level: 'intermediate' as const },
    ] as Skill[],
    experience: [
      { title: 'Développeur Full Stack', company: 'TechCorp', duration: '3 ans' },
      { title: 'Enseignant Vacataire', company: 'Université XYZ', duration: '2 ans' },
    ] as Experience[],
    feedback:
      'Excellent profil ! Votre expérience en développement web et votre sens pédagogique correspondent parfaitement à nos attentes.',
    feedbackType: 'success' as const,
    feedbackIcon: 'check_circle',
    feedbackTitle: 'Profil recommandé',
  };

  constructor(private route: ActivatedRoute) {
    this.firstFormGroup = this._formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[0-9]{8,15}$/)]],
      position: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  // ─── Helpers derived from the real API result ──────────────────────────────

  get displayScore(): number {
    return this.analysisResult?.globalScore ?? this.mockAnalysis.score;
  }

  get displaySkills(): Skill[] {
    if (!this.analysisResult) return this.mockAnalysis.skills;
    const matched = this.analysisResult.breakdown.skillsMatch.matchedSkills ?? [];
    const missing = this.analysisResult.breakdown.skillsMatch.missingSkills ?? [];
    return [
      ...matched.map((s) => ({ name: s, level: 'expert' as const })),
      ...missing.map((s) => ({ name: s, level: 'beginner' as const })),
    ];
  }

  get displayExperience(): Experience[] {
    if (!this.analysisResult) return this.mockAnalysis.experience;
    // Build experience entries from strengths (best-effort mapping)
    return this.analysisResult.strengths.map((s) => ({
      title: s,
      company: '',
      duration: '',
    }));
  }

  get displayFeedback(): string {
    return this.analysisResult?.recommendation ?? this.mockAnalysis.feedback;
  }

  get displayFeedbackType(): string {
    if (!this.analysisResult) return this.mockAnalysis.feedbackType;
    const score = this.analysisResult.globalScore;
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  }

  get displayFeedbackIcon(): string {
    const type = this.displayFeedbackType;
    if (type === 'success') return 'check_circle';
    if (type === 'warning') return 'warning';
    return 'cancel';
  }

  get displayFeedbackTitle(): string {
    if (!this.analysisResult) return this.mockAnalysis.feedbackTitle;
    return `Grade : ${this.analysisResult.grade}`;
  }

  // ─── Lifecycle / Event handlers ──────────────────────────────────────────

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
      this.selectedFile = file;
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.fileName = '';
    this.selectedFile = null;
  }

  startAnalysis(): void {
    if (!this.selectedFile) {
      this._snackBar.open('Veuillez sélectionner un fichier CV.', 'Fermer', { duration: 3000 });
      return;
    }

    this.isAnalyzing = true;
    this.loadingProgress = 0;
    this.analysisResult = null;

    // Animate loading bar while API call is in progress
    const animSteps = [
      { progress: 20, text: 'Extraction du texte...' },
      { progress: 45, text: 'Identification des compétences...' },
      { progress: 65, text: "Analyse de l'expérience..." },
      { progress: 85, text: 'Matching avec le poste...' },
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < animSteps.length) {
        this.loadingProgress = animSteps[stepIndex].progress;
        this.loadingStep = animSteps[stepIndex].text;
        stepIndex++;
      }
    }, 700);

    // Use the real offer data if available, otherwise fall back to a minimal object
    const offerPayload = this.offerData ?? { _id: this.offerId };

    this.cvAnalysisService.evaluateCvFile(this.selectedFile, offerPayload).subscribe({
      next: (result: EvaluationResult) => {
        clearInterval(interval);
        this.loadingProgress = 100;
        this.loadingStep = 'Finalisation...';
        this.analysisResult = result;
        console.log('Résultat analyse CV :', result);

        setTimeout(() => {
          this.isAnalyzing = false;
          this.analysisComplete = true;
        }, 500);
      },
      error: (err) => {
        clearInterval(interval);
        console.error('Erreur analyse CV :', err);
        this._snackBar.open("Erreur lors de l'analyse du CV. Veuillez réessayer.", 'Fermer', {
          duration: 4000,
        });
        this.isAnalyzing = false;
        // Optionally fall back to mock data so the user can still proceed:
        // this.analysisComplete = true;
      },
    });
  }

  resetAnalysis(): void {
    this.analysisComplete = false;
    this.analysisResult = null;
    this.fileName = '';
    this.selectedFile = null;
    this.loadingProgress = 0;
  }

  loadProfileAndUser(): void {
    const userId = this.keycloakService.getKeycloakInstance().tokenParsed?.sub;
    if (userId) {
      this.profileService.getProfileByUserId(userId).subscribe({
        next: (data) => {
          this.profileCurrent = data;
          this.firstFormGroup.patchValue({
            name: data.nom || '',
            email: data.email || '',
            phone: data.telephone || '',
            position: data.specialite || '',
          });
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this._snackBar.open('Erreur lors du chargement du profil', 'Fermer', { duration: 3000 });
        },
      });
    }
  }

  /**
   * Load the full offer object so we can pass it to the evaluation API.
   * Adjust the service call to match your actual OfferService API.
   */
  loadOfferData(): void {
    if (!this.offerId) return;
    //Uncomment and adapt once you have an OfferService:
    this.offerService.getOffreById(this.offerId).subscribe({
      next: (offer) => {
        this.offerData = offer;
      },
      error: (err) => console.error('Could not load offer data:', err),
    });
  }

  postulerOffre(): void {
    this.candidateService
      .postulerCandidature(this.profileCurrent.id, this.offerId)
      .subscribe((data) => {
        console.log(data);
      });
  }
}
