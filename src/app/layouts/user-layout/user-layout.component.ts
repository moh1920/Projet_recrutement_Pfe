import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { AppKeycloakService } from '../../core/services/keycloak.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltip,
   // NotificationBellComponent,   // ← cloche
    // NotificationToastComponent,  // ← toasts
  ],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isScrolled = false;
  isLoggedIn = false;
  upcomingCount: number = 1;

  appKeycloakService = inject(AppKeycloakService);

  private subs = new Subscription();

  constructor(
    private router: Router,
    //private notifService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoggedIn = await this.appKeycloakService.isLoggedIn();

    // // Connecter le WebSocket seulement si l'utilisateur est connecté
    // if (this.isLoggedIn) {
    //   await this.notifService.connect();
    // }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.pageYOffset > 50;
    const toolbar = document.querySelector('.main-toolbar');
    if (toolbar) {
      toolbar.classList.toggle('scrolled', this.isScrolled);
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onNavClick(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    this.isLoggedIn = false;
  //  this.notifService.disconnect(); // ← couper proprement le WebSocket
    this.appKeycloakService.logout();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
