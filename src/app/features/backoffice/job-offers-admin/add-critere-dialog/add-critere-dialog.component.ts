// add-critere-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CriteresDeSelection, CriteresDeSelectionService } from '../../../../core/services/CriteresDeSelectionService';
import { CategorieDeSelection, CategorieDeSelectionService } from '../../../../core/services/CategorieDeSelectionService';

export interface AddCritereDialogData {
  critere?: CriteresDeSelection;
}

@Component({
  selector: 'app-add-critere-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatStepperModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './add-critere-dialog.component.html',
  styleUrls: ['./add-critere-dialog.component.scss']
})
export class AddCritereDialogComponent implements OnInit {

  critereForm!: FormGroup;
  isEditMode = false;

  // Catégories for affectation
  allCategories: CategorieDeSelection[] = [];
  filteredCategories: CategorieDeSelection[] = [];
  selectedCategories: CategorieDeSelection[] = [];
  categorieSearch = '';
  isLoadingCategories = false;
  isSaving = false;

  // Palette de couleurs pour les catégories
  private readonly COLORS = [
    '#8B0000', '#1d4ed8', '#15803d', '#c2410c',
    '#6d28d9', '#0e7490', '#b45309', '#be185d',
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddCritereDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddCritereDialogData,
    private critereService: CriteresDeSelectionService,
    private categorieService: CategorieDeSelectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.critere;

    this.critereForm = this.fb.group({
      nom: [
        this.data?.critere?.nom || '',
        [Validators.required, Validators.minLength(3)]
      ],
      description: [
        this.data?.critere?.description || '',
        [Validators.required, Validators.maxLength(300)]
      ]
    });

    this.loadCategories();
  }

  // ─── Load categories ──────────────────────────────────────────────────────────

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categorieService.getAllCategories(0, 100).subscribe({
      next: (res) => {
        this.allCategories = res?.content ?? res ?? [];
        this.filteredCategories = [...this.allCategories];

        // Si édition, pré-sélectionner les catégories déjà affectées
        if (this.isEditMode && this.data.critere?.categorieDeSelections?.length) {
          this.selectedCategories = this.allCategories.filter(cat =>
            this.data.critere!.categorieDeSelections!.some((c: any) => c.id === cat.id)
          );
        }

        this.isLoadingCategories = false;
      },
      error: () => {
        this.isLoadingCategories = false;
        this.snackBar.open('Erreur lors du chargement des catégories', 'Fermer', { duration: 3000 });
      }
    });
  }

  filterCategories(): void {
    const t = this.categorieSearch.toLowerCase().trim();
    this.filteredCategories = t
      ? this.allCategories.filter(c =>
        c.nom?.toLowerCase().includes(t) || c.description?.toLowerCase().includes(t)
      )
      : [...this.allCategories];
  }

  // ─── Categorie selection ──────────────────────────────────────────────────────

  isCategorieSelected(id?: string): boolean {
    return this.selectedCategories.some(c => c.id === id);
  }

  toggleCategorie(cat: CategorieDeSelection): void {
    if (this.isCategorieSelected(cat.id)) {
      this.selectedCategories = this.selectedCategories.filter(c => c.id !== cat.id);
    } else {
      this.selectedCategories.push(cat);
    }
  }

  isAllCategoriesSelected(): boolean {
    return this.filteredCategories.length > 0 &&
      this.filteredCategories.every(c => this.isCategorieSelected(c.id));
  }

  toggleAllCategories(checked: boolean): void {
    if (checked) {
      this.filteredCategories.forEach(c => {
        if (!this.isCategorieSelected(c.id)) this.selectedCategories.push(c);
      });
    } else {
      this.selectedCategories = this.selectedCategories.filter(
        s => !this.filteredCategories.some(f => f.id === s.id)
      );
    }
  }

  clearCategoriesSelection(): void {
    this.selectedCategories = [];
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────

  onSaveWithoutAffectation(): void {
    this._save([]);
  }

  onSave(): void {
    this._save(this.selectedCategories);
  }

  private _save(categoriesToAffect: CategorieDeSelection[]): void {
    if (this.critereForm.invalid) return;
    this.isSaving = true;

    const payload: CriteresDeSelection = this.critereForm.value;

    // Créer le critère
    const save$ = this.critereService.createCritere(payload);

    save$.subscribe({
      next: (savedCritere) => {
        if (categoriesToAffect.length > 0 && savedCritere.id) {
          // Affecter les catégories sélectionnées au critère créé
          const idCategories = categoriesToAffect.map(c => c.id!);

          this.critereService.affecterCategories(savedCritere.id, idCategories).subscribe({
            next: () => {
              this.isSaving = false;
              this.showSnack(
                `✓ Critère enregistré et affecté à ${categoriesToAffect.length} catégorie(s)`,
                'success'
              );
              this.dialogRef.close({ success: true, critere: savedCritere });
            },
            error: () => {
              this.isSaving = false;
              this.showSnack('Critère enregistré, erreur lors des affectations', 'warn');
              this.dialogRef.close({ success: true, critere: savedCritere });
            }
          });
        } else {
          this.isSaving = false;
          this.showSnack('✓ Critère créé avec succès !', 'success');
          this.dialogRef.close({ success: true, critere: savedCritere });
        }
      },
      error: () => {
        this.isSaving = false;
        this.showSnack("Erreur lors de l'enregistrement", 'error');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  // ─── Helpers couleurs ─────────────────────────────────────────────────────────

  getCatColor(nom?: string): string {
    const idx = this.allCategories.findIndex(c => c.nom === nom) % this.COLORS.length;
    return this.COLORS[Math.max(0, idx)];
  }

  getCatColorLight(nom?: string): string {
    const base = this.getCatColor(nom);
    // version plus claire de la même couleur
    return base + 'cc';
  }

  private showSnack(msg: string, type: 'success' | 'error' | 'warn'): void {
    this.snackBar.open(msg, 'OK', {
      duration: 4000,
      panelClass:
        type === 'success' ? 'success-snackbar' :
          type === 'error'   ? 'error-snackbar'   : 'warning-snackbar'
    });
  }
}
