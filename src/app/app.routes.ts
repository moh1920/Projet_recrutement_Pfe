import { Routes } from '@angular/router';
import { LandingPageComponent } from './page/landing-page/landing-page.component';
import {authGuard} from "./guards/auth.guard";
import {AdminComponentComponent} from "./page/admin-component/admin-component.component";
import {CreateUserComponent} from "./page/create-user/create-user.component";
import {OffreComponent} from "./page/offre/offre.component";
import {CreateOffreComponent} from "./page/offre/create-offre/create-offre.component";
import {CritereDeSelectionComponent} from "./page/offre/critere-de-selection/critere-de-selection.component";
import {
  CreateCritereDeSelectionComponent
} from "./page/offre/critere-de-selection/create-critere-de-selection/create-critere-de-selection.component";
import {CategorieDeSelectionComponent} from "./page/offre/categorie-de-selection/categorie-de-selection.component";
import {
  CreateCategorieDeSelectionComponent
} from "./page/offre/categorie-de-selection/create-categorie-de-selection/create-categorie-de-selection.component";
import {UploadCvComponent} from "./page/upload-cv/upload-cv.component";

// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: LandingPageComponent },
  {
    path: 'admin',
    component: AdminComponentComponent,
    canActivate: [authGuard], // Utiliser authGuard au lieu de initialRedirectGuard
  },
  {
    path: 'gestionUser',
    component: CreateUserComponent,
    canActivate: [authGuard],
  }, {
    path: 'offre',
    component: OffreComponent,
  },{
    path: 'createOffre',
    component: CreateOffreComponent,
  },{
    path: 'critereDeSelection',
    component: CritereDeSelectionComponent,
  },{
    path: 'createCritereDeSelection',
    component: CreateCritereDeSelectionComponent,
  },{
    path: 'categorieDeSelection',
    component: CategorieDeSelectionComponent,
  },{
    path: 'createCategorieDeSelection',
    component: CreateCategorieDeSelectionComponent,
  },{
    path: 'uploadCv',
    component: UploadCvComponent,
  }
];
