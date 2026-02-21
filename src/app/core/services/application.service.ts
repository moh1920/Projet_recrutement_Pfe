import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  getUserApplications(userId: string): Observable<any[]> {
    // Mock data - remplacer par appel API réel
    const applications = [
      {
        id: '1',
        offerId: '101',
        offerTitle: 'Enseignant Chercheur - Intelligence Artificielle',
        department: 'Informatique',
        location: 'Ariana',
        type: 'CDI',
        appliedDate: new Date('2024-01-15'),
        status: 'interview',
        currentStep: 3,
        totalSteps: 5,
        nextStep: 'Entretien technique',
        nextStepDate: new Date('2024-02-20'),
        aiScore: 88,
        lastUpdate: new Date('2024-02-10'),
        messages: 2
      },
      {
        id: '2',
        offerId: '102',
        offerTitle: 'Responsable Pédagogique - Développement Web',
        department: 'Informatique',
        location: 'Ariana',
        type: 'CDI',
        appliedDate: new Date('2024-01-20'),
        status: 'under_review',
        currentStep: 2,
        totalSteps: 5,
        aiScore: 76,
        lastUpdate: new Date('2024-02-05'),
        messages: 0
      },
      {
        id: '3',
        offerId: '103',
        offerTitle: 'Ingénieur de Recherche - IoT',
        department: 'Électronique',
        location: 'Ariana',
        type: 'CDD',
        appliedDate: new Date('2023-12-10'),
        status: 'rejected',
        currentStep: 4,
        totalSteps: 5,
        aiScore: 62,
        lastUpdate: new Date('2024-01-15'),
        messages: 1
      }
    ];

    return of(applications).pipe(delay(500));
  }

  withdrawApplication(applicationId: string): Observable<void> {
    // Appel API pour retirer la candidature
    return of(void 0).pipe(delay(300));
  }
}
