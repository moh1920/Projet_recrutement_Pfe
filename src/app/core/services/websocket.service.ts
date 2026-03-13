// src/app/services/websocket.service.ts
import { Injectable } from '@angular/core';
import { Client, Message, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {

  private client!: Client;
  private subscriptions = new Map<string, { stomp: StompSubscription; subject: Subject<any> }>();
  private connected = false;

  /**
   * Connexion WebSocket avec le token Keycloak.
   * Appeler APRÈS que Keycloak ait fourni le token.
   *
   * @param keycloakToken - token obtenu via keycloak.token ou KeycloakService
   */
  connect(keycloakToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        // SockJS pointe vers votre Spring Boot
        webSocketFactory: () => new SockJS('http://localhost:8020/ws-meeting') as any,

        // Passer le token Keycloak dans le CONNECT STOMP
        connectHeaders: {
          Authorization: `Bearer ${keycloakToken}`,
        },

        // Reconnexion automatique toutes les 5s en cas de perte
        reconnectDelay: 5000,

        onConnect: () => {
          this.connected = true;
          console.log('[WS] Connecté au serveur de signalisation');
          resolve();
        },

        onStompError: (frame) => {
          console.error('[WS] Erreur STOMP :', frame);
          reject(frame);
        },

        onDisconnect: () => {
          this.connected = false;
          console.log('[WS] Déconnecté');
        },
      });

      this.client.activate();
    });
  }

  /**
   * S'abonner à une destination STOMP.
   * Retourne un Observable qui émet à chaque message reçu.
   */
  subscribe<T>(destination: string): Observable<T> {
    if (!this.subscriptions.has(destination)) {
      const subject = new Subject<T>();

      const stompSub = this.client.subscribe(destination, (msg: Message) => {
        subject.next(JSON.parse(msg.body) as T);
      });

      this.subscriptions.set(destination, { stomp: stompSub, subject });
    }

    return this.subscriptions.get(destination)!.subject.asObservable();
  }

  /**
   * Envoyer un message au serveur.
   * Le préfixe /app est ajouté automatiquement.
   */
  send(destination: string, body: any): void {
    if (!this.connected) {
      console.warn('[WS] Non connecté, impossible d\'envoyer :', destination);
      return;
    }

    this.client.publish({
      destination: `/app${destination}`,
      body: JSON.stringify(body),
    });
  }

  /** Se désabonner d'une destination */
  unsubscribe(destination: string): void {
    const sub = this.subscriptions.get(destination);
    if (sub) {
      sub.stomp.unsubscribe();
      sub.subject.complete();
      this.subscriptions.delete(destination);
    }
  }

  /** Déconnexion propre */
  disconnect(): void {
    this.subscriptions.forEach((sub) => {
      sub.stomp.unsubscribe();
      sub.subject.complete();
    });
    this.subscriptions.clear();
    this.client?.deactivate();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
