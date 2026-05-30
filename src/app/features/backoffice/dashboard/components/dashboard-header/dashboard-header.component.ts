import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LayoutDashboard, Filter, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="header-container">
      <div class="header-left">
        <div class="icon-wrapper">
          <lucide-icon [img]="LayoutDashboardIcon" class="header-icon"></lucide-icon>
        </div>
        <div class="title-wrapper">
          <h1 class="header-title">{{title}}</h1>
          <p class="header-subtitle">{{subtitle}}</p>
        </div>
      </div>
      <div class="header-right">
        <button class="header-btn">
          <lucide-icon [img]="CalendarIcon" class="btn-icon"></lucide-icon>
          <span>Aujourd'hui</span>
        </button>
        <button class="header-btn" (click)="filterClick.emit()">
          <lucide-icon [img]="FilterIcon" class="btn-icon"></lucide-icon>
          <span>Filtres</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding-bottom: 0.5rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.1) 0%, rgba(211, 47, 47, 0.15) 100%);
      border: 1px solid rgba(139, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(139, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    .icon-wrapper:hover {
      transform: scale(1.05);
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.15) 0%, rgba(211, 47, 47, 0.2) 100%);
    }
    .header-icon {
      width: 22px;
      height: 22px;
      color: #8b0000;
    }
    .title-wrapper {
      display: flex;
      flex-direction: column;
    }
    .header-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .header-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 2px 0 0 0;
      font-weight: 500;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .header-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(8px);
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .header-btn:hover {
      background: #ffffff;
      color: #8b0000;
      border-color: rgba(139, 0, 0, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }
    .header-btn:active {
      transform: translateY(0);
    }
    .btn-icon {
      width: 15px;
      height: 15px;
      color: #64748b;
      transition: color 0.25s ease;
    }
    .header-btn:hover .btn-icon {
      color: #8b0000;
    }
  `]
})
export class DashboardHeaderComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
  @Output() filterClick = new EventEmitter<void>();

  LayoutDashboardIcon = LayoutDashboard;
  CalendarIcon = Calendar;
  FilterIcon = Filter;
}
