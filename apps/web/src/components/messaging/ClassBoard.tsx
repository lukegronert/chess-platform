'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { connectSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@chess/shared';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import type { Message, BoardNewPostPayload } from '@chess/shared';

interface ClassBoardProps {
  classId: string;
  canPost?: boolean;
}

export function ClassBoard({ classId, canPost = true }: ClassBoardProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['board', classId],
    queryFn: () => api.get(`/classes/${classId}/board`),
  });

  const postMutation = useMutation({
    mutationFn: (content: string) => api.post(`/classes/${classId}/board`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', classId] });
      setInput('');
    },
  });

  useEffect(() => {
    const socket = connectSocket();
    socket.on(SOCKET_EVENTS.BOARD_NEW_POST, (payload: BoardNewPostPayload) => {
      if (payload.classId === classId) {
        queryClient.invalidateQueries({ queryKey: ['board', classId] });
      }
    });
    return () => { socket.off(SOCKET_EVENTS.BOARD_NEW_POST); };
  }, [classId, queryClient]);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                {msg.sender.displayName[0]}
              </div>
              <div>
                <p className="text-sm font-medium">{msg.sender.displayName}</p>
                <p className="text-xs text-gray-400">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-gray-400 py-16">No posts yet. Be the first to post!</p>
        )}
      </div>

      {canPost && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Post to the class board..."
              rows={3}
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              maxLength={2000}
            />
            <button
              onClick={() => postMutation.mutate(input)}
              disabled={!input.trim() || postMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 self-end"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
