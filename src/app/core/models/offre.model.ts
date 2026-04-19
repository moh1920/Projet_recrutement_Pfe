export interface Offre {
  id?: string;
  title: string;
  description: string;
  department: string;
  speciality: string;
  type: 'Permanent' | 'Vacataire';
  workload?: number; // Charge horaire en heures/semaine
  requiredLevel: 'Licence' | 'Master' | 'Doctorat';
  modules: string[];
  minYearsExperience?: number;
  academicExperience?: boolean;
  requiredSkills: string[];
  postedDate?: string; // ISO date string
  deadline?: string; // ISO date string
  status?: 'Ouverte' | 'En cours' | 'Fermée';
  createdBy?: string;
  createdAt?: string; // ISO datetime string
  candidateCount?: number;

  // Optional fields for UI display
  location?: string; // Can be derived from campus or added separately
  salary?: string; // Optional salary information
  experience?: string; // Alternative to minYearsExperience for display
  featured?: boolean; // Flag for featured offers
}

/**
 * DTO for creating a new offer
 */
export interface CreateOffreDTO {
  title: string;
  description: string;
  department: string;
  speciality: string;
  type: 'Permanent' | 'Vacataire';
  workload?: number;
  requiredLevel: 'Licence' | 'Master' | 'Doctorat';
  modules: string[];
  minYearsExperience?: number;
  academicExperience?: boolean;
  requiredSkills: string[];
  deadline?: string;
}

/**
 * DTO for updating an offer
 */
export interface UpdateOffreDTO {
  title?: string;
  description?: string;
  department?: string;
  speciality?: string;
  type?: 'Permanent' | 'Vacataire';
  workload?: number;
  requiredLevel?: 'Licence' | 'Master' | 'Doctorat';
  modules?: string[];
  minYearsExperience?: number;
  academicExperience?: boolean;
  requiredSkills?: string[];
  deadline?: string;
  status?: 'Ouverte' | 'En cours' | 'Fermée';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
