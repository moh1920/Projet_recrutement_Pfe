import { Component, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { UserService, User, UserKey, UserDTO } from '../../../core/services/user.service';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import {StatusUser} from "../../../core/models/create-user-request.model";

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements AfterViewInit {
  displayedColumns: string[] = [
    'select',
    'name',
    'email',
    'role',
    'department',
    'status',
    'lastActive',
    'actions',
  ];
  availableColumns = ['Nom', 'Email', 'Rôle', 'Département', 'Statut', 'Dernière connexion'];
  dataSource: MatTableDataSource<User>;
  listUsers: UserDTO[] = [];
  selection = new SelectionModel<User>(true, []);

  availableRoles = ['Tous', 'Admin', 'Chef de Département', 'CUP', 'Enseignant'];
  selectedRole = 'Tous';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  userService = inject(UserService);
  dialog = inject(MatDialog);

  // Stats
  totalUsers = 0;
  activeUsers = 0;

  // Couleurs pour avatars
  avatarColors = [
    'linear-gradient(135deg, #8B0000 0%, #a50000 100%)',
    'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
    'linear-gradient(135deg, #701a75 0%, #c026d3 100%)',
  ];

  constructor() {
    this.dataSource = new MatTableDataSource();
    //  this.loadUsers();
    this.loadAllUsers();
  }

  // loadUsers() {
  //   this.userService.getUsers().subscribe(data => {
  //     this.dataSource.data = data;
  //     this.totalUsers = data.length;
  //     this.activeUsers = data.filter(u => u.status === 'Actif').length;
  //   });
  // }
  loadAllUsers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.listUsers = data.filter((u) => u.role.toLowerCase() != 'candidate');

        // Transform data to match template expectations
        const transformedUsers = this.listUsers.map((user) => this.transformUserData(user));
        this.dataSource.data = transformedUsers;

        // Update stats
        this.totalUsers = transformedUsers.length;
        this.activeUsers = transformedUsers.filter((u) => u.status === 'Actif').length;

        console.log('Loaded users:', transformedUsers);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Add error handling (snackbar notification, etc.)
      },
    });
  }

  private transformUserData(userDto: UserDTO): any {
    return {
      id: userDto.id,
      keycloakId: userDto.keycloakId,
      name: `${userDto.firstName} ${userDto.lastName}`,
      email: userDto.email,
      phone: userDto.phone, // Will be empty until API provides it
      role: userDto.role,
      department: userDto.department, // Will be empty until API provides it
      status: userDto.statusUser, // Default to active
      lastActive: userDto.dateDeCreation, // Current date as placeholder
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilter(input: HTMLInputElement) {
    input.value = '';
    this.dataSource.filter = '';
    this.selectedRole = 'Tous';
  }

  filterByRole(role: string) {
    this.selectedRole = role;
    if (role === 'Tous') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = role.toLowerCase();
    }
  }

  // Selection logic
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  // Avatar helpers
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getAvatarColor(name: string): string {
    const index = name.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  // Role helpers
  getRoleClass(role: string): string {
    const map: { [key: string]: string } = {
      'Chef de Département': 'chef-dept',
      CUP: 'cup',
      Enseignant: 'enseignant',
      Admin: 'admin',
    };
    return map[role] || 'default';
  }

  getRoleIcon(role: string): string {
    const map: { [key: string]: string } = {
      'Chef de Département': 'supervisor_account',
      CUP: 'school',
      Enseignant: 'person',
      Admin: 'admin_panel_settings',
    };
    return map[role] || 'person';
  }

  // Status toggle
  toggleStatus(user: User): void {
    if (!user.id) return;
    const newStatus = user.status === StatusUser.ACTIF ? StatusUser.INACTIF : StatusUser.ACTIF;

    this.userService.updateStatusUser(user.id, newStatus).subscribe({
      next: () => {
        user.status = newStatus;
        this.activeUsers = this.dataSource.data.filter(u => u.status === StatusUser.ACTIF).length;
      },
      error: (err) => {
        console.error('Erreur changement statut:', err);
      },
    });
  }

  // Column visibility
  toggleColumn(column: string) {
    const colMap: { [key: string]: string } = {
      Nom: 'name',
      Email: 'email',
      Rôle: 'role',
    };

    const colKey = colMap[column];
    const index = this.displayedColumns.indexOf(colKey);

    if (index > -1) {
      this.displayedColumns.splice(index, 1);
    } else {
      // Réinsérer à la bonne position
      const order = [
        'select',
        'name',
        'email',
        'role',
        'department',
        'status',
        'lastActive',
        'actions',
      ];
      const newIndex = order.indexOf(colKey);
      this.displayedColumns.splice(newIndex, 0, colKey);
    }
  }

  isColumnVisible(column: string): boolean {
    const colMap: { [key: string]: string } = {
      Nom: 'name',
      Email: 'email',
      Rôle: 'role',
      Département: 'department',
      Statut: 'status',
      'Dernière connexion': 'lastActive',
    };
    return this.displayedColumns.includes(colMap[column]);
  }

  // Actions
  openAddDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      panelClass: 'modern-dialog',
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userService.createUser(result).subscribe(() => this.loadAllUsers());
      }
      this.loadAllUsers();
    });
  }

  openEditDialog(user: any): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      panelClass: 'modern-dialog',
      data: user,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAllUsers();
      }
    });
  }

  deleteUser(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      //  this.userService.deleteUser(id).subscribe(() => this.loadAllUsers());
    }
  }

  deleteSelected() {
    if (confirm(`Supprimer ${this.selection.selected.length} utilisateurs ?`)) {
      const ids = this.selection.selected.map((u) => u.id);
      // Appel API batch delete
      this.selection.clear();
      this.loadAllUsers();
    }
  }

  viewProfile(user: User) {
    // Navigation vers profil
  }

  resetPassword(user: User) {
    // Logique reset password
  }

  exportData() {
    // Export CSV/Excel
  }



}
