import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuService } from '../../../../core/services/menu.service';
import { MenuItem } from '../../../../core/models/menu.model';
import { MenuDialogComponent } from './menu-dialog.component';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss']
})
export class MenuManagementComponent implements OnInit {
  private menuService = inject(MenuService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['icon', 'label', 'route', 'parentId', 'sortOrder', 'active', 'actions'];
  dataSource: MenuItem[] = [];

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus() {
    this.menuService.getAllItems().subscribe({
      next: (data) => {
        this.dataSource = data.sort((a, b) => a.sortOrder - b.sortOrder);
      },
      error: (err) => {
        this.snackBar.open('Erreur lors du chargement des menus', 'Fermer', { duration: 3000 });
        console.error(err);
      }
    });
  }

  openDialog(menu?: MenuItem) {
    // Les menus parents potentiels sont ceux qui n'ont pas de parent (menus principaux)
    // Et on exclut le menu en cours d'édition pour éviter qu'il ne soit son propre parent
    const potentialParents = this.dataSource.filter(m => !m.parentId && m.id !== menu?.id);

    const dialogRef = this.dialog.open(MenuDialogComponent, {
      width: '400px',
      data: {
        menu: menu || null,
        parentMenus: potentialParents
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (menu && menu.id) {
          // Edit
          this.menuService.updateItem(menu.id, result).subscribe(() => {
            this.snackBar.open('Menu mis à jour avec succès', 'Fermer', { duration: 3000 });
            this.loadMenus();
          });
        } else {
          // Create
          this.menuService.createItem(result).subscribe(() => {
            this.snackBar.open('Menu créé avec succès', 'Fermer', { duration: 3000 });
            this.loadMenus();
          });
        }
      }
    });
  }

  deleteMenu(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce menu ?')) {
      this.menuService.deleteItem(id).subscribe(() => {
        this.snackBar.open('Menu supprimé avec succès', 'Fermer', { duration: 3000 });
        this.loadMenus();
      });
    }
  }

  getParentLabel(parentId: string | null | undefined): string {
    if (!parentId) return '-';
    const parent = this.dataSource.find(m => m.id === parentId);
    return parent ? parent.label : 'Inconnu';
  }
}
