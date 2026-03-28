import { AppError } from "../../lib/app-error";
import { prisma } from "../../lib/prisma";

export const adminRecipesService = {
  listPending() {
    return prisma.recipe.findMany({
      where: { status: "PENDING" },
      include: {
        author: { select: { username: true, displayName: true } }
      },
      orderBy: { submittedAt: "asc" }
    });
  },

  async getForReview(id: string) {
    const recipe = await prisma.recipe.findFirst({
      where: { id },
      include: {
        author: { select: { username: true, displayName: true } },
        images: { orderBy: { sortOrder: "asc" } },
        ingredients: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { stepNumber: "asc" } }
      }
    });

    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return recipe;
  },

  approve(id: string, reviewerId: string) {
    return prisma.recipe.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        rejectionReason: null
      }
    });
  },

  reject(id: string, reviewerId: string, rejectionReason: string) {
    return prisma.recipe.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        rejectionReason
      }
    });
  }
};
