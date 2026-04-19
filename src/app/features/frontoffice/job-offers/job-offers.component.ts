import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

// Models and Services
import { Offre } from '../../../core/models/offre.model';
import { OffreService } from '../../../core/services/offre.service';

@Component({
  selector: 'app-job-offers',
  templateUrl: './job-offers.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
  ],
  styleUrls: ['./job-offers.component.scss'],
})
export class JobOffersComponent implements OnInit {
  // All offers from API
  allOffers: Offre[] = [];

  // Filtered offers to display
  filteredOffers: Offre[] = [];

  // Filter properties
  searchTerm = '';
  selectedType = 'all';
  selectedDepartment = 'all';
  selectedLevel = 'all';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;

  // Loading state
  loading = false;

  constructor(private offreService: OffreService) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.loading = true;
    this.offreService.getAllOffresSorted(this.currentPage, this.pageSize, 'postedDate').subscribe({
      next: (response) => {
        // Handle paginated response
        this.allOffers = response.content || response;
        this.totalElements = response.totalElements || this.allOffers.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading offers:', error);
        this.loading = false;
        // Fallback to mock data for development
        this.loadMockData();
      },
    });
  }

  applyFilters(): void {
    this.filteredOffers = this.allOffers.filter((offer) => {
      // Search term filter (title, description, department, speciality)
      const matchesSearch =
        !this.searchTerm ||
        offer.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        offer.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        offer.department.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (offer.speciality &&
          offer.speciality.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Type filter
      const matchesType = this.selectedType === 'all' || offer.type === this.selectedType;

      // Department filter
      const matchesDepartment =
        this.selectedDepartment === 'all' || offer.department === this.selectedDepartment;

      // Level filter
      const matchesLevel =
        this.selectedLevel === 'all' || offer.requiredLevel === this.selectedLevel;

      return matchesSearch && matchesType && matchesDepartment && matchesLevel;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = 'all';
    this.selectedDepartment = 'all';
    this.selectedLevel = 'all';
    this.applyFilters();
  }

  isNewOffer(postedDate: string | undefined): boolean {
    if (!postedDate) return false;
    const posted = new Date(postedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // New if posted within last 7 days
  }

  isDeadlineClose(deadline: string | undefined): boolean {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0; // Urgent if less than 7 days remaining
  }

  getRemainingDays(deadline: string | undefined): number {
    if (!deadline) return 0;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  getDepartmentColor(department: string): string {
    const colors: { [key: string]: string } = {
      Informatique: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      Electronique: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      Électronique: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      Mecanique: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      Mécanique: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      Gestion: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      Civil: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      default: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    };
    return colors[department] || colors['default'];
  }

  getDepartmentIcon(department: string): string {
    const icons: { [key: string]: string } = {
      Informatique: 'computer',
      Electronique: 'electrical_services',
      Électronique: 'electrical_services',
      Mecanique: 'precision_manufacturing',
      Mécanique: 'precision_manufacturing',
      Gestion: 'business_center',
      Civil: 'architecture',
      default: 'work',
    };
    return icons[department] || icons['default'];
  }

  /**
   * Mock data for development/testing - Using ALL model attributes
   */
  loadMockData(): void {
    this.allOffers = [
      {
        id: '1',
        title: 'Enseignant en Intelligence Artificielle',
        description:
          "Nous recherchons un enseignant passionné pour enseigner l'IA et le Machine Learning à nos étudiants en cycle ingénieur.",
        department: 'Informatique',
        speciality: 'Intelligence Artificielle',
        type: 'Permanent',
        workload: 12,
        requiredLevel: 'Doctorat',
        modules: [
          'Machine Learning',
          'Deep Learning',
          'Computer Vision',
          'Natural Language Processing',
        ],
        minYearsExperience: 3,
        academicExperience: true,
        requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Recherche académique'],
        postedDate: new Date().toISOString(),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ouverte',
        createdBy: 'admin@esprit.tn',
        createdAt: new Date().toISOString(),
        candidateCount: 12,
        location: 'Campus El Ghazala',
        salary: 'Selon grille',
        experience: '3 ans minimum',
        featured: true,
      },
      {
        id: '2',
        title: 'Professeur de Systèmes Embarqués',
        description:
          "Poste de vacataire pour enseigner les systèmes embarqués et l'électronique numérique aux étudiants de 3ème année.",
        department: 'Électronique',
        speciality: 'Systèmes Embarqués',
        type: 'Vacataire',
        workload: 6,
        requiredLevel: 'Master',
        modules: ['Microcontrôleurs', 'FPGA', 'IoT', 'Systèmes temps réel'],
        minYearsExperience: 2,
        academicExperience: false,
        requiredSkills: ['C/C++', 'Arduino', 'STM32', 'VHDL', 'Proteus'],
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ouverte',
        createdBy: 'responsable.electronique@esprit.tn',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        candidateCount: 8,
        location: 'Campus Ariana',
        salary: '80 DT/heure',
        experience: '2 ans minimum',
      },
      {
        id: '3',
        title: 'Enseignant en Génie Mécanique',
        description:
          "Recherche d'un enseignant permanent pour modules de conception mécanique et fabrication additive.",
        department: 'Mécanique',
        speciality: 'Conception Mécanique',
        type: 'Permanent',
        workload: 10,
        requiredLevel: 'Doctorat',
        modules: [
          'CAO',
          'Résistance des matériaux',
          'Mécanique des fluides',
          'Fabrication additive',
        ],
        minYearsExperience: 5,
        academicExperience: true,
        requiredSkills: ['SolidWorks', 'CATIA', 'ANSYS', 'Recherche & Développement'],
        postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ouverte',
        createdBy: 'hr@esprit.tn',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        candidateCount: 5,
        location: 'Campus El Ghazala',
        salary: 'Selon grille',
        experience: '5 ans minimum',
        featured: false,
      },
      {
        id: '4',
        title: 'Professeur de Finance et Comptabilité',
        description:
          "Enseignement de la finance d'entreprise et comptabilité analytique pour étudiants en gestion.",
        department: 'Gestion',
        speciality: 'Finance',
        type: 'Vacataire',
        workload: 8,
        requiredLevel: 'Master',
        modules: ["Finance d'entreprise", 'Comptabilité analytique', 'Analyse financière'],
        minYearsExperience: 3,
        academicExperience: false,
        requiredSkills: ['Excel avancé', 'SAP', 'Analyse financière', 'Audit'],
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ouverte',
        createdBy: 'gestion@esprit.tn',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        candidateCount: 15,
        location: 'Campus Ariana',
        salary: '75 DT/heure',
        experience: '3 ans minimum',
        featured: true,
      },
      {
        id: '5',
        title: 'Enseignant en Architecture et BIM',
        description:
          'Enseignement des techniques BIM et modélisation architecturale pour cycle ingénieur civil.',
        department: 'Civil',
        speciality: 'Architecture & BIM',
        type: 'Permanent',
        workload: 14,
        requiredLevel: 'Doctorat',
        modules: ['BIM', 'Revit Architecture', 'Gestion de projet', 'Structures métalliques'],
        minYearsExperience: 4,
        academicExperience: true,
        requiredSkills: ['Revit', 'AutoCAD', 'ArchiCAD', 'Gestion de projet', 'Normes BIM'],
        postedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'En cours',
        createdBy: 'civil@esprit.tn',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        candidateCount: 7,
        location: 'Campus El Ghazala',
        salary: 'Selon grille',
        experience: '4 ans minimum',
        featured: false,
      },
      {
        id: '6',
        title: 'Chargé de Cours - Réseaux et Sécurité',
        description:
          'Vacataire pour enseigner les réseaux informatiques et la cybersécurité aux étudiants de master.',
        department: 'Informatique',
        speciality: 'Réseaux & Sécurité',
        type: 'Vacataire',
        workload: 6,
        requiredLevel: 'Master',
        modules: ['Réseaux avancés', 'Sécurité informatique', 'Cryptographie', 'Ethical Hacking'],
        minYearsExperience: 2,
        academicExperience: false,
        requiredSkills: ['Cisco', 'Linux', 'Firewall', 'Penetration Testing', 'CCNA'],
        postedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ouverte',
        createdBy: 'info@esprit.tn',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        candidateCount: 20,
        location: 'Campus Ariana',
        salary: '85 DT/heure',
        experience: '2 ans minimum',
        featured: false,
      },
    ];
    this.applyFilters();
  }
}
