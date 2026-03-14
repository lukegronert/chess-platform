'use client';

import { useEffect, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@chess/shared';
import type { UserOnlinePayload, UsersOnlinePayload } from '@chess/shared';

export function useOnlineUsers(): Set<string> {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = connectSocket();

    socket.on(SOCKET_EVENTS.USERS_ONLINE, ({ userIds }: UsersOnlinePayload) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on(SOCKET_EVENTS.USER_ONLINE, ({ userId }: UserOnlinePayload) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }: UserOnlinePayload) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.off(SOCKET_EVENTS.USERS_ONLINE);
      socket.off(SOCKET_EVENTS.USER_ONLINE);
      socket.off(SOCKET_EVENTS.USER_OFFLINE);
    };
  }, []);

  return onlineUsers;
}
