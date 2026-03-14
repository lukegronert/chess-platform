'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { GameStatus, GameResult } from '@chess/shared';
import type { GameSession } from '@chess/shared';

const resultLabel: Partial<Record<GameResult, string>> = {
  [GameResult.WHITE_WINS]: 'White wins',
  [GameResult.BLACK_WINS]: 'Black wins',
  [GameResult.DRAW]: 'Draw',
  [GameResult.ABANDONED]: 'Abandoned',
};

const statusColors: Record<GameStatus, string> = {
  [GameStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
  [GameStatus.ACTIVE]: 'bg-green-100 text-green-700',
  [GameStatus.COMPLETED]: 'bg-gray-100 text-gray-600',
  [GameStatus.ABANDONED]: 'bg-red-100 text-red-600',
};

export default function AdminGamesPage() {
  const { data: games = [], isLoading } = useQuery<GameSession[]>({
    queryKey: ['admin-games'],
    queryFn: () => api.get('/games/admin/all'),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Games</h1>
      <div className="space-y-3">
        {games.map((game) => (
          <div key={game.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">
                  {game.whitePlayer.displayName} vs {game.blackPlayer.displayName}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[game.status]}`}>
                  {game.status}
                </span>
              </div>
              {game.result && (
                <p className="text-xs text-gray-500">{resultLabel[game.result]}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(game.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            <Link
              href={`/admin/games/${game.id}`}
              className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Review
            </Link>
          </div>
        ))}
        {games.length === 0 && (
          <div className="text-center py-16 text-gray-400">No games yet.</div>
        )}
      </div>
    </div>
  );
}
