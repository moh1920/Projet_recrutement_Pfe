
import { Component,HostListener  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent {
  isMobileMenuOpen = false;
  isScrolled = false;

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
}
