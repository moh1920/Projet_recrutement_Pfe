import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CandidateService, CandidateDTO, CandidateStatus } from '../../../core/services/candidate.service';
import { MatchingService } from '../../../core/services/matching.service';
import { MatchResult } from '../../../core/models/matching.model';
import { ManualEvaluationService, ManualEvaluation } from '../../../core/services/manual-evaluation.service';

@Component({
  selector: 'app-final-decision',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './final-decision.component.html',
  styleUrl: './final-decision.component.scss'
})
export class FinalDecisionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private candidateService = inject(CandidateService);
  private matchingService = inject(MatchingService);
  private manualEvalService = inject(ManualEvaluationService);

  candidateId: string | null = null;
  offerId: string | null = null;

  candidate: CandidateDTO | null = null;
  matchResult: MatchResult | null = null;
  manualEval: ManualEvaluation | null = null;
  
  loading = true;
  decisionComment = '';
  submittingDecision = false;
  
  toasts: {message: string, type: string}[] = [];

  ngOnInit(): void {
    this.candidateId = this.route.snapshot.paramMap.get('candidateId');
    this.offerId = this.route.snapshot.queryParamMap.get('offerId');

    if (this.candidateId) {
      this.loadData();
    } else {
      this.loading = false;
    }
  }

  loadData(): void {
    this.loading = true;
    
    // Load candidate details
    this.candidateService.getAllCandidatureById(this.candidateId!).subscribe({
      next: (candidates) => {
        if (candidates && candidates.length > 0) {
          this.candidate = candidates[0];
          this.decisionComment = this.candidate.finalComment || '';
          
          // Use the offerId from candidate if missing from URL
          if (!this.offerId && this.candidate.idOffre) {
             this.offerId = this.candidate.idOffre;
          }
          
          // Load steps via /steps endpoint to get scores (getAllCandidature doesn't include score)
          this.candidateService.getSteps(this.candidateId!).subscribe({
            next: (steps) => {
              if (this.candidate) this.candidate.steps = steps;
              if (this.offerId) {
                this.loadMatchingData();
              } else {
                this.loading = false;
              }
            },
            error: () => {
              // If getSteps fails, still proceed with matching
              if (this.offerId) {
                this.loadMatchingData();
              } else {
                this.loading = false;
              }
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading candidate', err);
        this.loading = false;
        this.showToast('Erreur lors du chargement du candidat', 'error');
      }
    });
  }

  loadMatchingData(): void {
    this.matchingService.getBestCandidatesForOffer(this.offerId!).subscribe({
      next: (matches) => {
        // Find the match result for our specific candidate
        const candidateProfileId = this.candidate?.idProfile;
        this.matchResult = matches.find(m => m.candidateId === candidateProfileId) || matches.find(m => m.candidateId === this.candidateId) || null;
        this.loadManualEvaluationData();
      },
      error: (err) => {
        console.error('Error loading matching data', err);
        this.loadManualEvaluationData();
      }
    });
  }

  loadManualEvaluationData(): void {
    if (!this.candidateId) {
      this.loading = false;
      return;
    }
    
    this.manualEvalService.getManualEvaluationByCandidatsId(this.candidateId).subscribe({
      next: (evalData) => {
        if (evalData && evalData.id) {
          this.manualEval = evalData;
        }
        this.loading = false;
      },
      error: (err) => {
        // Ignorer l'erreur 404 si pas d'évaluation
        console.log('Aucune évaluation manuelle ou erreur', err);
        this.loading = false;
      }
    });
  }

  getAverageStepScore(): number {
    if (!this.candidate?.steps || this.candidate.steps.length === 0) return 0;
    const stepsWithScore = this.candidate.steps.filter(s => s.score !== undefined && s.score !== null);
    if (stepsWithScore.length === 0) return 0;
    
    const total = stepsWithScore.reduce((sum, s) => sum + (s.score || 0), 0);
    return total / stepsWithScore.length;
  }

  getAIScore(): number {
    if (this.matchResult) {
      return this.matchResult.globalScore;
    }
    return this.candidate?.aiScore || 0;
  }

  getAppreciationClass(): string {
    if (!this.manualEval?.appreciation) return 'text-muted';
    const lower = this.manualEval.appreciation.toLowerCase();
    if (lower.includes('excellent')) return 'text-success';
    if (lower.includes('bon')) return 'text-primary';
    if (lower.includes('insuffisant')) return 'text-danger';
    return 'text-warning';
  }

  submitDecision(status: string): void {
    if (!this.candidateId) return;

    this.submittingDecision = true;

    this.candidateService.updateStatus(this.candidateId, status).subscribe({
      next: () => {
        this.submittingDecision = false;
        this.showToast(`Décision enregistrée avec succès : ${status}`, 'success');
        
        // Update local state
        if (this.candidate) {
          this.candidate.status = status as CandidateStatus;
          this.candidate.finalComment = this.decisionComment;
        }
        
        setTimeout(() => {
          this.goBack();
        }, 1500);
      },
      error: (err) => {
        console.error('Erreur decision finale', err);
        this.submittingDecision = false;
        this.showToast('Erreur lors de l\'enregistrement de la décision', 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/candidate-progression'], {
      queryParams: { candidateId: this.candidateId }
    });
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = { message, type };
    this.toasts.push(toast);
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t !== toast);
    }, 3500);
  }
}
