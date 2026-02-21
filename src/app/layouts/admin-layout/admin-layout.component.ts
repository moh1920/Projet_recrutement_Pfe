import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map, shareReplay } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface Notification {
  icon: string;
  message: string;
  time: string;
  color: string;
  read: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  authService = inject(AuthService);

  currentUser$ = this.authService.currentUser$;
  isDarkMode = false;
  notificationCount = 3;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'work', label: 'Offres', route: '/admin/job-offers' },
    { icon: 'people', label: 'Candidats', route: '/admin/candidates' },
    { icon: 'event', label: 'Entretiens', route: '/admin/interviews' },
    { icon: 'manage_accounts', label: 'Utilisateurs', route: '/admin/users' },
  ];

  notifications: Notification[] = [
    { icon: 'person', message: 'Nouveau candidat: Ahmed Ben Ali', time: '5 min', color: 'primary', read: false },
    { icon: 'event', message: 'Entretien confirmé à 14h00', time: '30 min', color: 'accent', read: false },
    { icon: 'check_circle', message: 'Offre publiée avec succès', time: '2h', color: 'primary', read: true },
  ];

  getCurrentPageTitle(): string {
    return 'Administration';
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notificationCount = 0;
  }

  logout(): void {
    this.authService.logout();
  }
}
