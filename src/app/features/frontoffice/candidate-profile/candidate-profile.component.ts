import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';
import {
  DocumentResponse,
  ProfileRequestDTO,
  ProfileResponseDTO,
  ProfileService,
} from '../../../core/services/profile.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './candidate-profile.component.html',
  styleUrls: ['./candidate-profile.component.scss'],
})
export class CandidateProfileComponent implements OnInit {
  activeTab: 'overview' | 'edit' | 'documents' | 'stats' = 'overview';
  isEditing = false;
  isLoading = true;
  uploadProgress = 0;
  isUploading = false;
  errorMessage = '';
  documentsResponse: DocumentResponse[] = [];
  profileForm!: FormGroup;
  profileCurrent!: ProfileResponseDTO;

  // Documents (gérés séparément, pas dans ProfileResponseDTO)
  documents: { name: string; size: string; date: string; type: string }[] = [];

  stats = {
    profileViews: 0,
    applications: 0,
    interviewRate: 0,
    responseRate: 0,
    profileCompletion: 0,
  };

  loadCertificate() {}

  skillCategories = ['Langages', 'Frameworks', 'Data', 'IA', 'ERP'];

  keycloakService = inject(KeycloakService);
  profileService = inject(ProfileService);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  // ── LOAD ────────────────────────────────────────

  loadProfile(): void {
    const userId = this.keycloakService.getKeycloakInstance().tokenParsed?.sub;
    if (userId) {
      this.profileService.getProfileByUserId(userId).subscribe({
        next: (data) => {
          this.profileCurrent = data;
          this.stats.profileCompletion = this.computeCompletion(data);

          this.initForm();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    }
  }

  // ── FORM ────────────────────────────────────────

  initForm(): void {
    const p = this.profileCurrent;
    this.profileForm = this.fb.group({
      // Informations Personnelles
      nom: [p?.nom || '', Validators.required],
      email: [p?.email || '', [Validators.required, Validators.email]],
      telephone: [p?.telephone || '', Validators.required],
      nationalite: [p?.nationalite || ''],
      ville: [p?.ville || ''],
      dateNaissance: [p?.dateNaissance || ''],

      // Formation Académique
      niveauDiplome: [p?.niveauDiplome || ''],
      specialite: [p?.specialite || ''],
      universite: [p?.universite || ''],
      anneeDiplome: [p?.anneeDiplome || null],
      gradeAcademique: [p?.gradeAcademique || ''],

      // Expérience Professionnelle
      nbAnneesExperience: [p?.nbAnneesExperience ?? 0],
      experienceAcademique: [p?.experienceAcademique ?? false],

      // Soft Skills
      communication: [p?.communication ?? 1, [Validators.min(1), Validators.max(5)]],
      leadership: [p?.leadership ?? 1, [Validators.min(1), Validators.max(5)]],
      espritEquipe: [p?.espritEquipe ?? 1, [Validators.min(1), Validators.max(5)]],
      motivation: [p?.motivation || ''],

      // Pédagogie
      encadrement: [p?.encadrement ?? false],
      innovationPedagogique: [p?.innovationPedagogique ?? false],
    });
  }

  onSubmit(): void {
    if (!this.profileForm.valid || !this.profileCurrent?.id) return;

    const dto: ProfileRequestDTO = {
      ...this.profileForm.value,
      userId: this.profileCurrent.userId,
      institutions: this.profileCurrent.institutions || [],
      modulesEnseignes: this.profileCurrent.modulesEnseignes || [],
      langages: this.profileCurrent.langages || [],
      frameworks: this.profileCurrent.frameworks || [],
      dataSkills: this.profileCurrent.dataSkills || [],
      iaSkills: this.profileCurrent.iaSkills || [],
      erpSkills: this.profileCurrent.erpSkills || [],
      methodesEnseignement: this.profileCurrent.methodesEnseignement || [],
    };

    this.profileService.updateProfile(this.profileCurrent.id, dto).subscribe({
      next: (updated) => {
        this.profileCurrent = updated;
        this.stats.profileCompletion = this.computeCompletion(updated);
        this.setActiveTab('overview');
      },
    });
  }

  cancelEdit(): void {
    this.initForm();
    this.setActiveTab('overview');
  }

  // ── TABS ────────────────────────────────────────

  setActiveTab(tab: 'overview' | 'edit' | 'documents' | 'stats'): void {
    this.activeTab = tab;
    this.isEditing = tab === 'edit';
  }

  // ── DOCUMENTS ───────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      console.warn('No file selected');
      return;
    }
    const file: File = input.files[0];
    this.profileService.uploadCV(this.profileCurrent.id, file).subscribe({
      next: (res) => {
        console.log('Upload success', res);
      },
      error: (err) => {
        console.error('Upload failed', err);
      },
    });
  }
  deleteDocument(doc: any): void {
    if (confirm(`Supprimer ${doc.name} ?`)) {
      this.documents = this.documents.filter((d) => d !== doc);
    }
  }

  downloadDocument(doc: any): void {
    console.log('Téléchargement:', doc.name);
  }

  // ── HELPERS ─────────────────────────────────────

  getInitials(): string {
    if (!this.profileCurrent?.nom) return '?';
    const parts = this.profileCurrent.nom.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  getCompletionColor(): string {
    const v = this.stats.profileCompletion;
    if (v >= 80) return '#22c55e';
    if (v >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getSkillLevelText(level: number): string {
    return (
      ['Débutant', 'Intermédiaire', 'Avancé', 'Expert', 'Maître'][level - 1] || 'Intermédiaire'
    );
  }

  private computeCompletion(p: ProfileResponseDTO): number {
    const checks = [
      !!p.nom,
      !!p.email,
      !!p.telephone,
      !!p.ville,
      !!p.specialite,
      !!p.universite,
      !!p.niveauDiplome,
      p.nbAnneesExperience > 0,
      (p.langages?.length || 0) > 0,
      (p.frameworks?.length || 0) > 0,
      !!p.motivation,
      !!p.cvPath,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  // Helpers pour afficher les tableaux sous forme de string
  join(arr: string[] | undefined): string {
    return arr?.join(', ') || '—';
  }
}
