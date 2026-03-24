import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CvExtractionResult {
    // Information personnelles
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    localisation?: string;
    liens?: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
    };

    // Compétences
    competences?: {
        techniques?: string[];
        soft_skills?: string[];
        outils?: string[];
    };

    // Education
    education?: Array<{
        diplome?: string;
        etablissement?: string;
        date_debut?: string;
        date_fin?: string;
        description?: string;
    }>;

    // Expérience
    experience_professionnelle?: Array<{
        poste?: string;
        entreprise?: string;
        date_debut?: string;
        date_fin?: string;
        description?: string;
    }>;

    // Langues
    langues?: Array<{
        langue?: string;
        niveau?: string;
    }>;

    // Added based on Python model output schema expectation
    PER?: string[];
    EMAIL?: string[];
    PHONE?: string[];
    LOC?: string[];
    SKILL?: string[];
    JOB?: string[];
    ORG?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class CvExtractionService {
    // Update this to point to your FastAPI server if different
    private readonly apiUrl = 'http://127.0.0.1:8000/api/v2/extract-cv-file-llm';

    constructor(private http: HttpClient) { }

    /**
     * Envoie un fichier CV (PDF/DOCX) pour extraction NER/LLM
     */
    extractCv(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<any>(this.apiUrl, formData);
    }
}
