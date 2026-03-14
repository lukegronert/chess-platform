import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { GameResult, GameStatus } from '@chess/shared';
import { initGame, removeGame } from '../services/game.service.js';
import { io } from '../sockets/index.js';
import { notifyGameChallenge } from '../sockets/messaging.socket.js';

const gameInclude = {
  whitePlayer: { select: { id: true, displayName: true, avatarUrl: true } },
  blackPlayer: { select: { id: true, displayName: true, avatarUrl: true } },
};

export async function listGames(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.sub;
    const games = await prisma.gameSession.findMany({
      where: {
        OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
      },
      include: gameInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(games);
  } catch (err) {
    next(err);
  }
}

export async function createGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { opponentId, playAsWhite } = z.object({
      opponentId: z.string(),
      playAsWhite: z.boolean().optional().default(true),
    }).parse(req.body);

    if (opponentId === req.user.sub) {
      throw new AppError(400, 'You cannot challenge yourself');
    }

    const opponent = await prisma.user.findUnique({ where: { id: opponentId } });
    if (!opponent) throw new AppError(404, 'Opponent not found');

    const whitePlayerId = playAsWhite ? req.user.sub : opponentId;
    const blackPlayerId = playAsWhite ? opponentId : req.user.sub;

    const game = await prisma.gameSession.create({
      data: { whitePlayerId, blackPlayerId },
      include: gameInclude,
    });

    notifyGameChallenge(io, opponentId, game.id, req.user.sub, req.user.displayName);

    res.status(201).json(game);
  } catch (err) {
    next(err);
  }
}

export async function getGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const game = await prisma.gameSession.findUnique({
      where: { id: req.params.id },
      include: {
        ...gameInclude,
        moves: { orderBy: { moveNumber: 'asc' } },
      },
    });
    if (!game) throw new AppError(404, 'Game not found');
    res.json(game);
  } catch (err) {
    next(err);
  }
}

export async function updateGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action } = z.object({ action: z.enum(['accept', 'decline']) }).parse(req.body);
    const userId = req.user.sub;

    const game = await prisma.gameSession.findUnique({ where: { id: req.params.id } });
    if (!game) throw new AppError(404, 'Game not found');
    if (game.blackPlayerId !== userId && game.whitePlayerId !== userId) {
      throw new AppError(403, 'Not a player in this game');
    }
    if (game.status !== GameStatus.PENDING) {
      throw new AppError(400, 'Game is not pending');
    }

    if (action === 'accept') {
      initGame(game.id, game.currentFen);
      const updated = await prisma.gameSession.update({
        where: { id: req.params.id },
        data: { status: GameStatus.ACTIVE, startedAt: new Date() },
        include: gameInclude,
      });
      res.json(updated);
    } else {
      const updated = await prisma.gameSession.update({
        where: { id: req.params.id },
        data: { status: GameStatus.ABANDONED, result: GameResult.ABANDONED, endedAt: new Date() },
        include: gameInclude,
      });
      res.json(updated);
    }
  } catch (err) {
    next(err);
  }
}

export async function resign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.sub;
    const game = await prisma.gameSession.findUnique({ where: { id: req.params.id } });
    if (!game) throw new AppError(404, 'Game not found');
    if (game.status !== GameStatus.ACTIVE) throw new AppError(400, 'Game is not active');

    const result =
      game.whitePlayerId === userId ? GameResult.BLACK_WINS : GameResult.WHITE_WINS;

    const updated = await prisma.gameSession.update({
      where: { id: req.params.id },
      data: { status: GameStatus.COMPLETED, result, endedAt: new Date() },
      include: gameInclude,
    });

    removeGame(game.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function getMoves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const moves = await prisma.gameMove.findMany({
      where: { gameId: req.params.id },
      orderBy: { moveNumber: 'asc' },
    });
    res.json(moves);
  } catch (err) {
    next(err);
  }
}

export async function listAllGames(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const games = await prisma.gameSession.findMany({
      include: gameInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(games);
  } catch (err) {
    next(err);
  }
}

export async function listTeacherStudentGames(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { class: { teacherId: req.user.sub } },
      select: { studentId: true },
    });
    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

    const games = await prisma.gameSession.findMany({
      where: {
        OR: [
          { whitePlayerId: { in: studentIds } },
          { blackPlayerId: { in: studentIds } },
        ],
      },
      include: gameInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(games);
  } catch (err) {
    next(err);
  }
}

export async function getGameMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await prisma.message.findMany({
      where: { gameId: req.params.id, isDeleted: false },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}
