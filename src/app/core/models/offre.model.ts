import { CriteresDeSelection } from './criteres-de-selection.model';

export interface Offre {

  id?: string;

  // Informations générales
  titre: string;
  description: string;
  departement: string;        // Informatique, Génie logiciel, BI...
  specialite: string;         // IA, Data, Cloud, BI...

  // Type de poste
  typePoste: string;          // Permanent | Vacataire
  chargeHoraire: number;      // Heures / semaine
  niveauRequis: string;       // Licence | Master | Doctorat

  // Modules à assurer
  modules: string[];          // IA, Java, Big Data...

  // Critères de sélection (IA)
  minAnneesExperience: number;
  experienceAcademique: boolean;
  competencesRequises: string[];

  // Dates & statut
  datePublication: string;    // ISO String (LocalDate)
  dateExpiration: string;     // ISO String
  statut: string;             // Ouverte | Fermée | En cours

  // Traçabilité
  creePar: string;
  dateCreation: string;       // ISO String (LocalDateTime)

  // Critères liés (DBRef)
  criteresDeSelections?: CriteresDeSelection[];
}
