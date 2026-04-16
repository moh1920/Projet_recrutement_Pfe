// // src/app/core/notifications/notification-toast.component.ts
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { trigger, transition, style, animate } from '@angular/animations';
// import { Subscription } from 'rxjs';
// import { NotificationService } from './notification.service';
// import { NotificationDTO } from './notification.model';
//
// interface Toast extends NotificationDTO { _timer?: ReturnType<typeof setTimeout>; }
//
// @Component({
//   selector: 'app-notification-toast',
//   standalone: true,
//   imports: [CommonModule],
//   animations: [
//     trigger('slideIn', [
//       transition(':enter', [
//         style({ transform: 'translateX(110%)', opacity: 0 }),
//         animate('220ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
//       ]),
//       transition(':leave', [
//         animate('180ms ease-in', style({ transform: 'translateX(110%)', opacity: 0 }))
//       ])
//     ])
//   ],
//   template: `
//     <div class="toast-container">
//       <div *ngFor="let t of toasts; trackBy: trackById"
//            class="toast"
//            [class]="'toast-' + t.type.toLowerCase()"
//            [@slideIn]>
//
//         <div class="toast-icon" [class]="'icon-' + t.type.toLowerCase()">
//           {{ typeIcon(t.type) }}
//         </div>
//
//         <div class="toast-body">
//           <p class="toast-title">{{ t.title }}</p>
//           <p class="toast-msg">{{ t.message }}</p>
//         </div>
//
//         <button class="toast-close" (click)="dismiss(t.id)">✕</button>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .toast-container {
//       position: fixed; bottom: 24px; right: 24px;
//       z-index: 9999; display: flex; flex-direction: column;
//       gap: 10px; pointer-events: none;
//     }
//     .toast {
//       display: flex; align-items: flex-start; gap: 12px;
//       width: 320px; padding: 12px 14px;
//       background: #fff;
//       border: 1px solid #e5e7eb;
//       border-left: 3px solid transparent;
//       border-radius: 12px;
//       pointer-events: all;
//     }
//     .toast-info    { border-left-color: #3b82f6; }
//     .toast-success { border-left-color: #10b981; }
//     .toast-warning { border-left-color: #f59e0b; }
//     .toast-error   { border-left-color: #ef4444; }
//     .toast-meeting { border-left-color: #8b5cf6; }
//     .toast-task    { border-left-color: #ec4899; }
//     .toast-system  { border-left-color: #6b7280; }
//     .toast-icon {
//       width: 32px; height: 32px; border-radius: 50%;
//       display: flex; align-items: center; justify-content: center;
//       font-size: 14px; flex-shrink: 0;
//     }
//     .icon-info    { background: #eff6ff; }
//     .icon-success { background: #ecfdf5; }
//     .icon-warning { background: #fffbeb; }
//     .icon-error   { background: #fef2f2; }
//     .icon-meeting { background: #f5f3ff; }
//     .icon-task    { background: #fdf2f8; }
//     .icon-system  { background: #f9fafb; }
//     .toast-body { flex: 1; min-width: 0; }
//     .toast-title { font-size: 13px; font-weight: 600; margin: 0 0 2px; color: #111827; }
//     .toast-msg   { font-size: 12px; color: #6b7280; margin: 0; }
//     .toast-close {
//       background: none; border: none; cursor: pointer;
//       color: #d1d5db; font-size: 11px; padding: 2px;
//     }
//   `]
// })
// export class NotificationToastComponent implements OnInit, OnDestroy {
//   toasts: Toast[] = [];
//   private sub = new Subscription();
//
//   constructor(private notifService: NotificationService) {}
//
//   ngOnInit(): void {
//     this.sub.add(
//       this.notifService.newNotification$.subscribe(n => this.show(n))
//     );
//   }
//
//   show(n: NotificationDTO): void {
//     const toast: Toast = { ...n };
//     this.toasts.push(toast);
//     toast._timer = setTimeout(() => this.dismiss(n.id), 4000);
//   }
//
//   dismiss(id: string): void {
//     const idx = this.toasts.findIndex(t => t.id === id);
//     if (idx > -1) {
//       clearTimeout(this.toasts[idx]._timer);
//       this.toasts.splice(idx, 1);
//     }
//   }
//
//   typeIcon(type: string): string {
//     const icons: Record<string, string> = {
//       INFO: 'ℹ', SUCCESS: '✓', WARNING: '⚠',
//       ERROR: '✕', MEETING: '📅', TASK: '✔', SYSTEM: '⚙'
//     };
//     return icons[type] ?? 'ℹ';
//   }
//
//   trackById = (_: number, t: Toast) => t.id;
//
//   ngOnDestroy(): void { this.sub.unsubscribe(); }
// }
