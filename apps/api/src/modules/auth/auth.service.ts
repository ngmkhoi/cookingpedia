import argon2 from "argon2";
import { Prisma, type UserRole } from "@prisma/client";
import { z } from "zod";
import { AUTH_COOKIE_NAMES } from "../../constants/auth.js";
import { AppError } from "../../lib/app-error.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const emailSchema = z.string().email();
const usernameSchema = z.string().min(3);

const availabilityStatus = async (
  value: string | undefined,
  validator: { safeParse: (value: string) => { success: boolean } },
  exists: (value: string) => Promise<boolean>
) => {
  if (!value) {
    return { status: "unchecked" as const };
  }

  if (!validator.safeParse(value).success) {
    return { status: "invalid" as const };
  }

  return {
    status: (await exists(value)) ? ("taken" as const) : ("available" as const)
  };
};

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

    try {
      const user = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          displayName: input.displayName,
          username: input.username
        }
      });

      return this.createSession(user.id, user.role);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const targets = Array.isArray(error.meta?.target)
          ? error.meta.target.filter((target): target is string => typeof target === "string")
          : [];
        const fieldErrors: Record<string, string> = {};

        if (targets.includes("email")) {
          fieldErrors.email = "This email is already in use";
        }

        if (targets.includes("username")) {
          fieldErrors.username = "This username is already taken";
        }

        if (Object.keys(fieldErrors).length > 0) {
          throw new AppError(409, "FIELD_CONFLICT", undefined, fieldErrors);
        }

        throw new AppError(409, "USER_ALREADY_EXISTS");
      }

      throw error;
    }
  },

  async availability(input: { email?: string; username?: string }) {
    const email = input.email?.trim();
    const username = input.username?.trim();

    const [emailStatus, usernameStatus] = await Promise.all([
      availabilityStatus(email, emailSchema, async (value) => {
        const user = await prisma.user.findUnique({
          where: { email: value },
          select: { id: true }
        });

        return Boolean(user);
      }),
      availabilityStatus(username, usernameSchema, async (value) => {
        const user = await prisma.user.findUnique({
          where: { username: value },
          select: { id: true }
        });

        return Boolean(user);
      })
    ]);

    return {
      email: emailStatus,
      username: usernameStatus
    };
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
        locale: true,
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
