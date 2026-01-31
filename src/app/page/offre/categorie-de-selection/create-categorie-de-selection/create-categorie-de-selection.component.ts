import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {CategorieDeSelectionService} from "../../../../core/services/categorie-de-selection.service";
import {CategorieDeSelection} from "../../../../core/models/categorie-de-selection.model";


@Component({
  selector: 'app-create-categorie-de-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-categorie-de-selection.component.html',
  styleUrls: ['./create-categorie-de-selection.component.scss']
})
export class CreateCategorieDeSelectionComponent {

  categorieForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private categorieService: CategorieDeSelectionService
  ) {
    this.categorieForm = this.fb.group({
      nom: ['', Validators.required],
      description: ['', Validators.required],
      poids: [0, [Validators.required, Validators.min(0)]]
    });
  }

  create(): void {
    if (this.categorieForm.invalid) {
      this.categorieForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const categorie: CategorieDeSelection = this.categorieForm.value;

    this.categorieService.addCategorie(categorie).subscribe({
      next: () => {
        this.successMessage = 'Catégorie créée avec succès ✅';
        this.categorieForm.reset({ poids: 0 });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la création de la catégorie ❌';
        this.loading = false;
      }
    });
  }
}
