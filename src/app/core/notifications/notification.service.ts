// // src/app/core/notifications/notification.service.ts
// import { Injectable, OnDestroy } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
// import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import { KeycloakService } from 'keycloak-angular';
// import { NotificationDTO } from './notification.model';
//
// @Injectable({ providedIn: 'root' })
// export class NotificationService implements OnDestroy {
//
//   private readonly API = 'http://localhost:8020/api/notifications';
//   private readonly WS_URL = 'http://localhost:8020/ws-meeting';
//
//   private stompClient!: Client;
//   private stompSubs: StompSubscription[] = [];
//
//   private notifications$$ = new BehaviorSubject<NotificationDTO[]>([]);
//   private unreadCount$$   = new BehaviorSubject<number>(0);
//   private newNotif$$      = new Subject<NotificationDTO>();
//
//   notifications$  = this.notifications$$.asObservable();
//   unreadCount$    = this.unreadCount$$.asObservable();
//   newNotification$ = this.newNotif$$.asObservable();
//
//   isAdmin = false;
//
//   constructor(
//     private http: HttpClient,
//     private keycloak: KeycloakService
//   ) {}
//
//   async connect(): Promise<void> {
//     const token = await this.keycloak.getToken();
//     this.isAdmin = this.keycloak.getUserRoles().includes('candidate');
//
//     this.stompClient = new Client({
//       webSocketFactory: () => new SockJS(`${this.WS_URL}?token=${token}`),
//       reconnectDelay: 5000,
//       onConnect: () => this.onConnected(),
//       onStompError: frame => console.error('STOMP error', frame),
//     });
//
//     this.stompClient.activate();
//     this.loadNotifications();
//   }
//
//   disconnect(): void {
//     this.stompSubs.forEach(s => s.unsubscribe());
//     this.stompClient?.deactivate();
//   }
//
//   private onConnected(): void {
//     const personal = this.stompClient.subscribe(
//       '/user/queue/notifications',
//       (msg: IMessage) => this.handleIncoming(msg)
//     );
//     const count = this.stompClient.subscribe(
//       '/user/queue/notifications/count',
//       (msg: IMessage) => this.unreadCount$$.next(JSON.parse(msg.body))
//     );
//     const broadcast = this.stompClient.subscribe(
//       '/topic/notifications/broadcast',
//       (msg: IMessage) => this.handleIncoming(msg)
//     );
//
//     this.stompSubs.push(personal, count, broadcast);
//
//     if (this.isAdmin) {
//       const admin = this.stompClient.subscribe(
//         '/topic/notifications/admin',
//         (msg: IMessage) => this.handleIncoming(msg)
//       );
//       this.stompSubs.push(admin);
//     }
//   }
//
//   private handleIncoming(msg: IMessage): void {
//     const notif: NotificationDTO = JSON.parse(msg.body);
//     this.notifications$$.next([notif, ...this.notifications$$.value]);
//     if (!notif.read) this.unreadCount$$.next(this.unreadCount$$.value + 1);
//     this.newNotif$$.next(notif);
//   }
//
//   loadNotifications(): void {
//     this.http.get<NotificationDTO[]>(this.API).subscribe({
//       next: list => {
//         this.notifications$$.next(list);
//         this.unreadCount$$.next(list.filter(n => !n.read).length);
//       },
//       error: err => console.error('Erreur chargement notifications', err),
//     });
//   }
//
//   markAsRead(id: string): void {
//     this.http.put<void>(`${this.API}/${id}/read`, {}).subscribe(() => {
//       const updated = this.notifications$$.value.map(n =>
//         n.id === id ? { ...n, read: true } : n
//       );
//       this.notifications$$.next(updated);
//       this.unreadCount$$.next(updated.filter(n => !n.read).length);
//     });
//   }
//
//   markAllAsRead(): void {
//     this.http.put<void>(`${this.API}/read-all`, {}).subscribe(() => {
//       this.notifications$$.next(
//         this.notifications$$.value.map(n => ({ ...n, read: true }))
//       );
//       this.unreadCount$$.next(0);
//     });
//   }
//
//   delete(id: string): void {
//     this.http.delete<void>(`${this.API}/${id}`).subscribe(() => {
//       const filtered = this.notifications$$.value.filter(n => n.id !== id);
//       this.notifications$$.next(filtered);
//       this.unreadCount$$.next(filtered.filter(n => !n.read).length);
//     });
//   }
//
//   sendNotification(
//     recipientId: string, title: string,
//     message: string, type = 'INFO', link?: string
//   ): Observable<void> {
//     let params = new HttpParams()
//       .set('recipientId', recipientId)
//       .set('title', title)
//       .set('message', message)
//       .set('type', type);
//     if (link) params = params.set('link', link);
//     return this.http.post<void>(`${this.API}/send`, null, { params });
//   }
//
//   ngOnDestroy(): void { this.disconnect(); }
// }
