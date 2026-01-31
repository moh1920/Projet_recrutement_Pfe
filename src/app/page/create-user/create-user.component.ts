import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CreateUserRequest} from "../../core/models/create-user-request.model";
import {UserService} from "../../core/services/user.service";

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent {
  createUserForm: FormGroup;
  successMessage = '';
  errorMessage = '';

  roles = ['admin', 'DIRECTEUR', 'CHEF_DEPARTEMENT', 'CUP', 'ENSEIGNANT'];

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.createUserForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  submit() {

    if (this.createUserForm.invalid) {
      return;
    }

    const request: CreateUserRequest = this.createUserForm.value;

    this.userService.createUser(request).subscribe({
      next: () => {
        this.successMessage = 'Utilisateur créé. Email de vérification envoyé.';
        this.errorMessage = '';
        this.createUserForm.reset();
      },
      error: err => {
        this.successMessage = '';
        console.log(err);
      }
    });
  }
}
