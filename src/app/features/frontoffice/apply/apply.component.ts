import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
export class ApplyComponent {
  private _formBuilder = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);

  currentStep = 1;
  isAnalyzing = false;
  analysisComplete = false;
  fileName = '';
  loadingProgress = 0;
  loadingStep = 'Initialisation...';

  firstFormGroup = this._formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    position: ['', Validators.required]
  });

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
}
