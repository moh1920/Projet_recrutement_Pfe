// notification.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { KeycloakService } from 'keycloak-angular';

export interface NotificationDTO {
  id: string; // String (ObjectId MongoDB), pas number
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'MEETING' | 'TASK' | 'SYSTEM';
  link?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private readonly API = 'http://localhost:8080/api/notifications';
  private readonly WS_URL = 'http://localhost:8080/ws-meeting';

  private stompClient!: Client;
  private stompSubscriptions: StompSubscription[] = [];

  // Streams RxJS
  private notificationsSubject = new BehaviorSubject<NotificationDTO[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private newNotificationSubject = new Subject<NotificationDTO>();

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();
  newNotification$ = this.newNotificationSubject.asObservable(); // pour les toasts

  isAdmin = false;

  constructor(
    private http: HttpClient,
    private keycloak: KeycloakService
  ) {}

  // ─────────────────────────────────────────────
  //  Connexion WebSocket (appeler depuis AppComponent.ngOnInit)
  // ─────────────────────────────────────────────

  async connect(): Promise<void> {
    const token = await this.keycloak.getToken();
    const roles = this.keycloak.getUserRoles();
    this.isAdmin = roles.includes('admin');

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${this.WS_URL}?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => this.onConnected(),
      onStompError: (frame) => console.error('STOMP error', frame),
      onDisconnect: () => console.log('WebSocket déconnecté'),
    });

    this.stompClient.activate();

    // Charger l'historique depuis l'API REST
    this.loadNotifications();
  }

  disconnect(): void {
    this.stompSubscriptions.forEach(s => s.unsubscribe());
    this.stompClient?.deactivate();
  }

  // ─────────────────────────────────────────────
  //  Souscriptions STOMP
  // ─────────────────────────────────────────────

  private onConnected(): void {
    // 1. Notifications personnelles en temps réel
    const personal = this.stompClient.subscribe(
      '/user/queue/notifications',
      (msg: IMessage) => this.handleIncoming(msg)
    );

    // 2. Mise à jour du compteur de non-lues
    const count = this.stompClient.subscribe(
      '/user/queue/notifications/count',
      (msg: IMessage) => {
        this.unreadCountSubject.next(JSON.parse(msg.body));
      }
    );

    // 3. Notifications broadcast (maintenance, annonces globales...)
    const broadcast = this.stompClient.subscribe(
      '/topic/notifications/broadcast',
      (msg: IMessage) => this.handleIncoming(msg)
    );

    this.stompSubscriptions.push(personal, count, broadcast);

    // 4. Souscription spécifique Admin
    if (this.isAdmin) {
      const adminSub = this.stompClient.subscribe(
        '/topic/notifications/admin',
        (msg: IMessage) => this.handleIncoming(msg)
      );
      this.stompSubscriptions.push(adminSub);
    }
  }

  private handleIncoming(msg: IMessage): void {
    const notification: NotificationDTO = JSON.parse(msg.body);

    // Insérer en tête de liste
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);

    if (!notification.read) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }

    // Émettre pour afficher un toast dans le composant
    this.newNotificationSubject.next(notification);
  }

  // ─────────────────────────────────────────────
  //  REST API
  // ─────────────────────────────────────────────

  loadNotifications(): void {
    this.http.get<NotificationDTO[]>(this.API).subscribe({
      next: (list) => {
        this.notificationsSubject.next(list);
        this.unreadCountSubject.next(list.filter(n => !n.read).length);
      },
      error: (err) => console.error('Erreur chargement notifications', err),
    });
  }

  // id = String (ObjectId MongoDB)
  markAsRead(id: string): void {
    this.http.put<void>(`${this.API}/${id}/read`, {}).subscribe(() => {
      const updated = this.notificationsSubject.value.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      this.notificationsSubject.next(updated);
      this.unreadCountSubject.next(updated.filter(n => !n.read).length);
    });
  }

  markAllAsRead(): void {
    this.http.put<void>(`${this.API}/read-all`, {}).subscribe(() => {
      this.notificationsSubject.next(
        this.notificationsSubject.value.map(n => ({ ...n, read: true }))
      );
      this.unreadCountSubject.next(0);
    });
  }

  delete(id: string): void {
    this.http.delete<void>(`${this.API}/${id}`).subscribe(() => {
      const filtered = this.notificationsSubject.value.filter(n => n.id !== id);
      this.notificationsSubject.next(filtered);
      this.unreadCountSubject.next(filtered.filter(n => !n.read).length);
    });
  }

  sendNotification(recipientId: string, title: string, message: string, type: string = 'INFO', link?: string): Observable<void> {
    let params = new HttpParams()
      .set('recipientId', recipientId)
      .set('title', title)
      .set('message', message)
      .set('type', type);

    if (link) {
      params = params.set('link', link);
    }

    return this.http.post<void>(`${this.API}/send`, null, { params });
  }

  broadcastNotification(title: string, message: string, type: string = 'SYSTEM', link?: string): Observable<void> {
    let params = new HttpParams()
      .set('title', title)
      .set('message', message)
      .set('type', type);

    if (link) {
      params = params.set('link', link);
    }

    return this.http.post<void>(`${this.API}/broadcast`, null, { params });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
