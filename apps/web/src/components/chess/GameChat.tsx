'use client';

import { useState, useEffect, useRef } from 'react';
import { connectSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@chess/shared';
import type { Message, GameChatPayload } from '@chess/shared';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface GameChatProps {
  gameId: string;
  onSend: (content: string) => void;
}

export function GameChat({ gameId, onSend }: GameChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { user } = useAuthStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = connectSocket();

    socket.on(SOCKET_EVENTS.GAME_CHAT, (payload: GameChatPayload) => {
      if (payload.gameId === gameId && payload.message) {
        setMessages((prev) => [...prev, payload.message!]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    });

    return () => {
      socket.off(SOCKET_EVENTS.GAME_CHAT);
    };
  }, [gameId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  }

  return (
    <div className="flex flex-col h-full border-t pt-2">
      <h3 className="text-sm font-semibold text-gray-600 mb-2 px-2">Chat</h3>
      <div className="flex-1 overflow-y-auto px-2 space-y-1 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'text-sm',
              msg.senderId === user?.id ? 'text-blue-700' : 'text-gray-700',
            )}
          >
            <span className="font-medium">{msg.sender.displayName}: </span>
            <span>{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="px-2 pt-2 flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          className="flex-1 text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
          maxLength={200}
        />
        <button
          type="submit"
          className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
