import { Component, inject, OnInit } from '@angular/core';
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
import { AppKeycloakService } from '../../core/services/keycloak.service';
import { environment } from '../../../environments/environment';
import { MenuService } from '../../core/services/menu.service';
import { MenuItemDTO as MenuItem } from '../../core/models/menu.model';

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
    MatTooltipModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  authService = inject(AuthService);
  appKeycloakService = inject(AppKeycloakService);
  menuService = inject(MenuService);

  currentUser$ = this.authService.currentUser$;
  isDarkMode = false;
  notificationCount = 3;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay()
  );

  menuItems: MenuItem[] = [];

  ngOnInit(): void {
    this.menuService.getSidebar().subscribe({
      next: (menus) => {
        this.menuItems = menus;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des menus', err);
      }
    });
  }

  notifications: Notification[] = [
    {
      icon: 'person',
      message: 'Nouveau candidat: Ahmed Ben Ali',
      time: '5 min',
      color: 'primary',
      read: false,
    },
    {
      icon: 'event',
      message: 'Entretien confirmé à 14h00',
      time: '30 min',
      color: 'accent',
      read: false,
    },
    {
      icon: 'check_circle',
      message: 'Offre publiée avec succès',
      time: '2h',
      color: 'primary',
      read: true,
    },
  ];
  keycloakAdminUrl: string = environment.keycloakUrl;
  keycloakOnline: any;

  toggleSubmenu(item: MenuItem): void {
    item.isExpanded = !item.isExpanded;
  }

  getCurrentPageTitle(): string {
    return 'Administration';
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  markAllRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.notificationCount = 0;
  }

  logout(): void {
    this.appKeycloakService.logout();
  }
}
