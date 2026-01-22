import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import {authGuard} from "./guards/auth.guard";
import {AdminComponentComponent} from "./admin-component/admin-component.component";

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: LandingPageComponent },

  { path: 'login', component: AdminComponentComponent, canActivate: [authGuard] }];
