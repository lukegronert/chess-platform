import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { CurriculumItemType } from '@chess/shared';

const itemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.nativeEnum(CurriculumItemType),
  pdfId: z.string().optional(),
  gameId: z.string().optional(),
  externalUrl: z.string().url().optional(),
  textContent: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function listItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.curriculumItem.findMany({
      where: { classId: req.params.id },
      include: {
        pdf: {
          select: { id: true, title: true, fileSize: true },
        },
      },
      orderBy: { position: 'asc' },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = itemSchema.parse(req.body);
    const count = await prisma.curriculumItem.count({ where: { classId: req.params.id } });
    const item = await prisma.curriculumItem.create({
      data: { ...data, classId: req.params.id, position: count },
      include: { pdf: { select: { id: true, title: true, fileSize: true } } },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = itemSchema.partial().parse(req.body);
    const item = await prisma.curriculumItem.update({
      where: { id: req.params.itemId },
      data,
      include: { pdf: { select: { id: true, title: true, fileSize: true } } },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.curriculumItem.delete({ where: { id: req.params.itemId } });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

export async function reorderItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { orderedIds } = z.object({ orderedIds: z.array(z.string()) }).parse(req.body);
    const classId = req.params.id;

    // Use transaction: null all positions first to avoid unique constraint,
    // then set new positions in order
    await prisma.$transaction([
      // Step 1: set all positions to null-safe large values temporarily
      ...orderedIds.map((id, idx) =>
        prisma.curriculumItem.update({
          where: { id, classId },
          data: { position: 10000 + idx },
        }),
      ),
      // Step 2: set final positions
      ...orderedIds.map((id, idx) =>
        prisma.curriculumItem.update({
          where: { id, classId },
          data: { position: idx },
        }),
      ),
    ]);

    const items = await prisma.curriculumItem.findMany({
      where: { classId },
      include: { pdf: { select: { id: true, title: true, fileSize: true } } },
      orderBy: { position: 'asc' },
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
}
