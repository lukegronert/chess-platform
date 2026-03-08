import type { GameMove, GameResult, GameStatus } from './game';
import type { Message } from './message';

// ── Event name constants ───────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Auth
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',

  // Game
  GAME_JOIN: 'game:join',
  GAME_LEAVE: 'game:leave',
  GAME_MOVE: 'game:move',
  GAME_RESIGN: 'game:resign',
  GAME_DRAW_OFFER: 'game:draw-offer',
  GAME_DRAW_RESPOND: 'game:draw-respond',
  GAME_ENDED: 'game:ended',
  GAME_CHALLENGE: 'game:challenge',
  GAME_ERROR: 'game:error',

  // In-game chat
  GAME_CHAT: 'game:chat',

  // Direct messages
  DM_NEW: 'dm:new',
  DM_NOTIFICATION: 'dm:notification',

  // Class board
  BOARD_NEW_POST: 'board:new-post',
} as const;

// ── Payload types ──────────────────────────────────────────────────────────

export interface AuthenticatePayload {
  accessToken: string;
}

export interface GameJoinPayload {
  gameId: string;
}

export interface GameMoveClientPayload {
  gameId: string;
  uci: string;
  san: string;
}

export interface GameMoveServerPayload {
  gameId: string;
  move: GameMove;
  fen: string;
  status: GameStatus;
}

export interface GameResignPayload {
  gameId: string;
}

export interface GameDrawOfferPayload {
  gameId: string;
}

export interface GameDrawRespondPayload {
  gameId: string;
  accepted: boolean;
}

export interface GameEndedPayload {
  gameId: string;
  result: GameResult;
  pgn: string;
}

export interface GameChallengePayload {
  gameId: string;
  challengerId: string;
  challengerName: string;
}

export interface GameChatPayload {
  gameId: string;
  content?: string; // client sends content; server sends message
  message?: Message; // server sends full message
}

export interface DmNewPayload {
  senderId: string;
  senderName: string;
  preview: string;
  conversationId: string;
}

export interface BoardNewPostPayload {
  classId: string;
  postId: string;
  authorName: string;
  preview: string;
}
