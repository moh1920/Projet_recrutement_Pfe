import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ══════════════════════════════════════════════════
// INTERFACES
// ══════════════════════════════════════════════════

export interface ProfileRequestDTO {
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
  gradeAcademique?: string;

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
}

export interface ProfileResponseDTO {
  id: string;
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
  gradeAcademique?: string;

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

// ══════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private readonly BASE_URL = 'http://localhost:8020/profiles_users';

  constructor(private http: HttpClient) {}

  // ── CREATE ──────────────────────────────────────

  createProfile(dto: ProfileRequestDTO): Observable<ProfileResponseDTO> {
    return this.http.post<ProfileResponseDTO>(`${this.BASE_URL}/createProfile`, dto);
  }

  // ── READ ────────────────────────────────────────

  getAllProfiles(): Observable<ProfileResponseDTO[]> {
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/getAllProfiles`);
  }

  getProfileById(id: string): Observable<ProfileResponseDTO> {
    return this.http.get<ProfileResponseDTO>(`${this.BASE_URL}/getProfileById/${id}`);
  }

  getProfileByUserId(userId: string): Observable<ProfileResponseDTO> {
    return this.http.get<ProfileResponseDTO>(`${this.BASE_URL}/getProfileByUserId/${userId}`);
  }

  getProfileByEmail(email: string): Observable<ProfileResponseDTO> {
    return this.http.get<ProfileResponseDTO>(`${this.BASE_URL}/getProfileByEmail/${email}`);
  }

  // ── UPDATE ──────────────────────────────────────

  updateProfile(id: string, dto: ProfileRequestDTO): Observable<ProfileResponseDTO> {
    return this.http.put<ProfileResponseDTO>(`${this.BASE_URL}/updateProfile/${id}`, dto);
  }

  updateCvPath(id: string, cvPath: string): Observable<ProfileResponseDTO> {
    return this.http.patch<ProfileResponseDTO>(
      `${this.BASE_URL}/updateCvPath/${id}`,
      { cvPath }
    );
  }

  // ── DELETE ──────────────────────────────────────

  deleteProfile(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(
      `${this.BASE_URL}/deleteProfile/${id}`
    );
  }

  // ── SEARCH ──────────────────────────────────────

  searchProfiles(keyword: string): Observable<ProfileResponseDTO[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/searchProfiles`, { params });
  }

  // ── FILTERS ─────────────────────────────────────

  filterByLangage(value: string): Observable<ProfileResponseDTO[]> {
    const params = new HttpParams().set('value', value);
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/filterByLangage`, { params });
  }

  filterByFramework(value: string): Observable<ProfileResponseDTO[]> {
    const params = new HttpParams().set('value', value);
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/filterByFramework`, { params });
  }

  filterByExperience(minAnnees: number): Observable<ProfileResponseDTO[]> {
    const params = new HttpParams().set('minAnnees', minAnnees.toString());
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/filterByExperience`, { params });
  }

  filterBySoftSkills(comm = 1, lead = 1, equipe = 1): Observable<ProfileResponseDTO[]> {
    const params = new HttpParams()
      .set('comm', comm.toString())
      .set('lead', lead.toString())
      .set('equipe', equipe.toString());
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/filterBySoftSkills`, { params });
  }

  filterByVille(value: string): Observable<ProfileResponseDTO[]> {
    const params = new HttpParams().set('value', value);
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/filterByVille`, { params });
  }

  filterByModule(value: string): Observable<ProfileResponseDTO[]> {
    const params = new HttpParams().set('value', value);
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/filterByModule`, { params });
  }

  getProfilesWithCV(): Observable<ProfileResponseDTO[]> {
    return this.http.get<ProfileResponseDTO[]>(`${this.BASE_URL}/getProfilesWithCV`);
  }
}
