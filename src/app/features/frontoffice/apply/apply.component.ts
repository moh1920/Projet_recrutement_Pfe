
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { delay, of } from 'rxjs';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './apply.component.html',
  styleUrl: './apply.component.scss'
})
export class ApplyComponent {
  firstFormGroup = this._formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['']
  });

  isAnalyzing = false;
  analysisComplete = false;
  fileName = '';

  mockAnalysis = {
    score: 85,
    skills: ['Angular', 'Spring Boot', 'Deep Learning', 'Pedagogy'],
    feedback: 'Profil excellent. Forte adéquation avec le poste Enseignant Informatique.'
  };

  constructor(private _formBuilder: FormBuilder) { }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
    }
  }

  startAnalysis() {
    this.isAnalyzing = true;

    // Simulate AI Processing
    setTimeout(() => {
      this.isAnalyzing = false;
      this.analysisComplete = true;
    }, 3000);
  }
}
