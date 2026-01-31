import { CategorieDeSelection } from './categorie-de-selection.model';

export interface CriteresDeSelection {

  id?: string;
  nom: string;
  description: string;
  categorieDeSelections?: CategorieDeSelection[];
}
