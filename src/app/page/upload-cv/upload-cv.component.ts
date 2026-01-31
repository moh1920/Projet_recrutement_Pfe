import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CvService} from "../../core/services/CvService";

@Component({
  selector: 'app-upload-cv',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-cv.component.html',
  styleUrls: ['./upload-cv.component.scss']
})
export class UploadCvComponent {

  selectedFile!: File;
  message = '';
  loading = false;

  constructor(private cvService: CvService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadCv() {
    if (!this.selectedFile) {
      this.message = 'Veuillez sélectionner un fichier CV';
      return;
    }

    this.loading = true;
    this.message = '';

    this.cvService.uploadCv(this.selectedFile).subscribe({
      next: () => {
        this.message = 'CV uploadé avec succès ✅';
        this.loading = false;
      },
      error: () => {
        this.message = 'Erreur lors de l’upload ❌';
        this.loading = false;
      }
    });
  }


}
