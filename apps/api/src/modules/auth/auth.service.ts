import argon2 from "argon2";
import type { UserRole } from "@prisma/client";
import { AUTH_COOKIE_NAMES } from "../../constants/auth";
import { AppError } from "../../lib/app-error";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { prisma } from "../../lib/prisma";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const authService = {
  accessCookie: AUTH_COOKIE_NAMES.access,
  refreshCookie: AUTH_COOKIE_NAMES.refresh,

  async register(input: {
    email: string;
    password: string;
    displayName: string;
    username: string;
  }) {
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        username: input.username
      }
    });

    return this.createSession(user.id, user.role);
  },

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS");
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS");
    }

    return this.createSession(user.id, user.role);
  },

  async createSession(userId: string, role: UserRole) {
    const session = await prisma.session.create({
      data: {
        userId,
        refreshTokenHash: "pending",
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
      }
    });

    const payload = { sub: userId, role, sessionId: session.id };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await argon2.hash(refreshToken, { type: argon2.argon2id })
      }
    });

    return { accessToken, refreshToken, sessionId: session.id };
  },

  async rotate(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId }
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new AppError(401, "INVALID_SESSION");
    }

    const matches = await argon2.verify(session.refreshTokenHash, refreshToken);
    if (!matches) {
      throw new AppError(401, "INVALID_SESSION");
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    });

    return this.createSession(payload.sub, payload.role);
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true
      }
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND");
    }

    return user;
  },

  async revoke(sessionId: string) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });
  }
};
