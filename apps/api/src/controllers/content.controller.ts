import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import * as storageService from '../services/storage.service.js';
import { Role } from '@chess/shared';

const pdfSelect = {
  id: true,
  title: true,
  description: true,
  r2Key: true,
  fileSize: true,
  uploaderId: true,
  uploader: { select: { id: true, displayName: true } },
  classId: true,
  createdAt: true,
};

export async function listPdfs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.sub;
    const role = req.user.role;

    let where = {};
    if (role === Role.STUDENT) {
      where = { assignments: { some: { studentId: userId } } };
    } else if (role === Role.TEACHER) {
      where = { uploaderId: userId };
    }

    const pdfs = await prisma.pdf.findMany({
      where,
      select: pdfSelect,
      orderBy: { createdAt: 'desc' },
    });
    res.json(pdfs);
  } catch (err) {
    next(err);
  }
}

export async function getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { contentType, filename } = z.object({
      contentType: z.string(),
      filename: z.string(),
    }).parse(req.body);

    if (contentType !== 'application/pdf') {
      throw new AppError(400, 'Only PDF files are allowed');
    }

    const r2Key = `pdfs/${req.user.sub}/${crypto.randomUUID()}-${filename}`;
    const uploadUrl = await storageService.getSignedUploadUrl(r2Key, contentType);

    res.json({ uploadUrl, r2Key });
  } catch (err) {
    next(err);
  }
}

export async function createPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      r2Key: z.string(),
      fileSize: z.number().positive(),
      classId: z.string().optional(),
    }).parse(req.body);

    const pdf = await prisma.pdf.create({
      data: { ...data, uploaderId: req.user.sub },
      select: pdfSelect,
    });
    res.status(201).json(pdf);
  } catch (err) {
    next(err);
  }
}

export async function getPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pdf = await prisma.pdf.findUnique({
      where: { id: req.params.id },
      select: pdfSelect,
    });
    if (!pdf) throw new AppError(404, 'PDF not found');
    res.json(pdf);
  } catch (err) {
    next(err);
  }
}

export async function getViewUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pdf = await prisma.pdf.findUnique({ where: { id: req.params.id } });
    if (!pdf) throw new AppError(404, 'PDF not found');

    const viewUrl = await storageService.getSignedViewUrl(pdf.r2Key);
    res.json({ viewUrl, expiresIn: 900 });
  } catch (err) {
    next(err);
  }
}

export async function deletePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pdf = await prisma.pdf.findUnique({ where: { id: req.params.id } });
    if (!pdf) throw new AppError(404, 'PDF not found');

    const isOwner = pdf.uploaderId === req.user.sub;
    const isAdmin = req.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) throw new AppError(403, 'Insufficient permissions');

    await storageService.deleteObject(pdf.r2Key);
    await prisma.pdf.delete({ where: { id: req.params.id } });
    res.json({ message: 'PDF deleted' });
  } catch (err) {
    next(err);
  }
}

// Assignments
export async function listAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.sub;
    const role = req.user.role;

    let where = {};
    if (role === Role.STUDENT) {
      where = { studentId: userId };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        pdf: { select: pdfSelect },
        student: { select: { id: true, displayName: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
    res.json(assignments);
  } catch (err) {
    next(err);
  }
}

export async function createAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = z.object({
      pdfId: z.string(),
      studentId: z.string(),
      dueAt: z.string().datetime().optional(),
    }).parse(req.body);

    const assignment = await prisma.assignment.create({
      data: {
        pdfId: data.pdfId,
        studentId: data.studentId,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      },
      include: {
        pdf: { select: pdfSelect },
        student: { select: { id: true, displayName: true } },
      },
    });
    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}

export async function updateAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = z.object({
      completedAt: z.string().datetime().optional().nullable(),
    }).parse(req.body);

    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: { completedAt: data.completedAt ? new Date(data.completedAt) : null },
    });
    res.json(assignment);
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.assignment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Assignment removed' });
  } catch (err) {
    next(err);
  }
}
