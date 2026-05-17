import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MenuItem } from "../../../../core/models/menu.model";

export interface MenuDialogData {
  menu: MenuItem | null;
  parentMenus: MenuItem[];
}

@Component({
  selector: 'app-menu-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.menu?.id ? 'Modifier' : 'Ajouter' }} un Menu</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="menu-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Label</mat-label>
          <input matInput formControlName="label" placeholder="Ex: Dashboard">
          <mat-error *ngIf="form.get('label')?.hasError('required')">Le label est requis</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Icon (Material Icon)</mat-label>
          <input matInput formControlName="icon" placeholder="Ex: dashboard">
          <mat-error *ngIf="form.get('icon')?.hasError('required')">L'icône est requise</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Route</mat-label>
          <input matInput formControlName="route" placeholder="Ex: /admin/dashboard">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Menu Parent (Optionnel)</mat-label>
          <mat-select formControlName="parentId">
            <mat-option [value]="null">-- Aucun (Menu Principal) --</mat-option>
            <mat-option *ngFor="let parent of data.parentMenus" [value]="parent.id">
              {{ parent.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ordre (Tri)</mat-label>
          <input matInput type="number" formControlName="sortOrder">
        </mat-form-field>

        <mat-checkbox formControlName="active" color="primary">Menu Actif</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        Sauvegarder
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .menu-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
      min-width: 300px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class MenuDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MenuDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MenuDialogData
  ) {
    this.form = this.fb.group({
      label: [data.menu?.label || '', Validators.required],
      icon: [data.menu?.icon || '', Validators.required],
      route: [data.menu?.route || ''],
      parentId: [data.menu?.parentId || null],
      sortOrder: [data.menu?.sortOrder || 0, Validators.required],
      active: [data.menu?.active ?? true]
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
