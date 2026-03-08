'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Class, Announcement, GameSession } from '@chess/shared';
import { GameStatus } from '@chess/shared';

export default function StudentDashboard() {
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes'),
  });
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements'),
  });
  const { data: games = [] } = useQuery<GameSession[]>({
    queryKey: ['games'],
    queryFn: () => api.get('/games'),
  });

  const pendingGames = games.filter((g) => g.status === GameStatus.PENDING);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h1>

      {pendingGames.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h2 className="font-semibold text-yellow-800 mb-2">Game Challenges ({pendingGames.length})</h2>
          {pendingGames.map((game) => (
            <div key={game.id} className="flex items-center justify-between text-sm py-1">
              <span>Challenge from <strong>{game.whitePlayer.displayName}</strong></span>
              <Link href={`/student/games/${game.id}`} className="text-blue-600 hover:underline">View</Link>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">My Classes</h2>
          </div>
          <div className="space-y-2">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/student/classes/${cls.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <p className="font-medium text-sm group-hover:text-blue-600">{cls.name}</p>
                <span className="text-gray-300 group-hover:text-blue-400">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Announcements</h2>
          <div className="space-y-3">
            {announcements.slice(0, 5).map((ann) => (
              <div key={ann.id} className="border-l-4 border-blue-400 pl-3">
                {ann.isPinned && <span className="text-xs text-blue-600 font-medium">📌 Pinned </span>}
                <p className="font-medium text-sm">{ann.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{ann.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
