import { Component, inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { CriteresDeSelection, CriteresDeSelectionService } from '../../../../core/services/CriteresDeSelectionService';
import { OffreService } from '../../../../core/services/offre.service';
import { Offre } from '../../../../core/models/offre.model';
import {MatListOption, MatSelectionList} from "@angular/material/list";
import {FormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-affecter-critere-de-selection-aoffre-dialog',
  standalone: true,
  imports: [
    MatDialogContent,
    MatSelectionList,
    FormsModule,
    MatListOption,
    MatDialogActions,
    MatButton,
    MatDialogTitle,
    NgForOf
  ],
  templateUrl: './affecter-critere-de-selection-aoffre-dialog.component.html',
  styleUrl: './affecter-critere-de-selection-aoffre-dialog.component.scss'
})
export class AffecterCritereDeSelectionAOffreDialogComponent implements OnInit {

  critereDeSelectionService = inject(CriteresDeSelectionService);
  offreService              = inject(OffreService);
  dialogRef                 = inject(MatDialogRef<AffecterCritereDeSelectionAOffreDialogComponent>);
  data                      = inject(MAT_DIALOG_DATA) as { offre: Offre };

  critereDeSelectionSelected: CriteresDeSelection[] = [];  // multi-sélection
  critereDeSelections: CriteresDeSelection[] = [];

  ngOnInit(): void {
    this.critereDeSelectionService.getAllCriteres().subscribe(data => {
      this.critereDeSelections = data.content ;
      console.log(this.critereDeSelections);
    });
  }

  affecterCritereDeSelection(): void {
    const idOffre   = this.data.offre.id;
    const idCriteres = this.critereDeSelectionSelected.map(c => c.id);
    if (idOffre)
    this.offreService.affecterCriteresDeSelection(idOffre, idCriteres).subscribe({
      next: () => this.dialogRef.close({ success: true }),
      error: (err) => console.error('Erreur affectation critères', err)
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
