import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { Role } from '@chess/shared';

const announcementSelect = {
  id: true,
  authorId: true,
  author: { select: { id: true, displayName: true } },
  classId: true,
  title: true,
  body: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
};

const createSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1),
  classId: z.string().optional(),
  isPinned: z.boolean().optional().default(false),
});

export async function listAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.sub;
    const role = req.user.role;

    // Get class IDs the user belongs to
    let classIds: string[] = [];
    if (role === Role.STUDENT) {
      const enrollments = await prisma.classEnrollment.findMany({
        where: { studentId: userId },
        select: { classId: true },
      });
      classIds = enrollments.map((e) => e.classId);
    } else if (role === Role.TEACHER) {
      const classes = await prisma.class.findMany({
        where: { teacherId: userId },
        select: { id: true },
      });
      classIds = classes.map((c) => c.id);
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { classId: null }, // platform-wide
          { classId: { in: classIds } },
        ],
      },
      select: announcementSelect,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(announcements);
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createSchema.parse(req.body);
    const role = req.user.role;

    // Only admin can create platform-wide announcements
    if (!data.classId && role !== Role.ADMIN) {
      throw new AppError(403, 'Only admins can create platform-wide announcements');
    }

    const announcement = await prisma.announcement.create({
      data: { ...data, authorId: req.user.sub },
      select: announcementSelect,
    });

    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createSchema.partial().parse(req.body);
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Announcement not found');
    if (existing.authorId !== req.user.sub && req.user.role !== Role.ADMIN) {
      throw new AppError(403, 'Cannot edit others announcements');
    }

    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data,
      select: announcementSelect,
    });
    res.json(announcement);
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Announcement not found');
    if (existing.authorId !== req.user.sub && req.user.role !== Role.ADMIN) {
      throw new AppError(403, 'Cannot delete others announcements');
    }

    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
}
