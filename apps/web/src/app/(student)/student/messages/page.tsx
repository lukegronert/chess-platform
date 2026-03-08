'use client';

import { useState } from 'react';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';

export default function StudentMessagesPage() {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0">
        <ConversationList
          selectedId={selected?.id ?? null}
          onSelect={(id, name) => setSelected({ id, name })}
        />
      </div>
      <div className="flex-1">
        {selected ? (
          <MessageThread partnerId={selected.id} partnerName={selected.name} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
