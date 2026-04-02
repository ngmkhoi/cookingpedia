import { Prisma } from "@prisma/client";
import { AppError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";

const toDbLocale = (locale?: "vi" | "en") => {
  if (!locale) {
    return undefined;
  }

  return locale === "vi" ? "VI" : "EN";
};

export const usersService = {
  async getPublicAuthor(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        recipes: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" }
        }
      }
    });
  },

  async updateMe(
    userId: string,
    input: {
      displayName?: string;
      username?: string;
      avatarUrl?: string | null;
      bio?: string | null;
      locale?: "vi" | "en";
    }
  ) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          ...input,
          locale: toDbLocale(input.locale)
        },
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          bio: true,
          locale: true
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const targets = Array.isArray(error.meta?.target)
          ? error.meta.target.filter((target): target is string => typeof target === "string")
          : [];
        const fieldErrors: Record<string, string> = {};

        if (targets.includes("username")) {
          fieldErrors.username = "This username is already taken";
        }

        if (Object.keys(fieldErrors).length > 0) {
          throw new AppError(409, "FIELD_CONFLICT", undefined, fieldErrors);
        }
      }

      throw new AppError(400, "PROFILE_UPDATE_FAILED");
    }
  }
};
