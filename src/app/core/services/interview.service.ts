
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Interview {
    id: string;
    candidateName: string;
    position: string;
    date: Date;
    time: string;
    jury: string[];
    status: 'Planifié' | 'En cours' | 'Terminé' | 'Annulé';
    meetLink: string;
}

@Injectable({
    providedIn: 'root'
})
export class InterviewService {
    private mockInterviews: Interview[] = [
        {
            id: '1',
            candidateName: 'Rania Mezhoud',
            position: 'Enseignant Web',
            date: new Date('2026-02-15'),
            time: '10:00',
            jury: ['M. Sayari', 'Mme. Ben Foulen'],
            status: 'Planifié',
            meetLink: 'https://meet.google.com/abc-defg-hij'
        },
        {
            id: '2',
            candidateName: 'Ahmed Khelif',
            position: 'Vacataire AI',
            date: new Date('2026-02-15'),
            time: '14:00',
            jury: ['M. Sayari'],
            status: 'Planifié',
            meetLink: 'https://meet.google.com/xyz-uvwx-yz'
        },
        {
            id: '3',
            candidateName: 'Sarra Ben Ali',
            position: 'Docteur Data Science',
            date: new Date('2026-02-14'),
            time: '09:00',
            jury: ['Mme. Directrice', 'M. Chef Dept'],
            status: 'Terminé',
            meetLink: '#'
        }
    ];

    getInterviews(): Observable<Interview[]> {
        return of(this.mockInterviews).pipe(delay(500));
    }
}
