import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ScoreBreakdownItem {
  score: number;
  max: number;
  comment?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchedModules?: string[];
}

export interface EvaluationResult {
  candidateName: string;
  offerTitle: string;
  globalScore: number;
  grade: string;
  breakdown: {
    educationLevel: ScoreBreakdownItem;
    skillsMatch: ScoreBreakdownItem;
    experience: ScoreBreakdownItem;
    academicExperience: ScoreBreakdownItem;
    modulesAlignment: ScoreBreakdownItem;
    specialityFit: ScoreBreakdownItem;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class CvAnalysisService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api/v2/evaluate-cv-file';

  constructor(private http: HttpClient) {}

  evaluateCvFile(file: File, offerJson: object): Observable<EvaluationResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('offer_json', JSON.stringify(offerJson));

    return this.http.post<EvaluationResult>(this.apiUrl, formData);
  }
}
