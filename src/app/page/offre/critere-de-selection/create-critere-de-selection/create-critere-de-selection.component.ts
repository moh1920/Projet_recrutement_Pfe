import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {CriteresDeSelectionService} from "../../../../core/services/criteres-de-selection.service";
import {CriteresDeSelection} from "../../../../core/models/criteres-de-selection.model";

@Component({
  selector: 'app-create-critere-de-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-critere-de-selection.component.html',
  styleUrls: ['./create-critere-de-selection.component.scss']
})
export class CreateCritereDeSelectionComponent {

  critereForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private criteresService: CriteresDeSelectionService
  ) {
    this.critereForm = this.fb.group({
      nom: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  create(): void {
    if (this.critereForm.invalid) {
      this.critereForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const critere: CriteresDeSelection = this.critereForm.value;

    this.criteresService.createCritere(critere).subscribe({
      next: () => {
        this.successMessage = 'Critère créé avec succès ✅';
        this.critereForm.reset();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la création du critère ❌';
        this.loading = false;
      }
    });
  }
}
