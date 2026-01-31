import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {CategorieDeSelection} from "../../../core/models/categorie-de-selection.model";
import {CategorieDeSelectionService} from "../../../core/services/categorie-de-selection.service";


@Component({
  selector: 'app-categorie-de-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorie-de-selection.component.html',
  styleUrls: ['./categorie-de-selection.component.scss']
})
export class CategorieDeSelectionComponent implements OnInit {

  categories: CategorieDeSelection[] = [];
  page = 0;
  size = 5;
  totalPages = 0;
  loading = false;

  // Modal
  showEditModal = false;
  selectedCategorieId!: string;
  editForm!: FormGroup;

  constructor(
    private categorieService: CategorieDeSelectionService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      nom: [''],
      description: [''],
      poids: [0]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categorieService.getAllCategories(this.page, this.size).subscribe({
      next: (data) => {
        this.categories = data.content;
        this.totalPages = data.totalPages;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadCategories();
    }
  }

  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadCategories();
    }
  }

  openEditModal(cat: CategorieDeSelection): void {
    this.selectedCategorieId = cat.id!;
    this.showEditModal = true;

    this.editForm.patchValue(cat);
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  updateCategorie(): void {
    this.categorieService
      .updateCategorie(this.selectedCategorieId, this.editForm.value)
      .subscribe({
        next: () => {
          this.loadCategories();
          this.closeEditModal();
        },
        error: err => console.error(err)
      });
  }

  deleteCategorie(id?: string): void {
    if (!id) return;

    if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      this.categorieService.deleteCategorie(id).subscribe({
        next: () => this.loadCategories(),
        error: err => console.error(err)
      });
    }
  }
}
