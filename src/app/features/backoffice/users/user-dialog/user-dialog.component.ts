import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { CreateUserRequest } from '../../../../core/models/create-user-request.model';

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
    ReactiveFormsModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
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

  constructor() {
    this.createUserForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],

      userName: ['', Validators.required],   // ⚠️ respecter backend
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],

      role: ['', Validators.required],

      department: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],

      statusUser: ['ACTIF', Validators.required]
    });

  }

  formatRole(role: string): string {
    const map: { [key: string]: string } = {
      'admin': 'Administrateur',
      'DIRECTEUR': 'Directeur',
      'CHEF_DEPARTEMENT': 'Chef de Département',
      'CUP': 'CUP',
      'ENSEIGNANT': 'Enseignant'
    };
    return map[role] || role;
  }

  submit() {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
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
      }
    });
  }
}
