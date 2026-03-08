import { Server as SocketServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@chess/shared';
import type { JwtPayload } from '../middleware/auth.js';

export function setupMessagingSocket(socket: Socket, io: SocketServer, user: JwtPayload): void {
  // This module handles emitting notifications to recipients.
  // Actual message persistence happens in the REST API (messages.controller.ts).
  // The REST controller should call notifyDm / notifyBoardPost after creating messages.
  // Here we expose helpers that can be called from elsewhere.
  void socket;
  void io;
  void user;
}

// Called by REST controllers after message creation to push real-time notifications
export function notifyDm(
  io: SocketServer,
  recipientId: string,
  senderId: string,
  senderName: string,
  content: string,
): void {
  io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.DM_NEW, {
    senderId,
    senderName,
    preview: content.slice(0, 100),
    conversationId: senderId,
  });
}

export function notifyBoardPost(
  io: SocketServer,
  classId: string,
  postId: string,
  authorName: string,
  content: string,
  memberIds: string[],
): void {
  for (const memberId of memberIds) {
    io.to(`user:${memberId}`).emit(SOCKET_EVENTS.BOARD_NEW_POST, {
      classId,
      postId,
      authorName,
      preview: content.slice(0, 100),
    });
  }
}

export function notifyGameChallenge(
  io: SocketServer,
  recipientId: string,
  gameId: string,
  challengerId: string,
  challengerName: string,
): void {
  io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.GAME_CHALLENGE, {
    gameId,
    challengerId,
    challengerName,
  });
}
