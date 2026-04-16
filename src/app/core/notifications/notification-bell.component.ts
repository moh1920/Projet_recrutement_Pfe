// // src/app/core/notifications/notification-bell.component.ts
// import {
//   Component, OnInit, OnDestroy,
//   HostListener, ElementRef
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Subscription } from 'rxjs';
// import { NotificationService } from './notification.service';
// import { NotificationDTO } from './notification.model';
// import { NotificationPanelComponent } from './notification-panel.component';
//
// @Component({
//   selector: 'app-notification-bell',
//   standalone: true,
//   imports: [CommonModule, NotificationPanelComponent],
//   template: `
//     <div class="bell-wrapper">
//
//       <button class="bell-btn" (click)="togglePanel()">
//         <!-- Icône cloche SVG -->
//         <svg width="22" height="22" viewBox="0 0 24 24"
//              fill="none" stroke="currentColor"
//              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//           <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
//           <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
//         </svg>
//         <span class="badge" *ngIf="unreadCount > 0">
//           {{ unreadCount > 99 ? '99+' : unreadCount }}
//         </span>
//       </button>
//
//       <app-notification-panel
//         *ngIf="panelOpen"
//         [notifications]="notifications"
//         (markRead)="notifService.markAsRead($event)"
//         (markAllRead)="notifService.markAllAsRead()"
//         (deleteNotif)="notifService.delete($event)"
//       ></app-notification-panel>
//
//     </div>
//   `,
//   styles: [`
//     .bell-wrapper { position: relative; display: inline-block; }
//     .bell-btn {
//       position: relative; background: none; border: none;
//       cursor: pointer; padding: 8px; color: inherit;
//       border-radius: 8px; transition: background 0.15s;
//       display: flex; align-items: center;
//     }
//     .bell-btn:hover { background: rgba(0,0,0,0.06); }
//     .badge {
//       position: absolute; top: 2px; right: 2px;
//       min-width: 18px; height: 18px;
//       background: #ef4444; color: #fff;
//       font-size: 10px; font-weight: 600;
//       border-radius: 9px;
//       display: flex; align-items: center; justify-content: center;
//       padding: 0 4px;
//     }
//   `]
// })
// export class NotificationBellComponent implements OnInit, OnDestroy {
//   panelOpen = false;
//   unreadCount = 0;
//   notifications: NotificationDTO[] = [];
//
//   private subs = new Subscription();
//
//   constructor(
//     public notifService: NotificationService,
//     private elRef: ElementRef
//   ) {}
//
//   ngOnInit(): void {
//     this.subs.add(
//       this.notifService.unreadCount$.subscribe(c => this.unreadCount = c)
//     );
//     this.subs.add(
//       this.notifService.notifications$.subscribe(n => this.notifications = n)
//     );
//   }
//
//   togglePanel(): void { this.panelOpen = !this.panelOpen; }
//
//   // Ferme le panneau si clic en dehors
//   @HostListener('document:click', ['$event'])
//   onDocumentClick(event: MouseEvent): void {
//     if (!this.elRef.nativeElement.contains(event.target)) {
//       this.panelOpen = false;
//     }
//   }
//
//   ngOnDestroy(): void { this.subs.unsubscribe(); }
// }
