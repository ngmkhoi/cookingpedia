import { AppError } from "../../lib/app-error";
import { prisma } from "../../lib/prisma";

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
      avatarUrl?: string;
      bio?: string;
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
    } catch {
      throw new AppError(400, "PROFILE_UPDATE_FAILED");
    }
  }
};
