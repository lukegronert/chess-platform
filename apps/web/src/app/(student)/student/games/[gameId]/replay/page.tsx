'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChessBoard } from '@/components/chess/ChessBoard';
import { MoveHistory } from '@/components/chess/MoveHistory';
import { useState } from 'react';
import type { GameSession, GameMove } from '@chess/shared';

interface PageProps {
  params: { gameId: string };
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function GameReplayPage({ params }: PageProps) {
  const { gameId } = params;
  const [currentIndex, setCurrentIndex] = useState(-1);

  const { data: game } = useQuery<GameSession>({
    queryKey: ['game', gameId],
    queryFn: () => api.get(`/games/${gameId}`),
  });

  const { data: moves = [] } = useQuery<GameMove[]>({
    queryKey: ['game-moves', gameId],
    queryFn: () => api.get(`/games/${gameId}/moves`),
  });

  const currentFen =
    currentIndex === -1
      ? INITIAL_FEN
      : moves[currentIndex]?.fenAfter ?? INITIAL_FEN;

  function goToStart() { setCurrentIndex(-1); }
  function goToPrev() { setCurrentIndex((i) => Math.max(-1, i - 1)); }
  function goToNext() { setCurrentIndex((i) => Math.min(moves.length - 1, i + 1)); }
  function goToEnd() { setCurrentIndex(moves.length - 1); }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-900">
        {game && (
          <div className="mb-3 text-white text-sm">
            {game.blackPlayer.displayName} (Black)
          </div>
        )}
        <div className="w-full max-w-lg">
          <ChessBoard fen={currentFen} disabled />
        </div>
        {game && (
          <div className="mt-3 text-white text-sm">
            {game.whitePlayer.displayName} (White)
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {[
            { label: '⏮', action: goToStart },
            { label: '◀', action: goToPrev },
            { label: '▶', action: goToNext },
            { label: '⏭', action: goToEnd },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="text-white bg-white/20 hover:bg-white/30 w-10 h-10 rounded-lg text-lg transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-white/50 text-xs mt-2">
          Move {currentIndex + 1} of {moves.length}
        </p>
      </div>

      <div className="w-64 bg-white border-l p-3">
        <MoveHistory
          moves={moves}
          selectedMoveIndex={currentIndex}
          onSelectMove={setCurrentIndex}
        />
      </div>
    </div>
  );
}
