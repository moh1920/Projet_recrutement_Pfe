// src/app/models/meeting.models.ts

/** Message de signalisation WebRTC */
export interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  roomId: string;
  senderId: string;
  targetId: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

/** Événement de salon */
export interface RoomMessage {
  type: 'user-joined' | 'user-left' | 'user-list' | 'room-full' | 'host-ended'|'user-raised-hand'|'you-are-host';
  roomId: string;
  userId: string;
  displayName?: string;
  participants: ParticipantInfo[];
}

export interface ParticipantInfo {
  userId: string;
  displayName: string;
}

/** Stream vidéo d'un participant distant */
export interface RemoteStream {
  userId: string;
  displayName: string;
  stream: MediaStream;
}

/** Réponse API création de meeting */
export interface Meeting {
  id: string;
  roomCode: string;
  hostId: string;
  title: string;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  createdAt: string;
}
