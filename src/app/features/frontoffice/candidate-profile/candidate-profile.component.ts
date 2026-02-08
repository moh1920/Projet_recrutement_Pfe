import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Experience {
  id: number;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
}

interface Education {
  id: number;
  degree: string;
  school: string;
  field: string;
  year: string;
}

interface Skill {
  name: string;
  level: number; // 1-5
  category: string;
}

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './candidate-profile.component.html',
  styleUrls: ['./candidate-profile.component.scss']
})
export class CandidateProfileComponent implements OnInit {

  activeTab: 'overview' | 'edit' | 'documents' | 'stats' = 'overview';
  isEditing: boolean = false;

  profileForm!: FormGroup;

  candidate = {
    firstName: 'Ahmed',
    lastName: 'Ben Salah',
    email: 'ahmed.bensalah@email.com',
    phone: '+216 98 123 456',
    location: 'Ariana, Tunisie',
    title: 'Ingénieur en Informatique',
    bio: 'Passionné par l\'intelligence artificielle et le développement web. Plus de 5 ans d\'expérience dans l\'enseignement et la recherche.',
    avatar: null,
    linkedin: 'linkedin.com/in/ahmedbensalah',
    portfolio: 'ahmedbensalah.dev',
    availability: 'immediate', // immediate, one_month, three_months, not_available
    salary: '3500-4500',
    mobility: 'national'
  };

  experiences: Experience[] = [
    {
      id: 1,
      title: 'Développeur Full Stack Senior',
      company: 'TechCorp Tunisie',
      location: 'Tunis',
      startDate: '2021-03',
      endDate: null,
      current: true,
      description: 'Développement d\'applications web avec Angular et Node.js. Gestion d\'équipe de 3 développeurs.'
    },
    {
      id: 2,
      title: 'Enseignant Vacataire',
      company: 'ESPRIT',
      location: 'Ariana',
      startDate: '2019-09',
      endDate: '2021-02',
      current: false,
      description: 'Cours de développement web et programmation orientée objet.'
    }
  ];

  educations: Education[] = [
    {
      id: 1,
      degree: 'Diplôme d\'Ingénieur',
      school: 'ESPRIT',
      field: 'Informatique',
      year: '2019'
    },
    {
      id: 2,
      degree: 'Master Recherche',
      school: 'Université de Tunis',
      field: 'Intelligence Artificielle',
      year: '2021'
    }
  ];

  skills: Skill[] = [
    { name: 'Angular', level: 5, category: 'Frontend' },
    { name: 'TypeScript', level: 5, category: 'Frontend' },
    { name: 'Node.js', level: 4, category: 'Backend' },
    { name: 'Python', level: 4, category: 'Langages' },
    { name: 'Machine Learning', level: 3, category: 'Data' },
    { name: 'Docker', level: 3, category: 'DevOps' },
    { name: 'PostgreSQL', level: 4, category: 'Database' },
    { name: 'Git', level: 5, category: 'Outils' }
  ];

  documents = [
    { name: 'CV_Ahmed_BenSalah.pdf', size: '2.4 MB', date: '15 Jan 2024', type: 'cv' },
    { name: 'Lettre_Motivation_ESPRIT.pdf', size: '1.1 MB', date: '10 Jan 2024', type: 'letter' },
    { name: 'Diplome_Ingenieur.pdf', size: '3.2 MB', date: '05 Jan 2024', type: 'diploma' }
  ];

  stats = {
    profileViews: 128,
    applications: 3,
    interviewRate: 67,
    responseRate: 85,
    profileCompletion: 92
  };

  skillCategories = ['Frontend', 'Backend', 'Langages', 'Data', 'DevOps', 'Database', 'Outils'];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      firstName: [this.candidate.firstName, Validators.required],
      lastName: [this.candidate.lastName, Validators.required],
      email: [this.candidate.email, [Validators.required, Validators.email]],
      phone: [this.candidate.phone, Validators.required],
      location: [this.candidate.location],
      title: [this.candidate.title],
      bio: [this.candidate.bio],
      linkedin: [this.candidate.linkedin],
      portfolio: [this.candidate.portfolio],
      availability: [this.candidate.availability],
      salary: [this.candidate.salary],
      mobility: [this.candidate.mobility]
    });
  }

  setActiveTab(tab: 'overview' | 'edit' | 'documents' | 'stats'): void {
    this.activeTab = tab;
    this.isEditing = tab === 'edit';
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.candidate = { ...this.candidate, ...this.profileForm.value };
      this.isEditing = false;
      this.activeTab = 'overview';
      // Appel API pour sauvegarder
      console.log('Profil mis à jour:', this.candidate);
    }
  }

  cancelEdit(): void {
    this.initForm();
    this.isEditing = false;
    this.activeTab = 'overview';
  }

  addExperience(): void {
    const newExp: Experience = {
      id: Date.now(),
      title: 'Nouveau poste',
      company: 'Entreprise',
      location: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      current: true,
      description: ''
    };
    this.experiences.unshift(newExp);
  }

  removeExperience(id: number): void {
    this.experiences = this.experiences.filter(e => e.id !== id);
  }

  addEducation(): void {
    const newEdu: Education = {
      id: Date.now(),
      degree: 'Nouveau diplôme',
      school: 'Établissement',
      field: '',
      year: new Date().getFullYear().toString()
    };
    this.educations.unshift(newEdu);
  }

  removeEducation(id: number): void {
    this.educations = this.educations.filter(e => e.id !== id);
  }

  addSkill(): void {
    this.skills.push({ name: 'Nouvelle compétence', level: 3, category: 'Autre' });
  }

  removeSkill(index: number): void {
    this.skills.splice(index, 1);
  }

  getSkillLevelText(level: number): string {
    const levels = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert', 'Maître'];
    return levels[level - 1] || 'Intermédiaire';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      console.log('Fichier sélectionné:', file.name);
      // Upload logique ici
    }
  }

  deleteDocument(doc: any): void {
    if (confirm(`Supprimer ${doc.name} ?`)) {
      this.documents = this.documents.filter(d => d !== doc);
    }
  }

  downloadDocument(doc: any): void {
    console.log('Téléchargement:', doc.name);
  }

  getInitials(): string {
    return `${this.candidate.firstName[0]}${this.candidate.lastName[0]}`.toUpperCase();
  }

  getCompletionColor(): string {
    if (this.stats.profileCompletion >= 80) return '#22c55e';
    if (this.stats.profileCompletion >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
