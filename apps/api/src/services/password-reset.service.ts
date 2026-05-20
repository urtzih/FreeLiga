import crypto from 'node:crypto';
import { prisma, Prisma } from '@freesquash/database';

const DEFAULT_TTL_MINUTES = 15;
const CLEANUP_RETENTION_DAYS = 7;
const DEFAULT_COOLDOWN_SECONDS = 60;

function getTokenTtlMs() {
  const ttlMinutes = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || DEFAULT_TTL_MINUTES);
  return Math.max(1, ttlMinutes) * 60 * 1000;
}

function getCooldownMs() {
  const cooldownSeconds = Number(process.env.PASSWORD_RESET_REQUEST_COOLDOWN_SECONDS || DEFAULT_COOLDOWN_SECONDS);
  return Math.max(0, cooldownSeconds) * 1000;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildResetUrl(token: string): string {
  const baseUrl = process.env.PASSWORD_RESET_URL || 'http://localhost:4173/reset-password';
  const url = new URL(baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

async function cleanupExpiredTokens() {
  const threshold = new Date(Date.now() - CLEANUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: threshold } },
        { usedAt: { not: null }, createdAt: { lt: threshold } },
      ],
    },
  });
}

export async function createPasswordResetToken(input: {
  userId: string;
  requestIp?: string;
  userAgent?: string;
}) {
  await cleanupExpiredTokens();

  const now = Date.now();
  const cooldownMs = getCooldownMs();

  if (cooldownMs > 0) {
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: input.userId,
        createdAt: { gt: new Date(now - cooldownMs) },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (recentToken) {
      return null;
    }
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(now + getTokenTtlMs());

  await prisma.passwordResetToken.create({
    data: {
      userId: input.userId,
      tokenHash,
      expiresAt,
      requestIp: input.requestIp,
      userAgent: input.userAgent,
    },
  });

  return {
    token: rawToken,
    resetUrl: buildResetUrl(rawToken),
    expiresAt,
  };
}

export async function validatePasswordResetToken(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();

  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      userId: true,
    },
  });
}

export async function consumePasswordResetToken(token: string, newPasswordHash: string) {
  const tokenHash = hashToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const tokenRow = await tx.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!tokenRow) {
      return { success: false as const };
    }

    await tx.user.update({
      where: { id: tokenRow.userId },
      data: { password: newPasswordHash },
    });

    await tx.passwordResetToken.update({
      where: { id: tokenRow.id },
      data: { usedAt: now },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        userId: tokenRow.userId,
        id: { not: tokenRow.id },
        usedAt: null,
      },
      data: {
        usedAt: now,
      },
    });

    return { success: true as const, userId: tokenRow.userId };
  });
}
