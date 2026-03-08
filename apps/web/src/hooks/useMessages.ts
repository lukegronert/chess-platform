'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '@/lib/socket';
import { useNotificationStore } from '@/stores/notificationStore';
import { SOCKET_EVENTS } from '@chess/shared';
import type { DmNewPayload } from '@chess/shared';

export function useMessages() {
  const queryClient = useQueryClient();
  const { incrementDms } = useNotificationStore();

  useEffect(() => {
    const socket = connectSocket();

    socket.on(SOCKET_EVENTS.DM_NEW, (payload: DmNewPayload) => {
      incrementDms();
      // Invalidate conversations list so it refreshes with new message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['thread', payload.senderId] });
    });

    return () => {
      socket.off(SOCKET_EVENTS.DM_NEW);
    };
  }, [queryClient, incrementDms]);
}
