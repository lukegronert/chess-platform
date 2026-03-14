import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { Role, GameResult } from '@chess/shared';

const classSelect = {
  id: true,
  name: true,
  description: true,
  teacherId: true,
  teacher: { select: { id: true, displayName: true } },
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { enrollments: true } },
};

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  teacherId: z.string(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  teacherId: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export async function listClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, sub } = req.user;
    let where = {};

    if (role === Role.TEACHER) {
      where = { teacherId: sub };
    } else if (role === Role.STUDENT) {
      where = { enrollments: { some: { studentId: sub } } };
    }

    const classes = await prisma.class.findMany({
      where: { ...where, isArchived: false },
      select: classSelect,
      orderBy: { name: 'asc' },
    });

    res.json(classes);
  } catch (err) {
    next(err);
  }
}

export async function createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createSchema.parse(req.body);
    const cls = await prisma.class.create({
      data,
      select: classSelect,
    });
    res.status(201).json(cls);
  } catch (err) {
    next(err);
  }
}

export async function getClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      select: classSelect,
    });
    if (!cls) throw new AppError(404, 'Class not found');
    res.json(cls);
  } catch (err) {
    next(err);
  }
}

export async function updateClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateSchema.parse(req.body);
    const cls = await prisma.class.update({
      where: { id: req.params.id },
      data,
      select: classSelect,
    });
    res.json(cls);
  } catch (err) {
    next(err);
  }
}

export async function deleteClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.class.update({
      where: { id: req.params.id },
      data: { isArchived: true },
    });
    res.json({ message: 'Class archived' });
  } catch (err) {
    next(err);
  }
}

// ── Enrollments ───────────────────────────────────────────────────────────

export async function listEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId: req.params.id },
      include: {
        student: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { student: { displayName: 'asc' } },
    });
    res.json(enrollments);
  } catch (err) {
    next(err);
  }
}

export async function enrollStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { studentId } = z.object({ studentId: z.string() }).parse(req.body);
    const enrollment = await prisma.classEnrollment.create({
      data: { classId: req.params.id, studentId },
      include: {
        student: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });
    res.status(201).json(enrollment);
  } catch (err) {
    next(err);
  }
}

export async function unenrollStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.classEnrollment.delete({
      where: {
        classId_studentId: {
          classId: req.params.id,
          studentId: req.params.studentId,
        },
      },
    });
    res.json({ message: 'Student unenrolled' });
  } catch (err) {
    next(err);
  }
}

// ── Groups ────────────────────────────────────────────────────────────────

export async function listGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const groups = await prisma.classGroup.findMany({
      where: { classId: req.params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, displayName: true } },
          },
        },
      },
    });
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const group = await prisma.classGroup.create({
      data: { classId: req.params.id, name },
      include: { members: { include: { user: { select: { id: true, displayName: true } } } } },
    });
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

export async function updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const group = await prisma.classGroup.update({
      where: { id: req.params.groupId },
      data: { name },
      include: { members: { include: { user: { select: { id: true, displayName: true } } } } },
    });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

export async function deleteGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.classGroup.delete({ where: { id: req.params.groupId } });
    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
}

export async function addGroupMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.body);
    await prisma.groupMember.create({
      data: { groupId: req.params.groupId, userId },
    });
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    next(err);
  }
}

export async function removeGroupMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: req.params.groupId,
          userId: req.params.userId,
        },
      },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
}

// ── Class Games ───────────────────────────────────────────────────────────

export async function listClassGames(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId: req.params.id },
      select: { studentId: true },
    });
    const studentIds = enrollments.map((e) => e.studentId);
    const games = await prisma.gameSession.findMany({
      where: {
        OR: [{ whitePlayerId: { in: studentIds } }, { blackPlayerId: { in: studentIds } }],
      },
      select: {
        id: true,
        status: true,
        result: true,
        createdAt: true,
        whitePlayer: { select: { id: true, displayName: true } },
        blackPlayer: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(games);
  } catch (err) {
    next(err);
  }
}

// ── Class PDFs & Leaderboard ─────────────────────────────────────────────

export async function listClassPdfs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pdfs = await prisma.pdf.findMany({
      where: { classId: req.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        fileSize: true,
        uploaderId: true,
        uploader: { select: { id: true, displayName: true } },
        classId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pdfs);
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId: req.params.id },
      select: {
        studentId: true,
        student: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    const studentIds = enrollments.map((e) => e.studentId);

    // Only count intra-class games (both players are in this class)
    const games = await prisma.gameSession.findMany({
      where: {
        status: 'COMPLETED',
        result: { not: GameResult.ABANDONED },
        whitePlayerId: { in: studentIds },
        blackPlayerId: { in: studentIds },
      },
      select: { whitePlayerId: true, blackPlayerId: true, result: true },
    });

    const stats = new Map(studentIds.map((id) => [id, { wins: 0, losses: 0, draws: 0 }]));

    for (const game of games) {
      if (game.result === GameResult.WHITE_WINS) {
        stats.get(game.whitePlayerId)!.wins++;
        stats.get(game.blackPlayerId)!.losses++;
      } else if (game.result === GameResult.BLACK_WINS) {
        stats.get(game.blackPlayerId)!.wins++;
        stats.get(game.whitePlayerId)!.losses++;
      } else if (game.result === GameResult.DRAW) {
        stats.get(game.whitePlayerId)!.draws++;
        stats.get(game.blackPlayerId)!.draws++;
      }
    }

    const leaderboard = enrollments
      .map((e) => ({ student: e.student, ...stats.get(e.studentId)! }))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
}
