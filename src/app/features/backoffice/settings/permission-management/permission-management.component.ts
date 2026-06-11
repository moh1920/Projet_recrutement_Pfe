import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PermissionService } from '../../../../core/services/permission.service';
import { MenuService } from '../../../../core/services/menu.service';
import {MenuItem, MenuItemDTO} from '../../../../core/models/menu.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {BehaviorSubject, Observable} from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-permission-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './permission-management.component.html',
  styleUrls: ['./permission-management.component.scss']
})
export class PermissionManagementComponent implements OnInit {
  private permissionService = inject(PermissionService);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);

  roles: string[] = []; // Changed to empty array initially
  selectedRole: string = '';

  allMenus: MenuItem[] = [];
  selectedMenuIds: Set<string> = new Set<string>();

  ngOnInit(): void {
    this.loadRoles();
    this.loadMenus();
  }

  loadRoles() {
    // Calling Keycloak Admin REST API directly to get all realm roles.
    // Note: The authenticated user MUST have 'view-realm' or 'view-users' Keycloak admin role for this to work.
    // Otherwise, this will return a 403 Forbidden error.
    const url = `${environment.keycloakUrl}/admin/realms/${environment.keycloakRealm}/roles`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        // Filter out default keycloak roles to only show relevant application roles
        const ignoredRoles = ['offline_access', 'uma_authorization', 'default-roles-esprit'];
        this.roles = data
          .map(r => r.name)
          .filter(name => !ignoredRoles.includes(name) && !name.includes('manage-') && !name.includes('view-'));
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des rôles depuis Keycloak', err);
        this.snackBar.open('Erreur chargement des rôles. Vérifiez vos droits admin Keycloak.', 'Fermer', { duration: 5000 });
        // Fallback to hardcoded roles if API call fails
        this.roles = ['admin', 'director', 'head_dept', 'cup', 'candidate'];
      }
    });
  }

  loadMenus() {
    this.menuService.getAllItems().subscribe({
      next: (menus) => {
        this.allMenus = menus.sort((a, b) => a.sortOrder - b.sortOrder);
      },
      error: (err) => {
        this.snackBar.open('Erreur lors du chargement des menus', 'Fermer', { duration: 3000 });
        console.error(err);
      }
    });
  }

  onRoleChange() {
    this.selectedMenuIds.clear();
    if (!this.selectedRole) return;

    this.permissionService.getPermissionByRole(this.selectedRole).subscribe({
      next: (permission) => {
        if (permission && permission.menuItemIds) {
          this.selectedMenuIds = new Set(permission.menuItemIds);
        }
      },
      error: (err) => {
        // If 404, it just means no permissions exist yet for this role, which is fine.
        console.log('No existing permissions found for role:', this.selectedRole);
      }
    });
  }

  toggleMenu(menuId: string | undefined, event: any) {
    if (!menuId) return;
    if (event.checked) {
      this.selectedMenuIds.add(menuId);
    } else {
      this.selectedMenuIds.delete(menuId);
    }
  }

  isMenuSelected(menuId: string | undefined): boolean {
    return menuId ? this.selectedMenuIds.has(menuId) : false;
  }

  savePermissions() {
    if (!this.selectedRole) {
      this.snackBar.open('Veuillez sélectionner un rôle', 'Fermer', { duration: 3000 });
      return;
    }

    const request = {
      role: this.selectedRole,
      menuItemIds: Array.from(this.selectedMenuIds)
    };

    this.permissionService.saveOrUpdatePermission(request).subscribe({
      next: () => {
        this.snackBar.open('Permissions sauvegardées avec succès', 'Fermer', { duration: 3000 });
        this.menuService.refreshSidebar(); // ← Ajouter cette ligne



      },
      error: (err) => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        console.error(err);
      }
    });



  }


}
