import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment";
import {Offre} from "../models/offre.model";



export interface StructuredBreakdown {
  educationScore: number;
  experienceYearsScore: number;
  academicExperienceScore: number;
  skillsMatchScore: number;
  modulesAlignmentScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedModules: string[];
}

export interface EvaluationResult {
  candidateName: string;
  offerTitle: string;
  semanticScore: number;
  skillsScore: number;
  structuredScore: number;
  llmScore: number;
  globalScore: number;
  grade: string;
  matchedSkills: string[];
  missingSkills: string[];
  llmAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  structuredBreakdown: StructuredBreakdown;
  cvJson?: any;
}

@Injectable({
  providedIn: 'root',
})
export class CvAnalysisService {
  private readonly apiUrl = `${environment.apiUrlFastApi}/api/v2/evaluate-cv-file`;

  constructor(private http: HttpClient) {}

  evaluateCvFile(file: File, offerJson: object): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('offer_json', JSON.stringify(offerJson));

    return this.http.post<any>(this.apiUrl, formData);
  }
  /**
   * Option A : Évaluation intelligente en UPLOADING un fichier CV (PDF, DOCX, etc.)
   * Endpoint: POST /api/v4/smart-evaluate-file
   */
  smartEvaluateFile(file: File, jobOffer: object): Observable<EvaluationResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    // Notez bien le nom du champ 'jobOffer' attendu par l'API FastAPI v4
    formData.append('jobOffer', JSON.stringify(jobOffer));
    return this.http.post<EvaluationResult>(
      `${environment.apiUrlFastApi}/api/v4/smart-evaluate-file`,
      formData
    );
  }
  /**
   * Option B : Évaluation intelligente directe via JSON (si le texte du CV est déjà extrait)
   * Endpoint: POST /api/v4/smart-evaluate
   */
  smartEvaluateJson(cvText: string, jobOffer: object): Observable<any> {
    const payload = {
      jobOffer: jobOffer,
      cvText: cvText
    };
    return this.http.post<any>(
      `${environment.apiUrlFastApi}/api/v4/smart-evaluate`,
      payload
    );
  }
}
