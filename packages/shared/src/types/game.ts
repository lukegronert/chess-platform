export enum GameStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum GameResult {
  WHITE_WINS = 'WHITE_WINS',
  BLACK_WINS = 'BLACK_WINS',
  DRAW = 'DRAW',
  ABANDONED = 'ABANDONED',
}

export interface GameSession {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  whitePlayer: { id: string; displayName: string; avatarUrl: string | null };
  blackPlayer: { id: string; displayName: string; avatarUrl: string | null };
  status: GameStatus;
  result: GameResult | null;
  pgn: string | null;
  currentFen: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface GameMove {
  id: string;
  gameId: string;
  moveNumber: number;
  san: string;
  uci: string;
  fenAfter: string;
  playedAt: string;
}

export interface CreateGameRequest {
  opponentId: string;
  playAsWhite?: boolean;
}
