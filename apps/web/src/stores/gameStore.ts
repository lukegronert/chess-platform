import { create } from 'zustand';
import type { GameSession, GameMove, GameResult } from '@chess/shared';

interface GameState {
  activeGame: GameSession | null;
  moves: GameMove[];
  currentFen: string;
  result: GameResult | null;
  pgn: string | null;
  drawOfferedByOpponent: boolean;
  setGame: (game: GameSession) => void;
  addMove: (move: GameMove, fen: string) => void;
  setEnded: (result: GameResult, pgn: string) => void;
  setDrawOffer: (offered: boolean) => void;
  clearGame: () => void;
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const useGameStore = create<GameState>((set) => ({
  activeGame: null,
  moves: [],
  currentFen: INITIAL_FEN,
  result: null,
  pgn: null,
  drawOfferedByOpponent: false,
  setGame: (game) =>
    set({
      activeGame: game,
      currentFen: game.currentFen,
      result: game.result,
      pgn: game.pgn,
      moves: [],
      drawOfferedByOpponent: false,
    }),
  addMove: (move, fen) =>
    set((state) => ({
      moves: [...state.moves, move],
      currentFen: fen,
    })),
  setEnded: (result, pgn) => set({ result, pgn }),
  setDrawOffer: (drawOfferedByOpponent) => set({ drawOfferedByOpponent }),
  clearGame: () =>
    set({
      activeGame: null,
      moves: [],
      currentFen: INITIAL_FEN,
      result: null,
      pgn: null,
      drawOfferedByOpponent: false,
    }),
}));
