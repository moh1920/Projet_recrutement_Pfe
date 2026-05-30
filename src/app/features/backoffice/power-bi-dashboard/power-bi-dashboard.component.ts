import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, LayoutDashboard } from 'lucide-angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-power-bi-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './power-bi-dashboard.component.html',
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PowerBiDashboardComponent implements OnInit {
  LayoutDashboardIcon = LayoutDashboard;
  FileTextIcon = FileText;
  powerBiUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.powerBiUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://app.powerbi.com/reportEmbed?reportId=70d2541f-cbcb-4187-ba5f-f152387f59c9&autoAuth=true&ctid=604f1a96-cbe8-43f8-abbf-f8eaf5d85730&actionBarEnabled=true'
    );
  }
}
