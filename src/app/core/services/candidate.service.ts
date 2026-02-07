
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Candidate {
    id: string;
    name: string;
    email: string;
    phone: string;
    specialty: string;
    experience: number;
    score: number;
    status: 'Nouveau' | 'Analysé' | 'Entretien' | 'Admis' | 'Rejeté';
    appliedDate: Date;
}

@Injectable({
    providedIn: 'root'
})
export class CandidateService {
    private mockCandidates: Candidate[] = [
        {
            id: '1',
            name: 'Sahbi Omri',
            email: 'sahbi.omri@gmail.com',
            phone: '+216 55 123 456',
            specialty: 'Intelligence Artificielle',
            experience: 5,
            score: 92,
            status: 'Admis',
            appliedDate: new Date('2026-01-10')
        },
        {
            id: '2',
            name: 'Rania Mezhoud',
            email: 'rania.m@outlook.fr',
            phone: '+216 22 987 654',
            specialty: 'Web Development',
            experience: 2,
            score: 78,
            status: 'Entretien',
            appliedDate: new Date('2026-01-12')
        },
        {
            id: '3',
            name: 'Karim Ben Saleh',
            email: 'karim.bs@yahoo.com',
            phone: '+216 99 111 222',
            specialty: 'Data Science',
            experience: 4,
            score: 85,
            status: 'Analysé',
            appliedDate: new Date('2026-01-15')
        },
        {
            id: '4',
            name: 'Amel Tounsi',
            email: 'amel.t@esprit.tn',
            phone: '+216 50 333 444',
            specialty: 'Cyber Security',
            experience: 1,
            score: 60,
            status: 'Rejeté',
            appliedDate: new Date('2026-01-18')
        },
        {
            id: '5',
            name: 'Youssef Gargouri',
            email: 'youssef.g@gmail.com',
            phone: '+216 52 555 666',
            specialty: 'DevOps',
            experience: 3,
            score: 72,
            status: 'Nouveau',
            appliedDate: new Date('2026-01-20')
        }
    ];

    getCandidates(): Observable<Candidate[]> {
        return of(this.mockCandidates).pipe(delay(500));
    }

    deleteCandidate(id: string): Observable<boolean> {
        this.mockCandidates = this.mockCandidates.filter(c => c.id !== id);
        return of(true).pipe(delay(500));
    }
}
