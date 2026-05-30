import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="donut-chart-container">
      <h3 class="chart-title">{{title}}</h3>
      <div class="chart-body">
        <div class="donut-wrapper">
          <ngx-charts-pie-chart
            [view]="[160, 160]"
            [results]="chartData"
            [doughnut]="true"
            [arcWidth]="0.25"
            [customColors]="customColors"
            [tooltipDisabled]="false"
            [labels]="false"
            (select)="onSelect($event)"
            (activate)="onActivate($event)"
            (deactivate)="onDeactivate($event)"
          >
          </ngx-charts-pie-chart>
          <div class="donut-center-label">
            <span class="donut-total-val">{{total}}</span>
            <span class="donut-total-lbl">Total</span>
          </div>
        </div>
        <div class="donut-legend">
          <div *ngFor="let item of data; let i = index" 
               class="legend-item"
               [ngClass]="{'item-dimmed': activeIndex !== null && activeIndex !== i}"
               (mouseenter)="activeIndex = i"
               (mouseleave)="activeIndex = null">
            <div class="legend-info">
              <div class="legend-color-dot" [ngStyle]="{'background-color': colors[i % colors.length]}"></div>
              <span class="legend-name">{{item.name}}</span>
            </div>
            <span class="legend-value">{{item.value}}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .donut-chart-container {
      width: 100%;
    }
    .chart-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 1.25rem 0;
      letter-spacing: -0.01em;
    }
    .chart-body {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      justify-content: space-between;
    }
    .donut-wrapper {
      position: relative;
      width: 160px;
      height: 160px;
      flex-shrink: 0;
    }
    .donut-center-label {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .donut-total-val {
      font-size: 1.625rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .donut-total-lbl {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-top: 2px;
    }
    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
    }
    .legend-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.375rem 0.5rem;
      border-radius: 8px;
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .legend-item:hover {
      background: rgba(241, 245, 249, 0.6);
    }
    .legend-info {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-width: 0;
    }
    .legend-color-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 1), 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .legend-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .legend-value {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #0f172a;
    }
    .item-dimmed {
      opacity: 0.35;
      transform: scale(0.98);
    }
  `]
})
export class DonutChartComponent implements OnChanges {
  @Input() data: { name: string; value: number }[] = [];
  @Input() colors: string[] = [];
  @Input() title!: string;

  chartData: any[] = [];
  customColors: any[] = [];
  total = 0;
  activeIndex: number | null = null;

  ngOnChanges() {
    this.total = this.data.reduce((s, d) => s + d.value, 0);
    this.chartData = this.data.map(d => ({ name: d.name, value: d.value }));
    this.customColors = this.data.map((d, i) => ({
      name: d.name,
      value: this.colors[i % this.colors.length]
    }));
  }

  onSelect(event: any) {}
  onActivate(event: any) {
    const idx = this.data.findIndex(d => d.name === event.value.name);
    if (idx >= 0) this.activeIndex = idx;
  }
  onDeactivate(event: any) {
    this.activeIndex = null;
  }
}
