import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="w-full" style="width: 100%;">
      <h4 class="text-sm font-semibold text-foreground mb-3" style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem;">{{title}}</h4>
      <div class="flex items-center gap-4" style="display: flex; align-items: center; gap: 1rem;">
        <div class="relative w-40 h-40 flex-shrink-0" style="position: relative; width: 160px; height: 160px; flex-shrink: 0;">
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
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
            <span class="text-xl font-bold text-foreground" style="font-size: 1.25rem; font-weight: bold;">{{total}}</span>
            <span class="text-[10px] text-muted-foreground" style="font-size: 0.625rem; color: #64748b;">Total</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 flex-1" style="display: flex; flex-direction: column; gap: 0.375rem; flex: 1;">
          <div *ngFor="let item of data; let i = index" 
               class="flex items-center justify-between text-xs cursor-default"
               style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; cursor: default; transition: opacity 0.2s;"
               (mouseenter)="activeIndex = i"
               (mouseleave)="activeIndex = null"
               [ngStyle]="{'opacity': activeIndex === null || activeIndex === i ? '1' : '0.5'}">
            <div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="width: 10px; height: 10px; border-radius: 50%;" [ngStyle]="{'background-color': colors[i % colors.length]}"></div>
              <span class="text-muted-foreground truncate max-w-[100px]" style="color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">{{item.name}}</span>
            </div>
            <span class="font-medium text-foreground" style="font-weight: 500;">{{item.value}}</span>
          </div>
        </div>
      </div>
    </div>
  `
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
