import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {OffreService} from "../../../core/services/offre.service";
import {Offre} from "../../../core/models/offre.model";


@Component({
  selector: 'app-create-offre',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-offre.component.html',
  styleUrls: ['./create-offre.component.scss']
})
export class CreateOffreComponent {

  offreForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private offreService: OffreService
  ) {
    this.offreForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      departement: ['', Validators.required],
      specialite: ['', Validators.required],
      typePoste: ['Permanent', Validators.required],
      chargeHoraire: [1, [Validators.required, Validators.min(1)]],
      niveauRequis: ['Master', Validators.required],
      modules: [''],
      minAnneesExperience: [0, Validators.required],
      experienceAcademique: [false],
      competencesRequises: [''],
      statut: ['Ouverte', Validators.required]
    });
  }

  create(): void {
    if (this.offreForm.invalid) return;

    this.loading = true;

    const v = this.offreForm.value;

    const offre: Offre = {
      creePar: "", dateExpiration: "",
      titre: v.titre,
      description: v.description,
      departement: v.departement,
      specialite: v.specialite,
      typePoste: v.typePoste,
      chargeHoraire: v.chargeHoraire,
      niveauRequis: v.niveauRequis,
      modules: v.modules ? v.modules.split(',').map((m: string) => m.trim()) : [],
      minAnneesExperience: v.minAnneesExperience,
      experienceAcademique: v.experienceAcademique,
      competencesRequises: v.competencesRequises
        ? v.competencesRequises.split(',').map((c: string) => c.trim())
        : [],
      statut: v.statut,
      datePublication: new Date().toISOString().substring(0, 10),
      dateCreation: new Date().toISOString()
    };

    this.offreService.createOffre(offre).subscribe({
      next: () => {
        alert('Offre créée avec succès ✅');
        this.offreForm.reset({
          typePoste: 'Permanent',
          niveauRequis: 'Master',
          statut: 'Ouverte',
          experienceAcademique: false
        });
        this.loading = false;
      },
      error: () => {
        alert('Erreur lors de la création ❌');
        this.loading = false;
      }
    });
  }
}
