'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import type { Class, ClassEnrollment } from '@chess/shared';

interface PageProps {
  params: { id: string };
}

type Tab = 'classmates' | 'pdfs' | 'board' | 'leaderboard';

type Pdf = {
  id: string;
  title: string;
  description: string | null;
  fileSize: number;
  uploader: { id: string; displayName: string };
  createdAt: string;
};

type BoardMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; displayName: string };
};

type LeaderboardEntry = {
  student: { id: string; displayName: string; avatarUrl: string | null };
  wins: number;
  losses: number;
  draws: number;
};

export default function StudentClassPage({ params }: PageProps) {
  const { id } = params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('classmates');
  const [boardInput, setBoardInput] = useState('');
  const [challengingId, setChallengingId] = useState<string | null>(null);

  const { data: cls } = useQuery<Class>({
    queryKey: ['class', id],
    queryFn: () => api.get(`/classes/${id}`),
  });

  const { data: enrollments = [] } = useQuery<ClassEnrollment[]>({
    queryKey: ['enrollments', id],
    queryFn: () => api.get(`/classes/${id}/enrollments`),
  });

  const { data: pdfs = [] } = useQuery<Pdf[]>({
    queryKey: ['class-pdfs', id],
    queryFn: () => api.get(`/classes/${id}/pdfs`),
    enabled: tab === 'pdfs',
  });

  const { data: boardMessages = [] } = useQuery<BoardMessage[]>({
    queryKey: ['board', id],
    queryFn: () => api.get(`/classes/${id}/board`),
    enabled: tab === 'board',
    refetchInterval: tab === 'board' ? 10000 : false,
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', id],
    queryFn: () => api.get(`/classes/${id}/leaderboard`),
    enabled: tab === 'leaderboard',
  });

  const postBoardMutation = useMutation({
    mutationFn: (content: string) => api.post(`/classes/${id}/board`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      setBoardInput('');
    },
  });

  const challengeMutation = useMutation({
    mutationFn: (opponentId: string) => api.post('/games', { opponentId, playAsWhite: true }),
    onSuccess: () => setChallengingId(null),
  });

  const openPdf = async (pdfId: string) => {
    const { viewUrl } = await api.get<{ viewUrl: string; expiresIn: number }>(`/pdfs/${pdfId}/view-url`);
    window.open(viewUrl, '_blank');
  };

  const classmates = enrollments.filter((e) => e.studentId !== user?.id);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'classmates', label: 'Classmates' },
    { key: 'pdfs', label: 'Resources' },
    { key: 'board', label: 'Board' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ];

  if (!cls) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
        {cls.description && <p className="text-gray-500 mt-1 text-sm">{cls.description}</p>}
        <p className="text-xs text-gray-400 mt-1">Teacher: {cls.teacher.displayName}</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Classmates */}
      {tab === 'classmates' && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Classmates ({classmates.length})
          </h2>
          {classmates.length === 0 ? (
            <p className="text-sm text-gray-400">No other students enrolled yet.</p>
          ) : (
            <div className="divide-y">
              {classmates.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <p className="text-sm font-medium text-gray-800">{e.student.displayName}</p>
                  {challengingId === e.studentId ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => challengeMutation.mutate(e.studentId)}
                        disabled={challengeMutation.isPending}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setChallengingId(null)}
                        className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setChallengingId(e.studentId)}
                      className="text-xs border border-blue-300 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      ♟ Challenge
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PDFs */}
      {tab === 'pdfs' && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Class Resources</h2>
          {pdfs.length === 0 ? (
            <p className="text-sm text-gray-400">No resources uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="min-w-0 mr-4">
                    <p className="text-sm font-medium text-gray-800 truncate">{pdf.title}</p>
                    {pdf.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{pdf.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(pdf.fileSize / 1024).toFixed(0)} KB · {pdf.uploader.displayName}
                    </p>
                  </div>
                  <button
                    onClick={() => openPdf(pdf.id)}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                  >
                    Open PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Board */}
      {tab === 'board' && (
        <div className="bg-white rounded-xl shadow-sm border flex flex-col" style={{ height: '500px' }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {boardMessages.length === 0 && (
              <p className="text-sm text-gray-400">No messages yet. Start the conversation!</p>
            )}
            {boardMessages.map((msg) => (
              <div key={msg.id}>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-800">{msg.sender.displayName}</span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{msg.content}</p>
              </div>
            ))}
          </div>
          <div className="border-t p-3 flex gap-2">
            <input
              value={boardInput}
              onChange={(e) => setBoardInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && boardInput.trim()) {
                  e.preventDefault();
                  postBoardMutation.mutate(boardInput.trim());
                }
              }}
              placeholder="Write a message... (Enter to send)"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => boardInput.trim() && postBoardMutation.mutate(boardInput.trim())}
              disabled={!boardInput.trim() || postBoardMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Class Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400">No games played within this class yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 w-8">#</th>
                  <th className="pb-2">Student</th>
                  <th className="pb-2 text-center">W</th>
                  <th className="pb-2 text-center">D</th>
                  <th className="pb-2 text-center">L</th>
                  <th className="pb-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => {
                  const points = entry.wins * 2 + entry.draws;
                  const isMe = entry.student.id === user?.id;
                  return (
                    <tr
                      key={entry.student.id}
                      className={`border-b last:border-0 ${isMe ? 'bg-blue-50' : ''}`}
                    >
                      <td className="py-2.5 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-2.5 font-medium">
                        {entry.student.displayName}
                        {isMe && <span className="ml-1.5 text-xs text-blue-500 font-normal">(you)</span>}
                      </td>
                      <td className="py-2.5 text-center text-green-600 font-medium">{entry.wins}</td>
                      <td className="py-2.5 text-center text-gray-500">{entry.draws}</td>
                      <td className="py-2.5 text-center text-red-500">{entry.losses}</td>
                      <td className="py-2.5 text-center font-bold">{points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Win = 2 pts · Draw = 1 pt · Loss = 0 pts · Based on games played within this class.
          </p>
        </div>
      )}
    </div>
  );
}
