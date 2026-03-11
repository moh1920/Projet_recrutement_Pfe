import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, UserDTO } from '../../../core/services/user.service';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private userService    = inject(UserService);
  private keycloakService = inject(KeycloakService);

  activeTab  = 0;
  isEditing  = false;
  isLoading  = true;

  profileForm!: FormGroup;
  securityForm!: FormGroup;

  // ── Valeur par défaut pour éviter les erreurs avant le chargement ──────────
  user: UserDTO = {
    id:             '',
    keycloakId:     '',
    email:          '',
    firstName:      '',
    lastName:       '',
    role:           '',
    department:     '',
    statusUser:     '' as any,
    dateDeCreation: '',
    phone:          '',
    fullName:       ''
  };

  stats = {
    offersCreated:        12,
    candidatesReviewed:   48,
    interviewsConducted:  24,
    lastActivity:         'Il y a 2 heures'
  };

  activities = [
    { type: 'offer',     title: 'Nouvelle offre créée',  desc: 'Professeur en Intelligence Artificielle',   date: '2024-01-15 10:30', icon: 'work'     },
    { type: 'candidate', title: 'Candidature évaluée',   desc: 'Mohamed Trabelsi - Score: 85/100',           date: '2024-01-14 16:45', icon: 'person'   },
    { type: 'interview', title: 'Entretien réalisé',     desc: 'Fatma Gharbi - Poste: CUP',                  date: '2024-01-14 14:00', icon: 'event'    },
    { type: 'settings',  title: 'Profil mis à jour',     desc: 'Modification des informations personnelles', date: '2024-01-13 09:15', icon: 'settings' },
    { type: 'offer',     title: 'Offre modifiée',        desc: 'Mise à jour des prérequis - Génie Logiciel', date: '2024-01-12 11:20', icon: 'edit'     }
  ];

  roles       = ['CUP', 'Chef de Département', 'Enseignant', 'Admin'];
  departments = ['Informatique', 'Génie Logiciel', 'Intelligence Artificielle', 'Réseaux & Sécurité', 'Data Science'];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForms();       // initialise avec les valeurs vides par défaut
    this.loadUserCurrent(); // charge ensuite les vraies données
  }

  // ── Chargement de l'utilisateur connecté ──────────────────────────────────
  loadUserCurrent(): void {
    const userId = this.keycloakService.getKeycloakInstance().tokenParsed?.['sub'];

    if (!userId) {
      console.warn('Aucun userId Keycloak trouvé.');
      this.isLoading = false;
      return;
    }

    this.userService.getUserById(userId).subscribe({
      next: (data) => {
        this.user      = data;
        this.isLoading = false;
        this.initForms(); // réinitialise le formulaire avec les vraies valeurs
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil :', err);
        this.isLoading = false;
      }
    });
  }

  // ── Formulaires ───────────────────────────────────────────────────────────
  initForms(): void {
    this.profileForm = this.fb.group({
      // "name" est utilisé dans le HTML → on concatène prénom + nom
      name:       [this.user.fullName || `${this.user.firstName} ${this.user.lastName}`.trim(), Validators.required],
      email:      [this.user.email,      [Validators.required, Validators.email]],
      phone:      [this.user.phone,      Validators.required],
      department: [this.user.department, Validators.required],
      address:    [''],
      bio:        ['']
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  // ── Édition ───────────────────────────────────────────────────────────────
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.initForms(); // annulation → restaure les valeurs
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const { email, phone, department } = this.profileForm.value;
      this.user = { ...this.user, email, phone, department };
      this.isEditing = false;
      console.log('Profil sauvegardé :', this.profileForm.value);
    }
  }

  // ── Sécurité ──────────────────────────────────────────────────────────────
  changePassword(): void {
    if (this.securityForm.valid) {
      console.log('Changement de mot de passe');
      this.securityForm.reset();
    }
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  uploadAvatar(): void {
    console.log('Upload avatar');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Retourne l'initiale d'un mot (guard contre null/undefined) */
  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'Admin':               '#DC2626',
      'Chef de Département': '#8B0000',
      'CUP':                 '#D97706',
      'Enseignant':          '#059669'
    };
    return colors[role] ?? '#6B7280';
  }
}
