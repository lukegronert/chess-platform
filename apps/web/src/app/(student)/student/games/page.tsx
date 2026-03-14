'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import { GameStatus, GameResult } from '@chess/shared';
import type { GameSession } from '@chess/shared';
import { format } from 'date-fns';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useAuth } from '@/hooks/useAuth';

type StudentOption = { id: string; displayName: string; avatarUrl: string | null };

export default function StudentGamesPage() {
  const { user } = useAuth();
  const onlineUsers = useOnlineUsers();
  const queryClient = useQueryClient();
  const [opponentId, setOpponentId] = useState('');
  const [search, setSearch] = useState('');
  const [showChallenge, setShowChallenge] = useState(false);

  const { data: students = [] } = useQuery<StudentOption[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/users/students'),
    enabled: showChallenge,
  });

  const filteredStudents = students.filter((s) =>
    s.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const { data: games = [] } = useQuery<GameSession[]>({
    queryKey: ['games'],
    queryFn: () => api.get('/games'),
    refetchInterval: 10000,
  });

  const challengeMutation = useMutation({
    mutationFn: (data: { opponentId: string; playAsWhite: boolean }) =>
      api.post('/games', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setShowChallenge(false);
      setOpponentId('');
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) =>
      api.patch(`/games/${id}`, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['games'] }),
  });

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Games</h1>
        <button
          onClick={() => setShowChallenge(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          ♟ Challenge Player
        </button>
      </div>

      {showChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-bold text-lg mb-4">Challenge a Player</h2>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpponentId(''); }}
              placeholder="Search by name..."
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {search && (
              <ul className="border rounded-lg mb-4 max-h-48 overflow-y-auto divide-y">
                {filteredStudents.length === 0 && (
                  <li className="px-3 py-2 text-sm text-gray-400">No students found</li>
                )}
                {filteredStudents.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => { setOpponentId(s.id); setSearch(s.displayName); }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${opponentId === s.id ? 'bg-blue-50 font-medium' : ''}`}
                  >
                    {s.displayName}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => challengeMutation.mutate({ opponentId, playAsWhite: true })}
                disabled={!opponentId || challengeMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Challenge
              </button>
              <button
                onClick={() => { setShowChallenge(false); setSearch(''); setOpponentId(''); }}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {games.map((game) => {
          const opponentId = game.whitePlayerId === user?.id ? game.blackPlayerId : game.whitePlayerId;
          const opponentName = game.whitePlayerId === user?.id ? game.blackPlayer.displayName : game.whitePlayer.displayName;
          const opponentOnline = onlineUsers.has(opponentId);
          return (
          <div key={game.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${opponentOnline ? 'bg-green-400' : 'bg-gray-300'}`}
                  title={opponentOnline ? `${opponentName} is online` : `${opponentName} is offline`}
                />
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

            {game.status === GameStatus.PENDING && (
              <div className="flex gap-2">
                <button
                  onClick={() => respondMutation.mutate({ id: game.id, action: 'accept' })}
                  className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => respondMutation.mutate({ id: game.id, action: 'decline' })}
                  className="text-sm border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}

            {game.status === GameStatus.ACTIVE && (
              <Link
                href={`/student/games/${game.id}`}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Play
              </Link>
            )}

            {game.status === GameStatus.COMPLETED && (
              <Link
                href={`/student/games/${game.id}/replay`}
                className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Replay
              </Link>
            )}
          </div>
        );})}
        {games.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">♟</p>
            <p>No games yet. Challenge a player to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
