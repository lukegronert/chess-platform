import { Chess } from 'chess.js';
import { GameResult, GameStatus } from '@chess/shared';

// In-memory game state store — abstracted behind this interface so
// it can be swapped for a Redis adapter if multi-instance deployment is needed.
export interface GameStateAdapter {
  get(gameId: string): Chess | undefined;
  set(gameId: string, chess: Chess): void;
  delete(gameId: string): void;
}

class MemoryGameAdapter implements GameStateAdapter {
  private map = new Map<string, Chess>();
  get(gameId: string) { return this.map.get(gameId); }
  set(gameId: string, chess: Chess) { this.map.set(gameId, chess); }
  delete(gameId: string) { this.map.delete(gameId); }
}

export const gameStateAdapter: GameStateAdapter = new MemoryGameAdapter();

export function initGame(gameId: string, fen?: string): Chess {
  const chess = new Chess(fen);
  gameStateAdapter.set(gameId, chess);
  return chess;
}

export function getGame(gameId: string): Chess | undefined {
  return gameStateAdapter.get(gameId);
}

export function makeMove(gameId: string, uci: string): { chess: Chess; san: string; fen: string } | null {
  const chess = gameStateAdapter.get(gameId);
  if (!chess) return null;

  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length === 5 ? uci[4] as 'q' | 'r' | 'b' | 'n' : undefined;

  const move = chess.move({ from, to, promotion });
  if (!move) return null;

  return { chess, san: move.san, fen: chess.fen() };
}

export function getGameResult(chess: Chess): GameResult | null {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? GameResult.BLACK_WINS : GameResult.WHITE_WINS;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return GameResult.DRAW;
  }
  return null;
}

export function getGameStatus(result: GameResult | null): GameStatus {
  return result !== null ? GameStatus.COMPLETED : GameStatus.ACTIVE;
}

export function removeGame(gameId: string): void {
  gameStateAdapter.delete(gameId);
}
