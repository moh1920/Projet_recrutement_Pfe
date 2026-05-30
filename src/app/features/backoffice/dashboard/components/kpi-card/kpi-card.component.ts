import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, TrendingDown } from 'lucide-angular';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="kpi-card-wrapper" [ngClass]="getThemeClass()">
      <div class="kpi-card-content">
        <div class="kpi-card-info">
          <span class="kpi-title">{{title}}</span>
          <h3 class="kpi-value">{{value}}</h3>
          <p *ngIf="subtitle" class="kpi-subtitle">{{subtitle}}</p>
          
          <div *ngIf="trend !== undefined" class="kpi-trend" [ngClass]="trendUp ? 'trend-up' : 'trend-down'">
            <lucide-icon [img]="trendUp ? TrendingUpIcon : TrendingDownIcon" class="trend-icon"></lucide-icon>
            <span class="trend-text">{{trend}}%</span>
          </div>
        </div>
        <div class="kpi-icon-box">
          <lucide-icon [img]="icon" class="kpi-icon"></lucide-icon>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card-wrapper {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .kpi-card-wrapper::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: transparent;
      transition: background 0.3s ease;
    }
    .kpi-card-wrapper:hover {
      transform: translateY(-4px);
      background: #ffffff;
      box-shadow: 0 12px 24px -10px rgba(15, 23, 42, 0.08), 0 4px 12px -5px rgba(15, 23, 42, 0.03);
      border-color: rgba(203, 213, 225, 0.9);
    }
    .kpi-card-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .kpi-card-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-w: 0;
    }
    .kpi-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .kpi-value {
      font-size: 1.875rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0.25rem 0 0 0;
      letter-spacing: -0.03em;
    }
    .kpi-subtitle {
      font-size: 0.75rem;
      color: #94a3b8;
      margin: 0.125rem 0 0 0;
    }
    .kpi-icon-box {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    .kpi-icon {
      width: 22px;
      height: 22px;
      transition: transform 0.3s ease;
    }
    .kpi-card-wrapper:hover .kpi-icon {
      transform: scale(1.1);
    }
    
    /* Themes */
    .theme-blue::after { background: #2563eb; }
    .theme-blue .kpi-icon-box {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.12) 100%);
      border: 1px solid rgba(59, 130, 246, 0.15);
    }
    .theme-blue .kpi-icon { color: #2563eb; }
    .theme-blue:hover { border-color: rgba(59, 130, 246, 0.3); }

    .theme-purple::after { background: #7c3aed; }
    .theme-purple .kpi-icon-box {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.12) 100%);
      border: 1px solid rgba(139, 92, 246, 0.15);
    }
    .theme-purple .kpi-icon { color: #7c3aed; }
    .theme-purple:hover { border-color: rgba(139, 92, 246, 0.3); }

    .theme-amber::after { background: #d97706; }
    .theme-amber .kpi-icon-box {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.12) 100%);
      border: 1px solid rgba(245, 158, 11, 0.15);
    }
    .theme-amber .kpi-icon { color: #d97706; }
    .theme-amber:hover { border-color: rgba(245, 158, 11, 0.3); }

    .theme-emerald::after { background: #059669; }
    .theme-emerald .kpi-icon-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%);
      border: 1px solid rgba(16, 185, 129, 0.15);
    }
    .theme-emerald .kpi-icon { color: #059669; }
    .theme-emerald:hover { border-color: rgba(16, 185, 129, 0.3); }

    /* Trend badge styles */
    .kpi-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 6px;
      width: fit-content;
    }
    .trend-up {
      color: #059669;
      background: rgba(5, 150, 105, 0.08);
    }
    .trend-down {
      color: #dc2626;
      background: rgba(220, 38, 38, 0.08);
    }
    .trend-icon {
      width: 12px;
      height: 12px;
    }
  `]
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

  getThemeClass(): string {
    if (!this.color) return 'theme-blue';
    if (this.color.includes('blue')) return 'theme-blue';
    if (this.color.includes('violet') || this.color.includes('purple')) return 'theme-purple';
    if (this.color.includes('amber') || this.color.includes('orange')) return 'theme-amber';
    if (this.color.includes('emerald') || this.color.includes('green')) return 'theme-emerald';
    return 'theme-blue';
  }
}

