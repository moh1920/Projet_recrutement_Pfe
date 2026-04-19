// src/app/core/notifications/notification.model.ts
export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'MEETING'
  | 'TASK'
  | 'SYSTEM';

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}
