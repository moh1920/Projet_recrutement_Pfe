// categorie-de-selection-admin.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';

// Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AddCategorieDialogComponent } from '../add-categorie-dialog/add-categorie-dialog.component';
import {CategorieDeSelection, CategorieDeSelectionService} from "../../../../core/services/CategorieDeSelectionService";

@Component({
  selector: 'app-categorie-de-selection-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatMenuModule, MatTooltipModule, MatTableModule, MatPaginatorModule, MatSortModule,
  ],
  templateUrl: './categorie-de-selection-admin.component.html',
  styleUrls: ['./categorie-de-selection-admin.component.scss']
})
export class CategorieDeSelectionAdminComponent implements OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  categories: CategorieDeSelection[] = [];
  filteredCategories: CategorieDeSelection[] = [];
  dataSource = new MatTableDataSource<CategorieDeSelection>([]);
  selection = new SelectionModel<CategorieDeSelection>(true, []);

  displayedColumns = ['select', 'nom', 'description', 'poids', 'actions'];
  filters = ['Tous', 'Poids élevé (≥50%)', 'Poids faible (<50%)'];
  selectedFilter = 'Tous';
  searchText = '';
  viewMode: 'grid' | 'table' = 'grid';
  isLoading = false;

  stats = { total: 0, totalPoids: 0 };

  // Palette de couleurs pour les catégories
  private readonly COLORS = [
    '#8B0000', '#1d4ed8', '#15803d', '#c2410c',
    '#6d28d9', '#0e7490', '#b45309', '#be185d',
    '#374151', '#065f46'
  ];

  constructor(
    private categorieService: CategorieDeSelectionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  // ─── Data ────────────────────────────────────────────────────────────────────

  loadCategories(): void {
    this.isLoading = true;
    this.categorieService.getAllCategories(0, 100).subscribe({
      next: (res) => {
        this.categories = res?.content ?? res ?? [];
        this.applyFilter();
        this.updateStats();
        this.dataSource.data = this.filteredCategories;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showSnack('Erreur de chargement', 'error');
      }
    });
  }

  applyFilter(): void {
    let result = [...this.categories];

    if (this.searchText.trim()) {
      const t = this.searchText.toLowerCase();
      result = result.filter(c =>
        c.nom?.toLowerCase().includes(t) ||
        c.description?.toLowerCase().includes(t)
      );
    }

    if (this.selectedFilter === 'Poids élevé (≥50%)') {
      result = result.filter(c => (c.poids ?? 0) >= 50);
    } else if (this.selectedFilter === 'Poids faible (<50%)') {
      result = result.filter(c => (c.poids ?? 0) < 50);
    }

    this.filteredCategories = result;
    this.dataSource.data = result;
    this.updateStats();
  }

  setFilter(f: string): void {
    this.selectedFilter = f;
    this.applyFilter();
  }

  updateStats(): void {
    this.stats.total = this.filteredCategories.length;
    this.stats.totalPoids = this.filteredCategories.reduce((s, c) => s + (c.poids ?? 0), 0);
  }

  // ─── Dialog ──────────────────────────────────────────────────────────────────

  openAddDialog(): void {
    const ref = this.dialog.open(AddCategorieDialogComponent, {
      width: '640px',
      disableClose: true,
      panelClass: 'esprit-dialog',
      data: {}
    });
    ref.afterClosed().subscribe(r => {
      if (r?.success) {
        this.showSnack('Catégorie créée avec succès !', 'success');
        this.loadCategories();
      }
    });
  }

  editCategorie(cat: CategorieDeSelection): void {
    const ref = this.dialog.open(AddCategorieDialogComponent, {
      width: '640px',
      disableClose: true,
      panelClass: 'esprit-dialog',
      data: { categorie: cat }
    });
    ref.afterClosed().subscribe(r => {
      if (r?.success) {
        this.showSnack('Catégorie mise à jour !', 'success');
        this.loadCategories();
      }
    });
  }

  deleteCategorie(cat: CategorieDeSelection): void {
    if (!confirm(`Supprimer "${cat.nom}" ?`)) return;
    this.categorieService.deleteCategorie(cat.id!).subscribe({
      next: () => { this.showSnack('Catégorie supprimée', 'warn'); this.loadCategories(); },
      error: () => this.showSnack('Erreur lors de la suppression', 'error')
    });
  }

  deleteSelected(): void {
    if (!confirm(`Supprimer ${this.selection.selected.length} catégorie(s) ?`)) return;
    const ids = this.selection.selected.map(c => c.id!);
    Promise.all(ids.map(id => this.categorieService.deleteCategorie(id).toPromise()))
      .then(() => {
        this.selection.clear();
        this.showSnack('Catégories supprimées', 'warn');
        this.loadCategories();
      });
  }

  duplicateCategorie(cat: CategorieDeSelection): void {
    const copy = { nom: `${cat.nom} (copie)`, description: cat.description, poids: cat.poids };
    this.categorieService.addCategorie(copy).subscribe({
      next: () => { this.showSnack('Catégorie dupliquée !', 'success'); this.loadCategories(); },
      error: () => this.showSnack('Erreur lors de la duplication', 'error')
    });
  }

  viewOffres(_cat: CategorieDeSelection): void {
    // Navigate to offres filtered by this categorie
    // this.router.navigate(['/admin/offres'], { queryParams: { categorieId: cat.id } });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getCatColor(nom?: string): string {
    const idx = this.categories.findIndex(c => c.nom === nom) % this.COLORS.length;
    return this.COLORS[Math.max(0, idx)];
  }

  getCatColorLight(nom?: string): string {
    const base = this.getCatColor(nom);
    return base + '18';
  }

  getCatIcon(nom?: string): string {
    const n = (nom || '').toLowerCase();
    if (n.includes('tech') || n.includes('inform')) return 'computer';
    if (n.includes('lang') || n.includes('comm')) return 'translate';
    if (n.includes('expé') || n.includes('exper')) return 'work_history';
    if (n.includes('form') || n.includes('dipl')) return 'school';
    if (n.includes('soft') || n.includes('person') || n.includes('comp')) return 'psychology';
    if (n.includes('manage') || n.includes('lead')) return 'manage_accounts';
    if (n.includes('analyti') || n.includes('données')) return 'analytics';
    return 'category';
  }

  // ─── Selection ───────────────────────────────────────────────────────────────

  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(r => this.selection.select(r));
    }
  }

  // ─── Snack ───────────────────────────────────────────────────────────────────

  private showSnack(msg: string, type: 'success' | 'error' | 'warn'): void {
    this.snackBar.open(msg, 'OK', {
      duration: 3500,
      panelClass: type === 'success' ? 'success-snackbar' : type === 'error' ? 'error-snackbar' : 'warning-snackbar'
    });
  }
}
