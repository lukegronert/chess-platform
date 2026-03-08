import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { MessageContextType } from '@chess/shared';

const messageSelect = {
  id: true,
  senderId: true,
  sender: { select: { id: true, displayName: true, avatarUrl: true } },
  content: true,
  context: true,
  recipientId: true,
  classId: true,
  gameId: true,
  createdAt: true,
  editedAt: true,
  isDeleted: true,
};

// Direct messages
export async function listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.sub;

    // Get unique conversation partners
    const sent = await prisma.message.groupBy({
      by: ['recipientId'],
      where: { senderId: userId, context: MessageContextType.DIRECT, recipientId: { not: null } },
    });
    const received = await prisma.message.groupBy({
      by: ['senderId'],
      where: { recipientId: userId, context: MessageContextType.DIRECT },
    });

    const partnerIds = [
      ...new Set([
        ...sent.map((m) => m.recipientId!),
        ...received.map((m) => m.senderId),
      ]),
    ];

    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, displayName: true, avatarUrl: true },
    });

    const conversations = await Promise.all(
      partners.map(async (partner) => {
        const lastMsg = await prisma.message.findFirst({
          where: {
            context: MessageContextType.DIRECT,
            OR: [
              { senderId: userId, recipientId: partner.id },
              { senderId: partner.id, recipientId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });
        const unread = await prisma.message.count({
          where: {
            senderId: partner.id,
            recipientId: userId,
            context: MessageContextType.DIRECT,
            isDeleted: false,
          },
        });
        return {
          partnerId: partner.id,
          partnerName: partner.displayName,
          partnerAvatar: partner.avatarUrl,
          lastMessage: lastMsg?.content ?? '',
          lastMessageAt: lastMsg?.createdAt ?? new Date(),
          unreadCount: unread,
        };
      }),
    );

    res.json(conversations.sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    ));
  } catch (err) {
    next(err);
  }
}

export async function getThread(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.sub;
    const partnerId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;

    const messages = await prisma.message.findMany({
      where: {
        context: MessageContextType.DIRECT,
        OR: [
          { senderId: userId, recipientId: partnerId },
          { senderId: partnerId, recipientId: userId },
        ],
      },
      select: messageSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
}

export async function sendDm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    const message = await prisma.message.create({
      data: {
        senderId: req.user.sub,
        recipientId: req.params.userId,
        content,
        context: MessageContextType.DIRECT,
      },
      select: messageSelect,
    });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

export async function deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) throw new AppError(404, 'Message not found');
    if (message.senderId !== req.user.sub) throw new AppError(403, 'Cannot delete others messages');

    await prisma.message.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
}

// Class board messages
export async function getBoardMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;

    const messages = await prisma.message.findMany({
      where: { classId: req.params.id, context: MessageContextType.CLASS_BOARD, isDeleted: false },
      select: messageSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
}

export async function postToBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    const message = await prisma.message.create({
      data: {
        senderId: req.user.sub,
        classId: req.params.id,
        content,
        context: MessageContextType.CLASS_BOARD,
      },
      select: messageSelect,
    });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}
