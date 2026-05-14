import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LucideAngularModule, Briefcase, Target, Clock, Zap, Users, CheckCircle, FileText } from 'lucide-angular';


import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { DonutChartComponent } from './components/donut-chart/donut-chart.component';
import {CandidateDTO, CandidateService} from "../../../core/services/candidate.service";
import {OffreService} from "../../../core/services/offre.service";
import {InterviewService} from "../../../core/services/interview.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    LucideAngularModule,
    KpiCardComponent,
    DashboardHeaderComponent,
    DonutChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss' // Keeping original scss just in case, but using tailwind classes in HTML
})
export class DashboardComponent implements OnInit {
  // Icons
  UsersIcon = Users;
  BriefcaseIcon = Briefcase;
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  FileTextIcon = FileText;

  // KPIs
  totalCandidatures = 0;
  totalOffres = 0;
  totalInterviews = 0;
  admisCount = 0;

  // Charts
  donutData: { name: string; value: number }[] = [];
  donutColors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6b7280'];

  barData: any[] = [];
  customColorsBar: any[] = [];
  BAR_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

  // Recent Candidates
  recentCandidates: CandidateDTO[] = [];

  constructor(
    private candidateService: CandidateService,
    private offreService: OffreService,
    private interviewService: InterviewService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load Candidatures
    this.candidateService.getAllCandidature().subscribe(candidatures => {
      this.totalCandidatures = candidatures.length;

      // Calculate admitted
      this.admisCount = candidatures.filter(c => c.status === 'ACCEPTE').length;

      // Build Donut Data for Statuses
      const statusCounts = candidatures.reduce((acc: any, curr) => {
        const status = curr.status || 'NOUVEAU';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      this.donutData = Object.keys(statusCounts).map(key => ({
        name: key,
        value: statusCounts[key]
      }));

      // Build Bar Data for Candidates per Position
      const positionCounts = candidatures.reduce((acc: any, curr) => {
        const pos = curr.appliedPosition || 'Non spécifié';
        acc[pos] = (acc[pos] || 0) + 1;
        return acc;
      }, {});

      const topPositions = Object.keys(positionCounts)
        .map(key => ({
          name: key.length > 25 ? key.substring(0, 25) + '...' : key,
          value: positionCounts[key]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

      this.barData = topPositions;
      this.customColorsBar = topPositions.map((item, index) => ({
        name: item.name,
        value: this.BAR_COLORS[index % this.BAR_COLORS.length]
      }));

      // Recent candidates (sort by date descending, take top 5)
      this.recentCandidates = [...candidatures]
        .sort((a, b) => {
          const dateA = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
          const dateB = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
    });

    // Load Offres
    this.offreService.getAllOffres(0, 1000).subscribe(res => {
      this.totalOffres = res.content ? res.content.length : 0;
    });

    // Load Interviews
    this.interviewService.getInterviews().subscribe(interviews => {
      this.totalInterviews = interviews.length;
    });
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ACCEPTE': return 'bg-emerald-100 text-emerald-700';
      case 'EN_COURS': return 'bg-blue-100 text-blue-700';
      case 'REFUSE': return 'bg-red-100 text-red-700';
      case 'EN_ATTENTE': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
