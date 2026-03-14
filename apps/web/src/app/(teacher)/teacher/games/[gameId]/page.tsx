'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ChessBoard } from '@/components/chess/ChessBoard';
import { MoveHistory } from '@/components/chess/MoveHistory';
import { useState } from 'react';
import { format } from 'date-fns';
import type { GameSession, GameMove } from '@chess/shared';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type GameMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; displayName: string; avatarUrl: string | null };
};

interface PageProps {
  params: { gameId: string };
}

export default function TeacherGameReviewPage({ params }: PageProps) {
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

  const { data: messages = [] } = useQuery<GameMessage[]>({
    queryKey: ['game-messages', gameId],
    queryFn: () => api.get(`/games/${gameId}/messages`),
  });

  const currentFen =
    currentIndex === -1 ? INITIAL_FEN : moves[currentIndex]?.fenAfter ?? INITIAL_FEN;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Board */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-900 min-w-0">
        {game && (
          <p className="mb-2 text-white/80 text-sm">{game.blackPlayer.displayName} (Black)</p>
        )}
        <div className="w-full max-w-md">
          <ChessBoard fen={currentFen} disabled />
        </div>
        {game && (
          <p className="mt-2 text-white/80 text-sm">{game.whitePlayer.displayName} (White)</p>
        )}
        <div className="flex gap-2 mt-4">
          {[
            { label: '⏮', action: () => setCurrentIndex(-1) },
            { label: '◀', action: () => setCurrentIndex((i) => Math.max(-1, i - 1)) },
            { label: '▶', action: () => setCurrentIndex((i) => Math.min(moves.length - 1, i + 1)) },
            { label: '⏭', action: () => setCurrentIndex(moves.length - 1) },
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
        <Link href="/teacher/games" className="mt-4 text-white/40 hover:text-white/70 text-xs transition-colors">
          ← Back to student games
        </Link>
      </div>

      {/* Move history */}
      <div className="w-52 bg-white border-l flex flex-col">
        <p className="font-semibold text-sm text-gray-700 px-3 pt-3 pb-2 border-b">Moves</p>
        <div className="flex-1 overflow-y-auto p-2">
          <MoveHistory moves={moves} selectedMoveIndex={currentIndex} onSelectMove={setCurrentIndex} />
        </div>
      </div>

      {/* Message log */}
      <div className="w-64 bg-gray-50 border-l flex flex-col">
        <p className="font-semibold text-sm text-gray-700 px-3 pt-3 pb-2 border-b">
          In-game Chat {messages.length > 0 && `(${messages.length})`}
        </p>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-gray-400">No messages in this game.</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-medium text-gray-700">{msg.sender.displayName}</span>
                <span className="text-xs text-gray-400">
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{msg.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
