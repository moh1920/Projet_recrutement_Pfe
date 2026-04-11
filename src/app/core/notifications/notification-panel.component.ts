// src/app/core/notifications/notification-panel.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationDTO } from './notification.model';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel">

      <div class="panel-header">
        <span class="panel-title">Notifications</span>
        <button class="mark-all-btn"
                (click)="markAllRead.emit()"
                [disabled]="!hasUnread">
          Tout marquer lu
        </button>
      </div>

      <div class="empty" *ngIf="notifications.length === 0">
        Aucune notification
      </div>

      <div class="list">
        <div *ngFor="let n of notifications"
             class="item"
             [class.unread]="!n.read"
             (click)="handleClick(n)">

          <span class="dot" [class]="'dot-' + n.type.toLowerCase()"
                *ngIf="!n.read"></span>

          <div class="body">
            <div class="row-top">
              <span class="ntitle">{{ n.title }}</span>
              <span class="ntime">{{ n.createdAt | date:'HH:mm' }}</span>
            </div>
            <p class="nmsg">{{ n.message }}</p>
          </div>

          <button class="del-btn"
                  (click)="$event.stopPropagation(); deleteNotif.emit(n.id)"
                  title="Supprimer">✕</button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .panel {
      position: absolute; top: calc(100% + 8px); right: 0;
      width: 360px; max-height: 480px;
      background: var(--color-background-primary, #fff);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.10);
      z-index: 1000; overflow: hidden;
      display: flex; flex-direction: column;
    }
    .panel-header {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #f3f4f6;
    }
    .panel-title { font-weight: 600; font-size: 15px; }
    .mark-all-btn {
      font-size: 12px; color: #3b82f6;
      background: none; border: none; cursor: pointer; padding: 0;
    }
    .mark-all-btn:disabled { opacity: 0.4; cursor: default; }
    .list { overflow-y: auto; flex: 1; }
    .item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px; cursor: pointer;
      border-bottom: 1px solid #f9fafb;
      transition: background 0.1s; position: relative;
    }
    .item:hover { background: #f9fafb; }
    .item.unread { background: #eff6ff; }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      flex-shrink: 0; margin-top: 5px;
    }
    .dot-info    { background: #3b82f6; }
    .dot-success { background: #10b981; }
    .dot-warning { background: #f59e0b; }
    .dot-error   { background: #ef4444; }
    .dot-meeting { background: #8b5cf6; }
    .dot-task    { background: #ec4899; }
    .dot-system  { background: #6b7280; }
    .body { flex: 1; min-width: 0; }
    .row-top {
      display: flex; justify-content: space-between;
      align-items: baseline; gap: 8px;
    }
    .ntitle { font-size: 13px; font-weight: 600; }
    .ntime  { font-size: 11px; color: #9ca3af; flex-shrink: 0; }
    .nmsg   {
      font-size: 12px; color: #6b7280; margin: 4px 0 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .del-btn {
      background: none; border: none; cursor: pointer;
      color: #d1d5db; font-size: 12px; padding: 2px 4px;
      opacity: 0; transition: opacity 0.15s;
    }
    .item:hover .del-btn { opacity: 1; }
    .empty {
      padding: 48px 16px; text-align: center;
      color: #9ca3af; font-size: 13px;
    }
  `]
})
export class NotificationPanelComponent {
  @Input() notifications: NotificationDTO[] = [];
  @Output() markRead    = new EventEmitter<string>();
  @Output() markAllRead = new EventEmitter<void>();
  @Output() deleteNotif = new EventEmitter<string>();

  get hasUnread(): boolean {
    return this.notifications.some(n => !n.read);
  }

  handleClick(n: NotificationDTO): void {
    if (!n.read) this.markRead.emit(n.id);
    if (n.link)  window.open(n.link, '_blank');
  }
}
