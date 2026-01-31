import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Offre} from "../../core/models/offre.model";
import {OffreService} from "../../core/services/offre.service";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CriteresDeSelection} from "../../core/models/criteres-de-selection.model";
import {CriteresDeSelectionService} from "../../core/services/criteres-de-selection.service";


@Component({
  selector: 'app-offre',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './offre.component.html',
  styleUrls: ['./offre.component.scss']
})
export class OffreComponent implements OnInit {

  offres: Offre[] = [];
  page = 0;
  size = 5;
  totalPages = 0;
  loading = false;
  showEditModal = false;
  selectedOffreId!: string;
  editForm!: FormGroup;


  showAffecterModal = false;
  criteres: CriteresDeSelection[] = [];
  selectedCriteresIds: string[] = [];
  selectedOffreIdForCritere!: string;


  constructor(
    private offreService: OffreService,
    private fb: FormBuilder,
    private criteresService : CriteresDeSelectionService
  ) {
    this.editForm = this.fb.group({
      titre: [''],
      description: [''],
      departement: [''],
      specialite: [''],
      typePoste: [''],
      chargeHoraire: [0],
      niveauRequis: [''],
      modules: [''],
      minAnneesExperience: [0],
      experienceAcademique: [false],
      competencesRequises: [''],
      statut: ['']
    });
  }

  ngOnInit(): void {
    this.loadOffres();
  }

  loadOffres(): void {
    this.loading = true;
    this.offreService.getAllOffres(this.page, this.size).subscribe({
      next: (data) => {
        this.offres = data.content;
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
      this.loadOffres();
    }
  }

  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadOffres();
    }
  }

  deleteOffre(id: string | undefined): void {
    if (!id) return;

    if (confirm('Voulez-vous vraiment supprimer cette offre ?')) {
      this.offreService.deleteOffre(id).subscribe({
        next: () => this.loadOffres(),
        error: err => console.error(err)
      });
    }
  }
  openEditModal(offre: Offre): void {
    this.selectedOffreId = offre.id!;
    this.showEditModal = true;

    this.editForm.patchValue({
      ...offre,
      modules: offre.modules.join(', '),
      competencesRequises: offre.competencesRequises.join(', ')
    });
  }

  updateOffre(): void {
    const v = this.editForm.value;

    const dto = {
      ...v,
      modules: v.modules.split(',').map((m: string) => m.trim()),
      competencesRequises: v.competencesRequises
        .split(',')
        .map((c: string) => c.trim())
    };

    this.offreService.updateOffre(this.selectedOffreId, dto).subscribe({
      next: () => {
        this.loadOffres();
        this.closeEditModal();
      },
      error: err => console.error(err)
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }


  loadCriteres(): void {
    this.criteresService.getAllCriteres(0, 100).subscribe({
      next: data => this.criteres = data.content,
      error: err => console.error(err)
    });
  }
  openAffecterCriteresModal(offre: Offre): void {
    this.selectedOffreIdForCritere = offre.id!;
    this.showAffecterModal = true;

    this.loadCriteres();

    // critères déjà affectés
    this.selectedCriteresIds =
      offre.criteresDeSelections?.map(c => c.id!) || [];
  }
  toggleCritere(id: string): void {
    if (this.selectedCriteresIds.includes(id)) {
      this.selectedCriteresIds =
        this.selectedCriteresIds.filter(c => c !== id);
    } else {
      this.selectedCriteresIds.push(id);
    }
  }

  isCritereSelected(id: string): boolean {
    return this.selectedCriteresIds.includes(id);
  }
  affecterCriteres(): void {
    this.offreService
      .affecterCriteresDeSelection(
        this.selectedOffreIdForCritere,
        this.selectedCriteresIds
      )
      .subscribe({
        next: () => {
          this.loadOffres();
          this.closeAffecterModal();
        },
        error: err => console.error(err)
      });
  }


  closeAffecterModal(): void {
    this.showAffecterModal = false;
  }




}
