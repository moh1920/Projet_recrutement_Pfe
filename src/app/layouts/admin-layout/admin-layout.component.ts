
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  menuItems = [
    { icon: 'dashboard', label: 'Tableau de Bord', route: '/admin/dashboard' },
    { icon: 'work', label: 'Offres d\'Emploi', route: '/admin/job-offers' },
    { icon: 'people', label: 'Candidats', route: '/admin/candidates' },
    { icon: 'event', label: 'Entretiens', route: '/admin/interviews' },
    { icon: 'manage_accounts', label: 'Utilisateurs', route: '/admin/users' },
    { label: 'Analyse IA', icon: 'psychology', route: '/admin/candidates' }, // Shortcut
    { label: 'Mes Documents', icon: 'folder', route: '/admin/dashboard' }    // Mock
  ];

  logout() {
    this.authService.logout();
    // Router redirect handled in guard or manually here
  }
}
