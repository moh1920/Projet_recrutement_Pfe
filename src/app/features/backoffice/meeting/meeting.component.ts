import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, NgZone
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { WebSocketService } from '../../../core/services/websocket.service';
import { WebRtcService } from '../../../core/services/webrtc.service';
import { MeetingApiService } from '../../../core/services/meeting-api.service';
import {
  ParticipantInfo, RemoteStream,
  RoomMessage, SignalMessage
} from '../../../core/models/meeting.models';
import { SrcObjectDirective } from '../../../core/directives/src-object.directive';

// ── Chat message model ──────────────────────────────────
interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [CommonModule, FormsModule, SrcObjectDirective],
  templateUrl: './meeting.component.html',
  styleUrls: ['./meeting.component.scss'],
})
export class MeetingComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  // ── Identité & salle ──────────────────────────────────
  roomCode!: string;
  myUserId!: string;
  myDisplayName!: string;
  meetingTitle = '';
  localStream!: MediaStream;

  // ── Participants & streams ────────────────────────────
  participants: ParticipantInfo[] = [];
  remoteStreams: RemoteStream[] = [];

  // ── Contrôles média ───────────────────────────────────
  isAudioOn      = true;
  isVideoOn      = true;
  isScreenSharing = false;
  private screenStream: MediaStream | null = null;

  // ── UI état ───────────────────────────────────────────
  isConnecting = true;
  errorMessage = '';
  showParticipants = false;
  showChat         = false;

  // ── Main levée ────────────────────────────────────────
  handRaised = false;
  raisedHands = new Set<string>();

  // ── Détection parole (speaking) ───────────────────────
  isSpeaking = false;
  speakingUsers = new Set<string>();
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private speakingInterval!: any;

  // ── Chat ──────────────────────────────────────────────
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  unreadCount = 0;

  // ── Timer ─────────────────────────────────────────────
  timerSeconds = 0;
  timerDisplay = '00:00';
  private timerInterval!: any;

  // ── Grille vidéo ─────────────────────────────────────
  get gridClass(): string {
    const count = this.remoteStreams.length + 1;
    return `grid-${Math.min(count, 6)}`;
  }

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wsService: WebSocketService,
    private webrtcService: WebRtcService,
    private meetingApi: MeetingApiService,
    private keycloakService: KeycloakService,
    private ngZone: NgZone,
  ) {}

  // ═════════════════════════════════════════════════════
  // INIT
  // ═════════════════════════════════════════════════════
  async ngOnInit(): Promise<void> {
    const urlSegments = this.router.url.split('/');
    this.roomCode = urlSegments[urlSegments.length - 1].split('?')[0].toUpperCase();

    try {
      // Identité Keycloak
      const profile = await this.keycloakService.loadUserProfile();
      this.myUserId      = profile.id ?? '';
      this.myDisplayName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();

      // Stream local
      this.localStream = await this.webrtcService.initLocalStream(true, true);
      this.webrtcService.setIdentity(this.myUserId, this.roomCode);

      // WebSocket
      const token = this.keycloakService.getKeycloakInstance().token ?? '';
      await this.wsService.connect(token);

      // Abonnements
      this.subs.push(
        this.wsService.subscribe<RoomMessage>(`/topic/room/${this.roomCode}`)
          .subscribe(msg => this.handleRoomEvent(msg)),

        this.wsService.subscribe<SignalMessage>(`/user/queue/signal`)
          .subscribe(msg => this.handleSignal(msg)),

        this.wsService.subscribe<RoomMessage>(`/user/queue/meeting`)
          .subscribe(msg => this.handlePrivateRoomEvent(msg)),

        // Chat via WebSocket
        this.wsService.subscribe<any>(`/topic/chat/${this.roomCode}`)
          .subscribe(msg => this.handleChatMessage(msg)),

        // Main levée via WebSocket
        this.wsService.subscribe<any>(`/topic/hand/${this.roomCode}`)
          .subscribe(msg => this.handleHandEvent(msg)),

        this.webrtcService.remoteStreamAdded$.subscribe(remote => {
          if (!this.remoteStreams.find(r => r.userId === remote.userId)) {
            this.remoteStreams = [...this.remoteStreams, remote];
          }
        }),

        this.webrtcService.remoteStreamRemoved$.subscribe(userId => {
          this.remoteStreams = this.remoteStreams.filter(r => r.userId !== userId);
          this.participants  = this.participants.filter(p => p.userId !== userId);
          this.speakingUsers.delete(userId);
          this.raisedHands.delete(userId);
        }),
      );

      // Rejoindre
      this.wsService.send('/meeting.join', {
        roomId:   this.roomCode,
        senderId: this.myUserId,
        displayName: this.myDisplayName,
      });

      // Démarrer timer et détection de parole
      this.startTimer();
      this.initSpeakingDetection();

      this.isConnecting = false;

    } catch (err: any) {
      this.errorMessage = err.message ?? 'Erreur de connexion au meeting';
      this.isConnecting = false;
      console.error('[Meeting] Erreur:', err);
    }
  }

  ngAfterViewInit(): void {}

  // ═════════════════════════════════════════════════════
  // TIMER
  // ═════════════════════════════════════════════════════
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const m = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
      const s = (this.timerSeconds % 60).toString().padStart(2, '0');
      this.timerDisplay = `${m}:${s}`;
    }, 1000);
  }

  // ═════════════════════════════════════════════════════
  // SPEAKING DETECTION
  // ═════════════════════════════════════════════════════
  private initSpeakingDetection(): void {
    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.speakingInterval = setInterval(() => {
        this.analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        this.ngZone.run(() => {
          this.isSpeaking = avg > 15;
        });
      }, 200);
    } catch (e) {
      console.warn('[Speaking] AudioContext non disponible', e);
    }
  }

  // ═════════════════════════════════════════════════════
  // ROOM EVENTS
  // ═════════════════════════════════════════════════════
  private async handleRoomEvent(msg: RoomMessage): Promise<void> {
    if (msg.type === 'user-joined' && msg.userId !== this.myUserId) {
      this.participants = msg.participants ?? [];
      await this.webrtcService.createPeerAndOffer(msg.userId, msg.displayName ?? msg.userId);
    }

    if (msg.type === 'user-left') {
      this.webrtcService.closePeer(msg.userId);
      this.participants = msg.participants ?? [];
    }

    if (msg.type === 'host-ended') {
      alert('L\'hôte a mis fin à la réunion.');
      this.exitMeeting();
    }

    if (msg.type === 'user-raised-hand') {
      if (msg.userId !== this.myUserId) {
        this.raisedHands.add(msg.userId);
        setTimeout(() => this.raisedHands.delete(msg.userId), 10000);
      }
    }

    if (msg.type === 'you-are-host') {
      this.meetingTitle += ' (Hôte)';
    }
  }

  private handlePrivateRoomEvent(msg: RoomMessage): void {
    if (msg.type === 'user-list') {
      this.participants = msg.participants ?? [];
    }
  }

  private async handleSignal(msg: SignalMessage): Promise<void> {
    const senderName = this.participants.find(p => p.userId === msg.senderId)?.displayName ?? msg.senderId;
    switch (msg.type) {
      case 'offer':         await this.webrtcService.handleOffer(msg, senderName); break;
      case 'answer':        await this.webrtcService.handleAnswer(msg); break;
      case 'ice-candidate': await this.webrtcService.handleIceCandidate(msg); break;
    }
  }

  // ═════════════════════════════════════════════════════
  // CHAT
  // ═════════════════════════════════════════════════════
  private handleChatMessage(msg: any): void {
    const chatMsg: ChatMessage = {
      senderId:   msg.senderId,
      senderName: msg.senderName,
      text:       msg.text,
      time:       new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    this.chatMessages.push(chatMsg);

    if (!this.showChat) {
      this.unreadCount++;
    }

    setTimeout(() => this.scrollChat(), 50);
  }

  sendChatMessage(): void {
    const text = this.chatInput.trim();
    if (!text) return;

    this.wsService.send(`/chat.send`, {
      roomId:     this.roomCode,
      senderId:   this.myUserId,
      senderName: this.myDisplayName,
      text,
    });

    this.chatInput = '';
  }

  private scrollChat(): void {
    if (this.chatContainer?.nativeElement) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }

  // ═════════════════════════════════════════════════════
  // MAIN LEVÉE
  // ═════════════════════════════════════════════════════
  private handleHandEvent(msg: any): void {
    if (msg.userId !== this.myUserId) {
      this.raisedHands.add(msg.userId);
      setTimeout(() => this.raisedHands.delete(msg.userId), 10000);
    }
  }

  toggleHand(): void {
    this.handRaised = !this.handRaised;
    if (this.handRaised) {
      this.wsService.send('/meeting.raiseHand', {
        roomId:   this.roomCode,
        senderId: this.myUserId,
      });
      // Baisser automatiquement après 10s
      setTimeout(() => {
        if (this.handRaised) this.handRaised = false;
      }, 10000);
    }
  }

  // ═════════════════════════════════════════════════════
  // PARTAGE ÉCRAN
  // ═════════════════════════════════════════════════════
  async toggleScreenShare(): Promise<void> {
    if (this.isScreenSharing) {
      this.stopScreenShare();
      return;
    }

    try {
      this.screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true, audio: false,
      });

      // Remplacer la piste vidéo dans tous les peers
      const videoTrack = this.screenStream?.getVideoTracks()[0];
     // this.webrtcService.replaceVideoTrack(videoTrack);

      // Arrêt auto si l'utilisateur clique "Arrêter le partage" dans le navigateur
      if (videoTrack)
      videoTrack.onended  = () => this.stopScreenShare();

      this.isScreenSharing = true;
    } catch (e) {
      console.warn('[ScreenShare] Annulé ou refusé', e);
    }
  }

  private stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    // Restaurer la caméra
    const camTrack = this.localStream.getVideoTracks()[0];
    if (camTrack) {
     // this.webrtcService.replaceVideoTrack(camTrack);
    }
    this.isScreenSharing = false;
  }

  // ═════════════════════════════════════════════════════
  // CONTRÔLES MÉDIA
  // ═════════════════════════════════════════════════════
  toggleAudio(): void {
    this.isAudioOn = !this.isAudioOn;
    this.webrtcService.toggleAudio(this.isAudioOn);
  }

  toggleVideo(): void {
    this.isVideoOn = !this.isVideoOn;
    this.webrtcService.toggleVideo(this.isVideoOn);
  }

  // ═════════════════════════════════════════════════════
  // UI TOGGLES
  // ═════════════════════════════════════════════════════
  toggleParticipants(): void {
    this.showParticipants = !this.showParticipants;
    if (this.showParticipants) this.showChat = false;
  }

  toggleChat(): void {
    this.showChat = !this.showChat;
    if (this.showChat) {
      this.showParticipants = false;
      this.unreadCount = 0;
      setTimeout(() => this.scrollChat(), 50);
    }
  }

  // ═════════════════════════════════════════════════════
  // QUITTER
  // ═════════════════════════════════════════════════════
  leaveMeeting(): void {
    this.wsService.send('/meeting.leave', {
      roomId:   this.roomCode,
      senderId: this.myUserId,
    });
    this.exitMeeting();
  }

  private exitMeeting(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.speakingInterval);
    this.audioContext?.close();
    this.stopScreenShare();
    this.webrtcService.closeAllPeers();
    this.webrtcService.stopLocalStream();
    this.wsService.disconnect();
    
    // Dynamic fallback
    if (this.router.url.includes('/admin/')) {
      this.router.navigate(['/admin/interviews']);
    } else {
      this.router.navigate(['/meeting-lobby']);
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.exitMeeting();
  }
}
