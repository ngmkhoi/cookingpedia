import { AppError } from "../../lib/app-error";
import { prisma } from "../../lib/prisma";

export const bookmarksService = {
  async listMine(userId: string) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        recipe: {
          include: {
            author: {
              select: {
                username: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return bookmarks.map((bookmark) => bookmark.recipe);
  },

  async add(userId: string, recipeId: string) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });

    if (!recipe || recipe.status !== "PUBLISHED") {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    await prisma.bookmark.upsert({
      where: {
        userId_recipeId: {
          userId,
          recipeId: recipe.id
        }
      },
      update: {},
      create: {
        userId,
        recipeId: recipe.id
      }
    });

    const count = await prisma.bookmark.count({
      where: { recipeId: recipe.id }
    });

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { bookmarkCount: count }
    });
  },

  async remove(userId: string, recipeId: string) {
    await prisma.bookmark.delete({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });

    const count = await prisma.bookmark.count({
      where: { recipeId }
    });

    await prisma.recipe.update({
      where: { id: recipeId },
      data: { bookmarkCount: count }
    });
  }
};
