import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserDTO, UserService } from '../../../../core/services/user.service';
import { CreateUserRequest } from '../../../../core/models/create-user-request.model';
import { User } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
})
export class UserDialogComponent {
  createUserForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  hidePassword = true;

  roles = ['admin', 'DIRECTEUR', 'CHEF_DEPARTEMENT', 'CUP', 'ENSEIGNANT'];

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);
  data: UserDTO | null = inject(MAT_DIALOG_DATA); // injected user for edit, null for create

  isEditMode = false;

  constructor() {
    this.isEditMode = !!this.data;

    this.createUserForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required],
      department: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      statusUser: ['Actif', Validators.required],
    });
    // Patch form with existing user data in edit mode
    if (this.isEditMode && this.data) {
      this.createUserForm.patchValue({
        firstName: this.data.firstName,
        lastName: this.data.lastName,
        userName: this.data.fullName,
        email: this.data.email,
        role: this.data.role,
        department: this.data.department,
        phone: this.data.phone,
        statusUser: this.data.statusUser,
      });
    }
  }

  formatRole(role: string): string {
    const map: { [key: string]: string } = {
      admin: 'Administrateur',
      DIRECTEUR: 'Directeur',
      CHEF_DEPARTEMENT: 'Chef de Département',
      CUP: 'CUP',
      ENSEIGNANT: 'Enseignant',
    };
    return map[role] || role;
  }

  submit() {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.data) {
      // ── EDIT MODE ──
      const userDTO = this.createUserForm.value;
      this.userService.updateUser(this.data.keycloakId, userDTO).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Utilisateur modifié avec succès';
          setTimeout(() => this.dialogRef.close(true), 1500);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Erreur lors de la modification';
        },
      });
    } else {
      // ── CREATE MODE ──
      const request: CreateUserRequest = this.createUserForm.value;
      this.userService.createUser(request).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Utilisateur créé avec succès';
          setTimeout(() => this.dialogRef.close(true), 1500);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Erreur lors de la création';
        },
      });
    }
  }
}
