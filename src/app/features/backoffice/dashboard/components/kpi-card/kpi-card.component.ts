import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, TrendingDown } from 'lucide-angular';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow" style="background-color: white; border: 1px solid #e2e8f0; border-radius: 0.75rem;">
      <div class="flex items-start justify-between" style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div class="flex-1 min-w-0" style="flex: 1; min-width: 0;">
          <p class="text-sm font-medium text-muted-foreground truncate" style="font-size: 0.875rem; color: #64748b; margin: 0;">{{title}}</p>
          <h3 class="text-2xl font-bold mt-1 text-foreground" style="font-size: 1.5rem; font-weight: bold; margin: 0.25rem 0 0 0;">{{value}}</h3>
          <p *ngIf="subtitle" class="text-xs text-muted-foreground mt-0.5" style="font-size: 0.75rem; color: #64748b; margin: 0.125rem 0 0 0;">{{subtitle}}</p>
          <div *ngIf="trend !== undefined" class="flex items-center gap-1 mt-2 text-xs font-medium" [ngStyle]="{'color': trendUp ? '#059669' : '#dc2626'}" style="display: flex; align-items: center; gap: 0.25rem; margin-top: 0.5rem; font-size: 0.75rem;">
            <lucide-icon *ngIf="trendUp" [img]="TrendingUpIcon" style="width: 12px; height: 12px;"></lucide-icon>
            <lucide-icon *ngIf="!trendUp" [img]="TrendingDownIcon" style="width: 12px; height: 12px;"></lucide-icon>
            <span>{{trend}}%</span>
          </div>
        </div>
        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" [ngClass]="bgColor" style="width: 40px; height: 40px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
          <lucide-icon [img]="icon" class="w-5 h-5" [ngClass]="color" style="width: 20px; height: 20px;"></lucide-icon>
        </div>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  @Input() title!: string;
  @Input() value!: string | number;
  @Input() subtitle?: string;
  @Input() icon!: any;
  @Input() trend?: number;
  @Input() trendUp?: boolean;
  @Input() color!: string;
  @Input() bgColor!: string;

  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
}
