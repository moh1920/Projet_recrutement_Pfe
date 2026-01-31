import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CriteresDeSelection } from '../../../core/models/criteres-de-selection.model';
import { CategorieDeSelection } from '../../../core/models/categorie-de-selection.model';

import { CriteresDeSelectionService } from '../../../core/services/criteres-de-selection.service';
import { CategorieDeSelectionService } from '../../../core/services/categorie-de-selection.service';

@Component({
  selector: 'app-critere-de-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './critere-de-selection.component.html',
  styleUrls: ['./critere-de-selection.component.scss']
})
export class CritereDeSelectionComponent implements OnInit {

  criteres: CriteresDeSelection[] = [];
  categories: CategorieDeSelection[] = [];

  page = 0;
  size = 5;
  totalPages = 0;
  loading = false;

  showEditModal = false;
  showAffecterModal = false;

  selectedCritereId!: string;
  critereSelectionne!: CriteresDeSelection;

  selectedCategories: string[] = [];

  editForm!: FormGroup;

  constructor(
    private criteresService: CriteresDeSelectionService,
    private categorieService: CategorieDeSelectionService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      nom: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCriteres();
  }

  /* ================= CRUD ================= */

  loadCriteres(): void {
    this.loading = true;
    this.criteresService.getAllCriteres(this.page, this.size).subscribe({
      next: data => {
        this.criteres = data.content;
        this.totalPages = data.totalPages;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadCriteres();
    }
  }

  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadCriteres();
    }
  }

  deleteCritere(id?: string): void {
    if (!id || !confirm('Supprimer ce critère ?')) return;

    this.criteresService.deleteCritere(id).subscribe({
      next: () => this.loadCriteres()
    });
  }

  /* ================= MODIFIER ================= */

  openEditModal(critere: CriteresDeSelection): void {
    this.selectedCritereId = critere.id!;
    this.editForm.patchValue(critere);
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  updateCritere(): void {
    const critere = {
      id: this.selectedCritereId,
      ...this.editForm.value
    };

    this.criteresService.createCritere(critere).subscribe({
      next: () => {
        this.loadCriteres();
        this.closeEditModal();
      }
    });
  }

  /* ================= CATEGORIES ================= */

  openAffecterCategoriesModal(critere: CriteresDeSelection): void {
    this.critereSelectionne = critere;
    this.selectedCategories = critere.categorieDeSelections
      ? critere.categorieDeSelections.map(c => c.id!)
      : [];

    this.loadCategories();
    this.showAffecterModal = true;
  }

  closeAffecterModal(): void {
    this.showAffecterModal = false;
  }

  loadCategories(): void {
    this.categorieService.getAllCategories(0, 20).subscribe({
      next: data => this.categories = data.content
    });
  }

  toggleCategorie(id: string): void {
    if (this.selectedCategories.includes(id)) {
      this.selectedCategories =
        this.selectedCategories.filter(c => c !== id);
    } else {
      this.selectedCategories.push(id);
    }
  }

  isCategorieSelected(id: string): boolean {
    return this.selectedCategories.includes(id);
  }

  affecterCategories(): void {
    this.criteresService
      .affecterCategories(this.critereSelectionne.id!, this.selectedCategories)
      .subscribe({
        next: () => {
          this.loadCriteres();
          this.closeAffecterModal();
        }
      });
  }
  getCategorieNoms(critere: any): string {
    return critere.categorieDeSelections
      ?.map((c: any) => c.nom)
      .join(', ');
  }
}
