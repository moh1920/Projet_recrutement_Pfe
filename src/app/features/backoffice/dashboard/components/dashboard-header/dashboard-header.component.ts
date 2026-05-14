import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LayoutDashboard, Filter, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex items-center justify-between mb-6" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
      <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
        <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center" style="width: 36px; height: 36px; border-radius: 0.5rem; background-color: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center;">
          <lucide-icon [img]="LayoutDashboardIcon" class="w-5 h-5 text-primary" style="width: 20px; height: 20px; color: #3b82f6;"></lucide-icon>
        </div>
        <div>
          <h1 class="text-xl font-bold text-foreground" style="font-size: 1.25rem; font-weight: bold; margin: 0;">{{title}}</h1>
          <p class="text-xs text-muted-foreground" style="font-size: 0.75rem; color: #64748b; margin: 0;">{{subtitle}}</p>
        </div>
      </div>
      <div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 0.5rem;">
        <button class="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-gray-100" style="display: inline-flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; border-radius: 0.375rem; background: white; padding: 0.375rem 0.75rem; font-size: 0.75rem; gap: 0.375rem; cursor: pointer;">
          <lucide-icon [img]="CalendarIcon" class="w-3.5 h-3.5" style="width: 14px; height: 14px;"></lucide-icon>
          Aujourd'hui
        </button>
        <button class="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-gray-100" style="display: inline-flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; border-radius: 0.375rem; background: white; padding: 0.375rem 0.75rem; font-size: 0.75rem; gap: 0.375rem; cursor: pointer;" (click)="filterClick.emit()">
          <lucide-icon [img]="FilterIcon" class="w-3.5 h-3.5" style="width: 14px; height: 14px;"></lucide-icon>
          Filtres
        </button>
      </div>
    </div>
  `
})
export class DashboardHeaderComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
  @Output() filterClick = new EventEmitter<void>();

  LayoutDashboardIcon = LayoutDashboard;
  CalendarIcon = Calendar;
  FilterIcon = Filter;
}
