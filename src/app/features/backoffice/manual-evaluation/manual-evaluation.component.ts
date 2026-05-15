import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CritereDeSelection, ManualEvaluationService, ManualEvaluation } from '../../../core/services/manual-evaluation.service';
import { AppKeycloakService } from '../../../core/services/keycloak.service';
import { MatchingService } from '../../../core/services/matching.service';
import { MatchResult } from '../../../core/models/matching.model';
import { LucideAngularModule, ChevronLeft, Save, AlertCircle, CheckCircle, BrainCircuit } from 'lucide-angular';

@Component({
  selector: 'app-manual-evaluation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './manual-evaluation.component.html',
  styleUrls: ['./manual-evaluation.component.scss']
})
export class ManualEvaluationComponent implements OnInit {
  offreId!: string;
  candidatId!: string;
  criteres: CritereDeSelection[] = [];
  evaluationForm!: FormGroup;
  aiScore: number | null = null;
  aiDetails: { key: string; value: any }[] = [];
  aiLoading = true;

  isLoading = true;
  isSubmitting = false;
  submitSuccess = false;
  errorMessage = '';

  // Icons
  ChevronLeft = ChevronLeft;
  Save = Save;
  AlertCircle = AlertCircle;
  CheckCircle = CheckCircle;
  BrainCircuit = BrainCircuit;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private evaluationService: ManualEvaluationService,
    private matchingService: MatchingService,
    private keycloakService: AppKeycloakService
  ) {}

  existingEvaluation: ManualEvaluation | null = null;

  ngOnInit(): void {
    this.offreId = this.route.snapshot.paramMap.get('offerId') || '';
    this.candidatId = this.route.snapshot.paramMap.get('candidateId') || '';

    if (!this.offreId || !this.candidatId) {
      this.errorMessage = 'Identifiants (Offre ou Candidat) manquants.';
      this.isLoading = false;
      return;
    }

    this.evaluationForm = this.fb.group({});
    this.loadCriteres();
    this.loadAiScore();
    this.loadExistingEvaluation();
  }

  loadExistingEvaluation() {
    this.evaluationService.getManualEvaluationByCandidatsId(this.candidatId).subscribe({
      next: (evalData) => {
        if (evalData && evalData.id) {
          this.existingEvaluation = evalData;
          // Apply values to form if controls are ready
          this.applyExistingEvaluation();
        }
      },
      error: (err) => {
        // Ignorer l'erreur si c'est un 404 ou 500 dû à l'absence d'évaluation
        console.log("Pas d'évaluation existante trouvée ou erreur:", err);
      }
    });
  }

  applyExistingEvaluation() {
    if (this.existingEvaluation && Object.keys(this.evaluationForm.controls).length > 0) {
      Object.keys(this.existingEvaluation.noteParCritere).forEach(key => {
        if (this.evaluationForm.contains(key)) {
          this.evaluationForm.get(key)?.setValue(this.existingEvaluation!.noteParCritere[key]);
          this.evaluationForm.get(key)?.disable();
        }
      });
    }
  }

  loadCriteres() {
    this.isLoading = true;
    this.evaluationService.getCriteres(this.offreId).subscribe({
      next: (data) => {
        this.criteres = data;
        // Build form controls for each criterion
        this.criteres.forEach(c => {
          this.evaluationForm.addControl(c.id, this.fb.control('', [
            Validators.required, 
            Validators.min(0), 
            Validators.max(100)
          ]));
        });
        this.applyExistingEvaluation();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading criteres:', err);
        this.errorMessage = 'Erreur lors du chargement des critères de sélection.';
        this.isLoading = false;
      }
    });
  }

  loadAiScore() {
    this.aiLoading = true;
    this.matchingService.getBestCandidatesForOffer(this.offreId).subscribe({
      next: (results: MatchResult[]) => {
        const match = results.find(r => r.candidateId === this.candidatId);
        if (match) {
          this.aiScore = match.globalScore;
          if (match.details) {
            this.aiDetails = Object.keys(match.details).map(k => ({
              key: k,
              value: match.details[k]
            }));
          }
        }
        this.aiLoading = false;
      },
      error: (err) => {
        console.error('Error loading AI score:', err);
        this.aiLoading = false;
      }
    });
  }

  getPoidsTotal(critere: CritereDeSelection): number {
    if (!critere.categorieDeSelections || critere.categorieDeSelections.length === 0) {
      return 1; // Default fallback from backend
    }
    return critere.categorieDeSelections.reduce((sum, cat) => sum + (cat.poids || 1), 0);
  }

  onSubmit() {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.submitSuccess = false;

    const evaluateurId = this.keycloakService.getCurrentUserId();

    // Map form values to noteParCritere
    const noteParCritere: { [key: string]: number } = {};
    Object.keys(this.evaluationForm.value).forEach(key => {
      noteParCritere[key] = Number(this.evaluationForm.value[key]);
    });

    const request = {
      offreId: this.offreId,
      candidatId: this.candidatId,
      evaluateurId: evaluateurId,
      noteParCritere: noteParCritere
    };

    this.evaluationService.submitEvaluation(request).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        setTimeout(() => {
          this.goBack();
        }, 2000);
      },
      error: (err) => {
        console.error('Error submitting evaluation:', err);
        this.errorMessage = 'Erreur lors de la soumission de l\'évaluation.';
        this.isSubmitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/rankingCandidats', this.offreId]);
  }
}
