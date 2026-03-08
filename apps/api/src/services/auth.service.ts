import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { JwtPayload } from '../middleware/auth.js';
import { Role } from '@chess/shared';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    subject: payload.sub,
  });
}

export function signRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = signRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role as Role,
    displayName: user.displayName,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function refreshAccessToken(token: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  if (!record.user.isActive) {
    throw new AppError(401, 'Account is deactivated');
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const newRefreshToken = await createRefreshToken(record.userId);

  const payload: JwtPayload = {
    sub: record.user.id,
    email: record.user.email,
    role: record.user.role as Role,
    displayName: record.user.displayName,
  };

  const accessToken = signAccessToken(payload);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revokedAt: new Date() },
  });
}
