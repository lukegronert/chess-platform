'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Conversation } from '@chess/shared';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (partnerId: string, partnerName: string) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations'),
    refetchInterval: 10000,
  });

  return (
    <div className="flex flex-col h-full border-r">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-700">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <button
            key={conv.partnerId}
            onClick={() => onSelect(conv.partnerId, conv.partnerName)}
            className={cn(
              'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b',
              selectedId === conv.partnerId && 'bg-blue-50',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{conv.partnerName}</span>
              <span className="text-xs text-gray-400">
                {format(new Date(conv.lastMessageAt), 'MMM d')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500 truncate flex-1">{conv.lastMessage}</p>
              {conv.unreadCount > 0 && (
                <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">No conversations yet</p>
        )}
      </div>
    </div>
  );
}
