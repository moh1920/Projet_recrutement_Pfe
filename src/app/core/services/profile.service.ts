import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ProfileDetails {
  id?: string;
  userId?: string;

  // Informations Personnelles
  nom: string;
  email: string;
  telephone: string;
  nationalite: string;
  ville: string;
  dateNaissance: string;

  // Formation Académique
  niveauDiplome: string;
  specialite: string;
  universite: string;
  anneeDiplome: number;
  gradeAcademique: string;

  // Expérience Professionnelle
  nbAnneesExperience: number;
  experienceAcademique: boolean;
  institutions: string[];
  modulesEnseignes: string[];

  // Compétences Techniques
  langages: string[];
  frameworks: string[];
  dataSkills: string[];
  iaSkills: string[];
  erpSkills: string[];

  // Compétences Pédagogiques
  methodesEnseignement: string[];
  encadrement: boolean;
  innovationPedagogique: boolean;

  // Soft Skills
  communication: number;
  leadership: number;
  espritEquipe: number;
  motivation: string;

  // Documents
  cvPath?: string;
  certificatsPath?: string[];

  // Métadonnées
  dateCreationProfil?: string;
  dateDerniereMiseAJour?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor() { }

  saveProfile(profile: ProfileDetails): Observable<ProfileDetails> {
    // Simuler l'enregistrement
    const savedProfile = {
      ...profile,
      id: Date.now().toString(),
      dateCreationProfil: new Date().toISOString(),
      dateDerniereMiseAJour: new Date().toISOString()
    };
    console.log('Profile saved:', savedProfile);
    return of(savedProfile);
  }

  getProfile(userId: string): Observable<ProfileDetails | null> {
    // Simuler la récupération
    return of(null);
  }

  updateProfile(id: string, profile: Partial<ProfileDetails>): Observable<ProfileDetails> {
    // Simuler la mise à jour
    const updatedProfile = {
      ...profile,
      id,
      dateDerniereMiseAJour: new Date().toISOString()
    } as ProfileDetails;
    console.log('Profile updated:', updatedProfile);
    return of(updatedProfile);
  }
}
