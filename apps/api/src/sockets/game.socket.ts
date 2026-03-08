import { Server as SocketServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@chess/shared';
import { GameResult, GameStatus, MessageContextType } from '@chess/shared';
import type { JwtPayload } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { makeMove, getGameResult, getGame, removeGame, initGame } from '../services/game.service.js';

export function setupGameSocket(socket: Socket, io: SocketServer, user: JwtPayload): void {
  // Join a game room
  socket.on(SOCKET_EVENTS.GAME_JOIN, async ({ gameId }: { gameId: string }) => {
    const game = await prisma.gameSession.findUnique({ where: { id: gameId } });
    if (!game) return;

    const isPlayer = game.whitePlayerId === user.sub || game.blackPlayerId === user.sub;
    if (!isPlayer) return;

    socket.join(`game:${gameId}`);

    // If game is active but not in memory (server restart), reinit
    if (game.status === GameStatus.ACTIVE && !getGame(gameId)) {
      initGame(gameId, game.currentFen);
    }
  });

  socket.on(SOCKET_EVENTS.GAME_LEAVE, ({ gameId }: { gameId: string }) => {
    socket.leave(`game:${gameId}`);
  });

  // Handle a move
  socket.on(SOCKET_EVENTS.GAME_MOVE, async ({ gameId, uci }: { gameId: string; uci: string }) => {
    try {
      const game = await prisma.gameSession.findUnique({
        where: { id: gameId },
        include: { moves: { orderBy: { moveNumber: 'desc' }, take: 1 } },
      });

      if (!game || game.status !== GameStatus.ACTIVE) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { gameId, message: 'Game is not active' });
        return;
      }

      // Verify it's this player's turn
      const chess = getGame(gameId);
      if (!chess) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { gameId, message: 'Game state not found' });
        return;
      }

      const expectedPlayer =
        chess.turn() === 'w' ? game.whitePlayerId : game.blackPlayerId;
      if (expectedPlayer !== user.sub) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { gameId, message: 'Not your turn' });
        return;
      }

      // Validate and apply move server-side
      const result = makeMove(gameId, uci);
      if (!result) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { gameId, message: 'Illegal move' });
        return;
      }

      const { san, fen } = result;
      const moveNumber = (game.moves[0]?.moveNumber ?? 0) + 1;

      // Persist move
      const savedMove = await prisma.gameMove.create({
        data: { gameId, moveNumber, san, uci, fenAfter: fen },
      });

      // Check for game end
      const gameResult = getGameResult(chess);
      const newStatus = gameResult !== null ? GameStatus.COMPLETED : GameStatus.ACTIVE;

      await prisma.gameSession.update({
        where: { id: gameId },
        data: {
          currentFen: fen,
          status: newStatus,
          result: gameResult,
          endedAt: gameResult !== null ? new Date() : undefined,
          pgn: gameResult !== null ? chess.pgn() : undefined,
        },
      });

      // Broadcast move to both players
      io.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_MOVE, {
        gameId,
        move: savedMove,
        fen,
        status: newStatus,
      });

      if (gameResult !== null) {
        io.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_ENDED, {
          gameId,
          result: gameResult,
          pgn: chess.pgn(),
        });
        removeGame(gameId);
      }
    } catch (err) {
      console.error('game:move error', err);
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { gameId, message: 'Server error processing move' });
    }
  });

  // Resign
  socket.on(SOCKET_EVENTS.GAME_RESIGN, async ({ gameId }: { gameId: string }) => {
    try {
      const game = await prisma.gameSession.findUnique({ where: { id: gameId } });
      if (!game || game.status !== GameStatus.ACTIVE) return;

      const result =
        game.whitePlayerId === user.sub ? GameResult.BLACK_WINS : GameResult.WHITE_WINS;

      const chess = getGame(gameId);
      await prisma.gameSession.update({
        where: { id: gameId },
        data: {
          status: GameStatus.COMPLETED,
          result,
          endedAt: new Date(),
          pgn: chess?.pgn(),
        },
      });

      removeGame(gameId);

      io.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_ENDED, {
        gameId,
        result,
        pgn: chess?.pgn() ?? '',
      });
    } catch (err) {
      console.error('game:resign error', err);
    }
  });

  // Draw offer / respond — simple socket broadcast (no DB persistence needed for offers)
  socket.on(SOCKET_EVENTS.GAME_DRAW_OFFER, ({ gameId }: { gameId: string }) => {
    socket.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_DRAW_OFFER, {
      gameId,
      fromUserId: user.sub,
    });
  });

  socket.on(
    SOCKET_EVENTS.GAME_DRAW_RESPOND,
    async ({ gameId, accepted }: { gameId: string; accepted: boolean }) => {
      if (!accepted) {
        socket.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_DRAW_RESPOND, { gameId, accepted: false });
        return;
      }

      try {
        const chess = getGame(gameId);
        await prisma.gameSession.update({
          where: { id: gameId },
          data: {
            status: GameStatus.COMPLETED,
            result: GameResult.DRAW,
            endedAt: new Date(),
            pgn: chess?.pgn(),
          },
        });

        removeGame(gameId);

        io.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_ENDED, {
          gameId,
          result: GameResult.DRAW,
          pgn: chess?.pgn() ?? '',
        });
      } catch (err) {
        console.error('game:draw-respond error', err);
      }
    },
  );

  // In-game chat
  socket.on(SOCKET_EVENTS.GAME_CHAT, async ({ gameId, content }: { gameId: string; content: string }) => {
    try {
      const message = await prisma.message.create({
        data: {
          senderId: user.sub,
          gameId,
          content,
          context: MessageContextType.IN_GAME,
        },
        include: {
          sender: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });

      io.to(`game:${gameId}`).emit(SOCKET_EVENTS.GAME_CHAT, { gameId, message });
    } catch (err) {
      console.error('game:chat error', err);
    }
  });
}
