
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface JobOffer {
  benefits?: any;
  deadline?: any;
  salary?: any;
  experience?: any;
  featured?: any;
  id: string;
  title: string;
  department: string;
  type: 'Full-Time' | 'Part-Time' | 'Vacitaire';
  location: string;
  description: string;
  requirements: string[];
  postedDate: Date;
  status: 'Active' | 'Draft' | 'Closed';
  candidateCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class JobOfferService {

    private mockOffers: JobOffer[] = [
        {
            id: '1',
            title: 'Enseignant Permanent - Génie Logiciel',
            department: 'Informatique',
            type: 'Full-Time',
            location: 'ESPRIT Ghazela',
            description: 'Nous recherchons un docteur en informatique pour assurer des cours de développement avancé et encadrer des PFE.',
            requirements: ['Doctorat en Informatique', 'Expérience académique > 2 ans', 'Maîtrise de Spring Boot & Angular'],
            postedDate: new Date('2026-01-15'),
            status: 'Active',
            candidateCount: 12
        },
        {
            id: '2',
            title: 'Vacataire - Intelligence Artificielle',
            department: 'Data Science',
            type: 'Vacitaire',
            location: 'ESPRIT Charguia',
            description: 'Expert industriel recherché pour un module de Deep Learning (30h).',
            requirements: ['Expertise en PyTorch/TensorFlow', 'Expérience professionnelle significative'],
            postedDate: new Date('2026-02-01'),
            status: 'Active',
            candidateCount: 5
        },
        {
            id: '3',
            title: 'Enseignant Chercheur - Cybersécurité',
            department: 'Sécurité',
            type: 'Full-Time',
            location: 'ESPRIT Ghazela',
            description: 'Contribution aux activités du laboratoire de recherche et enseignement en sécurité réseaux.',
            requirements: ['Publications indexées', 'Certification CISSP souhaitée'],
            postedDate: new Date('2026-01-20'),
            status: 'Closed',
            candidateCount: 8
        }
    ];

    constructor() { }

    getOffers(): Observable<JobOffer[]> {
        return of(this.mockOffers).pipe(delay(500)); // Simulate API latency
    }

    getOfferById(id: string): Observable<JobOffer | undefined> {
        const offer = this.mockOffers.find(o => o.id === id);
        return of(offer).pipe(delay(300));
    }

  addOffer(result: any) {

  }

  deleteOffer(id: string) {

  }

  updateOffer(id: string, param2: { featured: boolean }) {

  }
  updateOfferS(id: string, param2: { status: string }) {

  }




}
