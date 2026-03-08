import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { SOCKET_EVENTS } from '@chess/shared';
import type { JwtPayload } from '../middleware/auth.js';
import { setupGameSocket } from './game.socket.js';
import { setupMessagingSocket } from './messaging.socket.js';

export let io: SocketServer;

export function setupSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      (socket as SocketWithUser).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as SocketWithUser).user;
    // Join personal room for targeted notifications
    socket.join(`user:${user.sub}`);

    socket.emit(SOCKET_EVENTS.AUTHENTICATED, { userId: user.sub });

    setupGameSocket(socket, io, user);
    setupMessagingSocket(socket, io, user);

    socket.on('disconnect', () => {
      // cleanup handled per-socket in game socket
    });
  });

  return io;
}

export interface SocketWithUser extends Socket {
  user: JwtPayload;
}
