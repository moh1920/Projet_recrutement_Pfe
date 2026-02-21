// job-offers-admin.component.ts
import {Component, inject, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { OffreService } from "../../../core/services/offre.service";
import { Offre } from "../../../core/models/offre.model";
import { JobOfferDialogComponent } from './job-offer-dialog/job-offer-dialog.component';

@Component({
  selector: 'app-job-offers-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatChipsModule,
    FormsModule
  ],
  templateUrl: './job-offers-admin.component.html',
  styleUrl: './job-offers-admin.component.scss'
})
export class JobOffersAdminComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  jobOfferService = inject(OffreService);
  dialog = inject(MatDialog);

  displayedColumns: string[] = ['select', 'title', 'department', 'speciality', 'type', 'workload', 'candidates', 'deadline', 'status', 'actions'];
  dataSource = new MatTableDataSource<Offre>([]);
  selection = new SelectionModel<Offre>(true, []);

  isLoading = true;
  searchText = '';
  selectedFilter = 'Tous';

  filters = ['Tous', 'Ouverte', 'En cours', 'Fermée'];

  stats = {
    total: 0,
    ouvertes: 0
  };

  ngOnInit(): void {
    this.loadOffers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadOffers(): void {
    this.isLoading = true;
    this.jobOfferService.getAllOffres().subscribe({
      next: (data) => {
        this.dataSource.data = data.content || [];
        this.updateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement offres:', err);
        this.isLoading = false;
      }
    });
  }

  updateStats(): void {
    this.stats.total = this.dataSource.data.length;
    this.stats.ouvertes = this.dataSource.data.filter(o => o.status === 'Ouverte').length;
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
    if (filter === 'Tous') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filterPredicate = (data: Offre, filterStr: string) => {
        return data.status?.toLowerCase() === filterStr.toLowerCase();
      };
      this.dataSource.filter = filter;
    }
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Selection logic
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: Offre): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Ouverte': return 'status-ouverte';
      case 'En cours': return 'status-encours';
      case 'Fermée': return 'status-fermee';
      default: return '';
    }
  }

  getTypeClass(type: string): string {
    switch(type) {
      case 'Permanent': return 'type-permanent';
      case 'Vacataire': return 'type-vacataire';
      case 'Contractuel': return 'type-contractuel';
      default: return '';
    }
  }

  getTypeIcon(type: string): string {
    switch(type) {
      case 'Permanent': return 'work';
      case 'Vacataire': return 'schedule';
      case 'Contractuel': return 'assignment';
      default: return 'work';
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(JobOfferDialogComponent, {
      width: '800px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOffers();
      }
    });
  }

  editOffer(offer: Offre): void {
    const dialogRef = this.dialog.open(JobOfferDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: offer
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOffers();
      }
    });
  }

  archiveOffer(offer: Offre): void {
    console.log('Archiver offre:', offer.id);
  }

  viewCandidates(offer: Offre): void {
    console.log('Voir candidats pour:', offer.id);
  }

  isUrgent(deadline: string | undefined): boolean {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }

  deleteSelected(): void {
    if (this.selection.selected.length === 0) return;
    console.log('Supprimer sélection:', this.selection.selected);
    // Implémenter suppression batch
    this.selection.selected.forEach(offre => {
        if (offre.id)
        this.jobOfferService.deleteOffre(offre.id).subscribe(()=>{
          console.log('Supprimer sélection:', this.selection.selected);
          this.loadOffers();
          });
      });
  }
}
