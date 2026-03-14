// critere-de-selection-admin.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CriteresDeSelection, CriteresDeSelectionService } from '../../../../core/services/CriteresDeSelectionService';
import {AddCritereDialogComponent} from "../add-critere-dialog/add-critere-dialog.component";

@Component({
  selector: 'app-critere-de-selection-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatMenuModule, MatTooltipModule, MatTableModule, MatPaginatorModule, MatSortModule,
  ],
  templateUrl: './critere-de-selection-admin.component.html',
  styleUrls: ['./critere-de-selection-admin.component.scss']
})
export class CritereDeSelectionAdminComponent implements OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  criteres: CriteresDeSelection[] = [];
  filteredCriteres: CriteresDeSelection[] = [];
  dataSource = new MatTableDataSource<CriteresDeSelection>([]);
  selection = new SelectionModel<CriteresDeSelection>(true, []);

  displayedColumns = ['select', 'nom', 'description', 'categories', 'actions'];
  filters = ['Tous', 'Affectés', 'Non affectés'];
  selectedFilter = 'Tous';
  searchText = '';
  viewMode: 'grid' | 'table' = 'grid';
  isLoading = false;

  stats = { total: 0, avecCategories: 0 };

  constructor(
    private critereService: CriteresDeSelectionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCriteres();
  }

  // ─── Data ─────────────────────────────────────────────────────────────────────

  loadCriteres(): void {
    this.isLoading = true;
    this.critereService.getAllCriteres(0, 100).subscribe({
      next: (res) => {
        this.criteres = res?.content ?? res ?? [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showSnack('Erreur de chargement', 'error');
      }
    });
  }

  applyFilter(): void {
    let result = [...this.criteres];

    if (this.searchText.trim()) {
      const t = this.searchText.toLowerCase();
      result = result.filter(c =>
        c.nom?.toLowerCase().includes(t) ||
        c.description?.toLowerCase().includes(t)
      );
    }

    if (this.selectedFilter === 'Affectés') {
      result = result.filter(c => this.getCategoriesCount(c) > 0);
    } else if (this.selectedFilter === 'Non affectés') {
      result = result.filter(c => this.getCategoriesCount(c) === 0);
    }

    this.filteredCriteres = result;
    this.dataSource.data = result;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.updateStats();
  }

  setFilter(f: string): void {
    this.selectedFilter = f;
    this.applyFilter();
  }

  updateStats(): void {
    this.stats.total = this.criteres.length;
    this.stats.avecCategories = this.criteres.filter(c => this.getCategoriesCount(c) > 0).length;
  }

  // ─── Dialog ───────────────────────────────────────────────────────────────────

  openAddDialog(): void {
    const ref = this.dialog.open(AddCritereDialogComponent, {
      width: '640px',
      disableClose: true,
      panelClass: 'esprit-dialog',
      data: {}
    });
    ref.afterClosed().subscribe(r => {
      if (r?.success) {
        this.showSnack('Critère créé avec succès !', 'success');
        this.loadCriteres();
      }
    });
  }

  editCritere(critere: CriteresDeSelection): void {
    const ref = this.dialog.open(AddCritereDialogComponent, {
      width: '640px',
      disableClose: true,
      panelClass: 'esprit-dialog',
      data: { critere }
    });
    ref.afterClosed().subscribe(r => {
      if (r?.success) {
        this.showSnack('Critère mis à jour !', 'success');
        this.loadCriteres();
      }
    });
  }

  deleteCritere(critere: CriteresDeSelection): void {
    if (!confirm(`Supprimer "${critere.nom}" ?`)) return;
    this.critereService.deleteCritere(critere.id!).subscribe({
      next: () => { this.showSnack('Critère supprimé', 'warn'); this.loadCriteres(); },
      error: () => this.showSnack('Erreur lors de la suppression', 'error')
    });
  }

  deleteSelected(): void {
    if (!confirm(`Supprimer ${this.selection.selected.length} critère(s) ?`)) return;
    const ids = this.selection.selected.map(c => c.id!);
    Promise.all(ids.map(id => this.critereService.deleteCritere(id).toPromise()))
      .then(() => {
        this.selection.clear();
        this.showSnack('Critères supprimés', 'warn');
        this.loadCriteres();
      });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  getCategoriesCount(critere: CriteresDeSelection): number {
    return critere.categorieDeSelections?.length ?? 0;
  }

  getCategories(critere: CriteresDeSelection): any[] {
    return critere.categorieDeSelections ?? [];
  }

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

  private showSnack(msg: string, type: 'success' | 'error' | 'warn'): void {
    this.snackBar.open(msg, 'OK', {
      duration: 3500,
      panelClass:
        type === 'success' ? 'success-snackbar' :
          type === 'error'   ? 'error-snackbar'   : 'warning-snackbar'
    });
  }
}
