'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Message } from '@chess/shared';

interface MessageThreadProps {
  partnerId: string;
  partnerName: string;
}

export function MessageThread({ partnerId, partnerName }: MessageThreadProps) {
  const [input, setInput] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['thread', partnerId],
    queryFn: () => api.get(`/messages/conversations/${partnerId}`),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/messages/conversations/${partnerId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', partnerId] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
    setInput('');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{partnerName}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex flex-col max-w-xs',
              msg.senderId === user?.id ? 'ml-auto items-end' : 'mr-auto items-start',
            )}
          >
            <div
              className={cn(
                'rounded-2xl px-3 py-2 text-sm',
                msg.senderId === user?.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800',
              )}
            >
              {msg.isDeleted ? <em className="text-opacity-60">Message deleted</em> : msg.content}
            </div>
            <span className="text-xs text-gray-400 mt-0.5">
              {format(new Date(msg.createdAt), 'h:mm a')}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={sendMutation.isPending}
          className="bg-blue-600 text-white rounded-full px-4 py-2 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
