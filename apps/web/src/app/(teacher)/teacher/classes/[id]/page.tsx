'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useRef } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import type { Class, ClassEnrollment } from '@chess/shared';
import { GameStatus, GameResult } from '@chess/shared';

interface PageProps {
  params: { id: string };
}

type Tab = 'roster' | 'pdfs' | 'board' | 'leaderboard' | 'games';

type ClassGame = {
  id: string;
  status: GameStatus;
  result: GameResult | null;
  createdAt: string;
  whitePlayer: { id: string; displayName: string };
  blackPlayer: { id: string; displayName: string };
};

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

type StudentOption = { id: string; displayName: string; avatarUrl: string | null };

export default function TeacherClassPage({ params }: PageProps) {
  const { id } = params;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('roster');
  const [boardInput, setBoardInput] = useState('');
  const [challengingId, setChallengingId] = useState<string | null>(null);

  // Enroll search state
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrollStudentId, setEnrollStudentId] = useState('');

  // PDF upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: cls } = useQuery<Class>({
    queryKey: ['class', id],
    queryFn: () => api.get(`/classes/${id}`),
  });

  const { data: enrollments = [] } = useQuery<ClassEnrollment[]>({
    queryKey: ['enrollments', id],
    queryFn: () => api.get(`/classes/${id}/enrollments`),
  });

  const { data: allStudents = [] } = useQuery<StudentOption[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/users/students'),
    enabled: tab === 'roster',
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

  const { data: classGames = [] } = useQuery<ClassGame[]>({
    queryKey: ['class-games', id],
    queryFn: () => api.get(`/classes/${id}/games`),
    enabled: tab === 'games',
  });

  const enrolledIds = new Set(enrollments.map((e) => e.studentId));
  const filteredStudents = allStudents.filter(
    (s) =>
      !enrolledIds.has(s.id) &&
      s.displayName.toLowerCase().includes(enrollSearch.toLowerCase()),
  );

  const enrollMutation = useMutation({
    mutationFn: (studentId: string) => api.post(`/classes/${id}/enrollments`, { studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', id] });
      setEnrollSearch('');
      setEnrollStudentId('');
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (studentId: string) => api.delete(`/classes/${id}/enrollments/${studentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments', id] }),
  });

  const challengeMutation = useMutation({
    mutationFn: (opponentId: string) => api.post('/games', { opponentId, playAsWhite: true }),
    onSuccess: () => setChallengingId(null),
  });

  const deletePdfMutation = useMutation({
    mutationFn: (pdfId: string) => api.delete(`/pdfs/${pdfId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['class-pdfs', id] }),
  });

  const postBoardMutation = useMutation({
    mutationFn: (content: string) => api.post(`/classes/${id}/board`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] });
      setBoardInput('');
    },
  });

  const openPdf = async (pdfId: string) => {
    const { viewUrl } = await api.get<{ viewUrl: string; expiresIn: number }>(`/pdfs/${pdfId}/view-url`);
    window.open(viewUrl, '_blank');
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      const { uploadUrl, r2Key } = await api.post<{ uploadUrl: string; r2Key: string }>(
        '/pdfs/upload-url',
        { contentType: 'application/pdf', filename: uploadFile.name },
      );
      await fetch(uploadUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: { 'Content-Type': 'application/pdf' },
      });
      await api.post('/pdfs', {
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || undefined,
        r2Key,
        fileSize: uploadFile.size,
        classId: id,
      });
      queryClient.invalidateQueries({ queryKey: ['class-pdfs', id] });
      setUploadTitle('');
      setUploadDesc('');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'roster', label: 'Roster' },
    { key: 'pdfs', label: 'Resources' },
    { key: 'board', label: 'Board' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'games', label: 'Games' },
  ];

  if (!cls) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
        {cls.description && <p className="text-gray-500 mt-1 text-sm">{cls.description}</p>}
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

      {/* Roster */}
      {tab === 'roster' && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Roster ({enrollments.length} students)
          </h2>

          {/* Enroll search */}
          <div className="mb-4">
            <input
              value={enrollSearch}
              onChange={(e) => { setEnrollSearch(e.target.value); setEnrollStudentId(''); }}
              placeholder="Search students to enroll..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {enrollSearch && (
              <ul className="border rounded-lg mt-1 max-h-40 overflow-y-auto divide-y shadow-sm">
                {filteredStudents.length === 0 && (
                  <li className="px-3 py-2 text-sm text-gray-400">No students found</li>
                )}
                {filteredStudents.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                  >
                    <span className="text-sm">{s.displayName}</span>
                    <button
                      onClick={() => enrollMutation.mutate(s.id)}
                      disabled={enrollMutation.isPending}
                      className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Enroll
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Student list */}
          <div className="divide-y">
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.student.displayName}</p>
                  <p className="text-xs text-gray-400">{e.student.email}</p>
                </div>
                <div className="flex gap-2">
                  {challengingId === e.studentId ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setChallengingId(e.studentId)}
                        className="text-xs border border-blue-300 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        ♟ Challenge
                      </button>
                      <button
                        onClick={() => unenrollMutation.mutate(e.studentId)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {enrollments.length === 0 && (
              <p className="text-sm text-gray-400 py-4">No students enrolled yet.</p>
            )}
          </div>
        </div>
      )}

      {/* PDFs */}
      {tab === 'pdfs' && (
        <div className="space-y-4">
          {/* Upload form */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Upload Resource</h2>
            <div className="space-y-3">
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Title *"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-3 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="flex-1 text-sm text-gray-500 file:mr-3 file:text-xs file:border file:rounded-lg file:px-3 file:py-1.5 file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadTitle.trim() || uploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>

          {/* PDF list */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">
              Class Resources ({pdfs.length})
            </h2>
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
                        {(pdf.fileSize / 1024).toFixed(0)} KB · {format(new Date(pdf.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openPdf(pdf.id)}
                        className="text-xs border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deletePdfMutation.mutate(pdf.id)}
                        disabled={deletePdfMutation.isPending}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Board */}
      {tab === 'board' && (
        <div className="bg-white rounded-xl shadow-sm border flex flex-col" style={{ height: '500px' }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {boardMessages.length === 0 && (
              <p className="text-sm text-gray-400">No messages yet. Post an announcement to get started.</p>
            )}
            {boardMessages.map((msg) => (
              <div key={msg.id}>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-800">{msg.sender.displayName}</span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
          <div className="border-t p-3 flex gap-2">
            <textarea
              value={boardInput}
              onChange={(e) => setBoardInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && boardInput.trim()) {
                  e.preventDefault();
                  postBoardMutation.mutate(boardInput.trim());
                }
              }}
              placeholder="Post an announcement... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <button
              onClick={() => boardInput.trim() && postBoardMutation.mutate(boardInput.trim())}
              disabled={!boardInput.trim() || postBoardMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors self-end"
            >
              Post
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
                  <th className="pb-2 text-center">Games</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => {
                  const points = entry.wins * 2 + entry.draws;
                  const games = entry.wins + entry.draws + entry.losses;
                  return (
                    <tr key={entry.student.id} className="border-b last:border-0">
                      <td className="py-2.5 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-2.5 font-medium">{entry.student.displayName}</td>
                      <td className="py-2.5 text-center text-green-600 font-medium">{entry.wins}</td>
                      <td className="py-2.5 text-center text-gray-500">{entry.draws}</td>
                      <td className="py-2.5 text-center text-red-500">{entry.losses}</td>
                      <td className="py-2.5 text-center font-bold">{points}</td>
                      <td className="py-2.5 text-center text-gray-400">{games}</td>
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

      {/* Games */}
      {tab === 'games' && (
        <div className="space-y-3">
          {classGames.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-4">♟</p>
              <p>No games played in this class yet.</p>
            </div>
          ) : (
            classGames.map((game) => {
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
                    href={`/teacher/games/${game.id}`}
                    className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Review
                  </Link>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
