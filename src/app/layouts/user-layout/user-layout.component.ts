
import {Component, HostListener, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, RouterLink, Router} from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltip} from "@angular/material/tooltip";
import {AppKeycloakService} from "../../core/services/keycloak.service";

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
    MatTooltip
  ],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent {
  isMobileMenuOpen = false;
  isScrolled = false;
  isLoggedIn = true;
  upcomingCount: number = 1 ; // à alimenter depuis votre servic

  appKeycloakService = inject(AppKeycloakService);
  constructor(private router : Router) {

  }



  async ngOnInit() {
    this.isLoggedIn = await this.appKeycloakService.isLoggedIn();
  }
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.pageYOffset > 50;

    // Add/remove scrolled class to toolbar
    const toolbar = document.querySelector('.main-toolbar');
    if (toolbar) {
      if (this.isScrolled) {
        toolbar.classList.add('scrolled');
      } else {
        toolbar.classList.remove('scrolled');
      }
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Close mobile menu when clicking on a link
  onNavClick(): void {
    this.isMobileMenuOpen = false;
  }
  logout() {
    this.isLoggedIn =false ;
    this.appKeycloakService.logout();
  }
}
