// src/app/services/webrtc.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { SignalMessage, RemoteStream } from '../models/meeting.models';

@Injectable({ providedIn: 'root' })
export class WebRtcService {

  // Émis quand un stream distant est disponible
  remoteStreamAdded$ = new Subject<RemoteStream>();

  // Émis quand un participant raccroche
  remoteStreamRemoved$ = new Subject<string>();

  // Connexions P2P actives : userId → RTCPeerConnection
  private peers = new Map<string, RTCPeerConnection>();

  // Display names des pairs connectés
  private peerNames = new Map<string, string>();

  // Stream local (caméra + micro)
  private localStream!: MediaStream;

  // Identité locale
  private myUserId!: string;
  private myRoomId!: string;

  // Configuration STUN/TURN
  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      // STUN gratuit Google (découverte IP publique)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },

      // ⚠️ En PRODUCTION : ajouter votre serveur TURN Coturn ici
      // {
      //   urls: ['turn:votre-serveur.com:3478', 'turns:votre-serveur.com:5349'],
      //   username: 'utilisateur',
      //   credential: 'motdepasse'
      // }
    ],
    iceCandidatePoolSize: 10,
  };

  constructor(private wsService: WebSocketService) {}

  // ─────────────────────────────────────────────────────────────
  // INITIALISATION DU STREAM LOCAL
  // ─────────────────────────────────────────────────────────────

  async initLocalStream(video = true, audio = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
      return this.localStream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Permission caméra/micro refusée. Veuillez autoriser dans le navigateur.');
      }
      throw err;
    }
  }

  setIdentity(userId: string, roomId: string): void {
    this.myUserId = userId;
    this.myRoomId = roomId;
  }

  // ─────────────────────────────────────────────────────────────
  // CRÉER UNE CONNEXION P2P AVEC UN PAIR
  // ─────────────────────────────────────────────────────────────

  async createPeerAndOffer(peerId: string, displayName: string): Promise<void> {
    this.peerNames.set(peerId, displayName);
    const pc = this.createPeerConnection(peerId);

    // Créer l'offre SDP
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);

    this.wsService.send('/meeting.signal', {
      type: 'offer',
      roomId: this.myRoomId,
      senderId: this.myUserId,
      targetId: peerId,
      data: offer,
    } as SignalMessage);
  }

  // ─────────────────────────────────────────────────────────────
  // GÉRER UNE OFFRE REÇUE
  // ─────────────────────────────────────────────────────────────

  async handleOffer(signal: SignalMessage, displayName: string): Promise<void> {
    this.peerNames.set(signal.senderId, displayName);
    const pc = this.createPeerConnection(signal.senderId);

    await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.wsService.send('/meeting.signal', {
      type: 'answer',
      roomId: this.myRoomId,
      senderId: this.myUserId,
      targetId: signal.senderId,
      data: answer,
    } as SignalMessage);
  }

  // ─────────────────────────────────────────────────────────────
  // GÉRER UNE RÉPONSE SDP
  // ─────────────────────────────────────────────────────────────

  async handleAnswer(signal: SignalMessage): Promise<void> {
    const pc = this.peers.get(signal.senderId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GÉRER UN CANDIDAT ICE
  // ─────────────────────────────────────────────────────────────

  async handleIceCandidate(signal: SignalMessage): Promise<void> {
    const pc = this.peers.get(signal.senderId);
    if (pc && signal.data) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.data as RTCIceCandidateInit));
      } catch (e) {
        console.error('[WebRTC] Erreur ajout ICE candidate :', e);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FERMER UNE CONNEXION P2P
  // ─────────────────────────────────────────────────────────────

  closePeer(peerId: string): void {
    this.peers.get(peerId)?.close();
    this.peers.delete(peerId);
    this.peerNames.delete(peerId);
    this.remoteStreamRemoved$.next(peerId);
  }

  closeAllPeers(): void {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.peerNames.clear();
  }

  // ─────────────────────────────────────────────────────────────
  // CONTRÔLES MÉDIA
  // ─────────────────────────────────────────────────────────────

  toggleAudio(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  toggleVideo(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  getLocalStream(): MediaStream {
    return this.localStream;
  }

  stopLocalStream(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVÉ : créer et configurer une RTCPeerConnection
  // ─────────────────────────────────────────────────────────────

  private createPeerConnection(peerId: string): RTCPeerConnection {
    // Éviter les doublons
    if (this.peers.has(peerId)) {
      this.peers.get(peerId)!.close();
    }

    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peers.set(peerId, pc);

    // Ajouter les pistes locales dans la connexion
    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream);
    });

    // Envoyer les candidats ICE au pair via WebSocket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wsService.send('/meeting.signal', {
          type: 'ice-candidate',
          roomId: this.myRoomId,
          senderId: this.myUserId,
          targetId: peerId,
          data: event.candidate.toJSON(),
        } as SignalMessage);
      }
    };

    // Réception du stream distant
    pc.ontrack = (event) => {
      const displayName = this.peerNames.get(peerId) ?? peerId;
      this.remoteStreamAdded$.next({
        userId: peerId,
        displayName,
        stream: event.streams[0],
      });
    };

    // Log des changements d'état de connexion
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Pair ${peerId} → ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.closePeer(peerId);
      }
    };

    return pc;
  }
}
