// add-categorie-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategorieDeSelection, CategorieDeSelectionService } from '../../../../core/services/CategorieDeSelectionService';

export interface AddCategorieDialogData {
  categorie?: CategorieDeSelection;
}

@Component({
  selector: 'app-add-categorie-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSliderModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-categorie-dialog.component.html',
  styleUrls: ['./add-categorie-dialog.component.scss']
})
export class AddCategorieDialogComponent implements OnInit {

  categorieForm!: FormGroup;
  isEditMode = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddCategorieDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddCategorieDialogData,
    private categorieService: CategorieDeSelectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.categorie;

    this.categorieForm = this.fb.group({
      nom: [
        this.data?.categorie?.nom || '',
        [Validators.required, Validators.minLength(3)]
      ],
      description: [
        this.data?.categorie?.description || '',
        [Validators.maxLength(200)]
      ],
      poids: [
        this.data?.categorie?.poids ?? 50,
        [Validators.required, Validators.min(0), Validators.max(100)]
      ]
    });
  }

  onSave(): void {
    if (this.categorieForm.invalid) return;
    this.isSaving = true;

    const payload: CategorieDeSelection = this.categorieForm.value;

    const save$ = this.isEditMode
      ? this.categorieService.updateCategorie(this.data.categorie!.id!, payload)
      : this.categorieService.addCategorie(payload);

    save$.subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.snackBar.open(
          this.isEditMode ? '✓ Catégorie mise à jour !' : '✓ Catégorie créée avec succès !',
          'OK',
          { duration: 3500, panelClass: 'success-snackbar' }
        );
        this.dialogRef.close({ success: true, categorie: saved });
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open("Erreur lors de l'enregistrement", 'Fermer', {
          duration: 3500,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
