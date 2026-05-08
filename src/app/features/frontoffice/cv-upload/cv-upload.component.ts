import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CvExtractionService } from '../../../core/services/cv-extraction.service';

@Component({
  selector: 'app-cv-upload',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './cv-upload.component.html',
  styleUrl: './cv-upload.component.scss',
})
export class CvUploadComponent {
  private cvExtractionService = inject(CvExtractionService);
  private router = inject(Router);

  isDragging = false;
  selectedFile: File | null = null;
  isLoading = false;
  errorMessage = '';
  imagePreviewUrl: string | null = null;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Format non supporté. Veuillez uploader un PDF, DOCX ou une image (JPG/PNG).';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Le fichier est trop volumineux (Max 5MB).';
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';

    // Générer un aperçu si c'est une image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.imagePreviewUrl = null;
    }
  }
  removeFile() {
    this.selectedFile = null;
    this.errorMessage = '';
    this.imagePreviewUrl = null;
  }

  uploadCv() {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.cvExtractionService.extractCv(this.selectedFile).subscribe({
      next: (response) => {
        this.isLoading = false;

        console.log(response);
        // Redirect to profile builder and pass the extracted data
        this.router.navigate(['/profile-builder'], {
          state: { extractedData: response },
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Extraction error', error);
        this.errorMessage =
          "Une erreur s'est produite lors de l'analyse du CV. Veuillez réessayer ou remplir le formulaire manuellement.";
      },
    });
  }
}
