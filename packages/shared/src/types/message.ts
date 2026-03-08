export enum MessageContextType {
  DIRECT = 'DIRECT',
  CLASS_BOARD = 'CLASS_BOARD',
  IN_GAME = 'IN_GAME',
}

export interface Message {
  id: string;
  senderId: string;
  sender: { id: string; displayName: string; avatarUrl: string | null };
  content: string;
  context: MessageContextType;
  recipientId: string | null;
  classId: string | null;
  gameId: string | null;
  createdAt: string;
  editedAt: string | null;
  isDeleted: boolean;
}

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface SendMessageRequest {
  content: string;
}
