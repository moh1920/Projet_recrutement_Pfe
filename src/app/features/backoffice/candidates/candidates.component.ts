
import { Component, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { CandidateService, Candidate } from '../../../core/services/candidate.service';
import { CandidateDialogComponent } from './candidate-dialog/candidate-dialog.component';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './candidates.component.html',
  styleUrl: './candidates.component.scss'
})
export class CandidatesComponent implements AfterViewInit {
  displayedColumns: string[] = ['name', 'specialty', 'experience', 'score', 'status', 'actions'];
  dataSource: MatTableDataSource<Candidate>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  candidateService = inject(CandidateService);
  dialog = inject(MatDialog);

  constructor() {
    this.dataSource = new MatTableDataSource();
    this.loadCandidates();
  }

  loadCandidates() {
    this.candidateService.getCandidates().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Admis': return 'green';
      case 'Rejeté': return 'red';
      case 'Entretien': return 'orange';
      case 'Analysé': return 'blue';
      default: return 'grey';
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(CandidateDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Nouveau candidat:', result);
        // Ici vous pouvez appeler candidateService.addCandidate(result) quand le backend sera prêt
        this.loadCandidates(); // Refresh the list
      }
    });
  }

  deleteCandidate(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
      this.candidateService.deleteCandidate(id).subscribe(() => {
        this.loadCandidates();
      });
    }
  }
}
