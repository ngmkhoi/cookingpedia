import { AppError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";

export const ratingsService = {
  async save(userId: string, recipeId: string, input: { score: number; comment?: string }) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });

    if (!recipe || recipe.status !== "PUBLISHED") {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    if (recipe.authorId === userId) {
      throw new AppError(400, "CANNOT_RATE_OWN_RECIPE");
    }

    const rating = await prisma.rating.upsert({
      where: {
        userId_recipeId: {
          userId,
          recipeId: recipe.id
        }
      },
      update: {
        score: input.score,
        comment: input.comment
      },
      create: {
        userId,
        recipeId: recipe.id,
        score: input.score,
        comment: input.comment
      }
    });

    const aggregate = await prisma.rating.aggregate({
      where: { recipeId: recipe.id },
      _avg: { score: true },
      _count: { _all: true }
    });

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        ratingAverage: aggregate._avg.score ?? 0,
        ratingCount: aggregate._count._all
      }
    });

    return {
      rating,
      summary: {
        ratingAverage: aggregate._avg.score ?? 0,
        ratingCount: aggregate._count._all
      }
    };
  },

  async getMine(userId: string, recipeId: string) {
    const rating = await prisma.rating.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });

    return rating;
  }
};
