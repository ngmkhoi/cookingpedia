import { AppError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toDbLocale = (locale?: "vi" | "en") => (locale === "en" ? "EN" : "VI");

type RecipeInput = {
  title: string;
  shortDescription: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  category: string;
  cuisine: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  locale?: "vi" | "en";
  coverImageUrl?: string;
  images: Array<{
    imageUrl: string;
    caption?: string;
    sortOrder: number;
  }>;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    sortOrder: number;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
  }>;
};

type PublicRecipeDiscoveryQuery = {
  q?: string;
  category?: string;
  sort: "newest" | "mostSaved";
  cuisine?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  maxCookMinutes?: number;
};

const recipeInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  ingredients: { orderBy: { sortOrder: "asc" as const } },
  steps: { orderBy: { stepNumber: "asc" as const } }
};

export const recipesService = {
  async createDraft(authorId: string, input: RecipeInput) {
    const slug = `${slugify(input.title)}-${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          authorId,
          title: input.title,
          slug,
          shortDescription: input.shortDescription,
          prepMinutes: input.prepMinutes,
          cookMinutes: input.cookMinutes,
          servings: input.servings,
          coverImageUrl: input.coverImageUrl,
          category: input.category,
          cuisine: input.cuisine,
          difficulty: input.difficulty,
          locale: toDbLocale(input.locale)
        }
      });

      if (input.images.length > 0) {
        await tx.recipeImage.createMany({
          data: input.images.map((image) => ({ ...image, recipeId: recipe.id }))
        });
      }

      await tx.ingredient.createMany({
        data: input.ingredients.map((ingredient) => ({
          recipeId: recipe.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          sortOrder: ingredient.sortOrder
        }))
      });

      await tx.step.createMany({
        data: input.steps.map((step) => ({
          recipeId: recipe.id,
          stepNumber: step.stepNumber,
          instruction: step.instruction
        }))
      });

      return tx.recipe.findUniqueOrThrow({
        where: { id: recipe.id },
        include: recipeInclude
      });
    });
  },

  async listMine(authorId: string) {
    return prisma.recipe.findMany({
      where: { authorId },
      orderBy: { updatedAt: "desc" }
    });
  },

  async getEditable(recipeId: string, authorId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        authorId,
        status: { in: ["DRAFT", "REJECTED", "PENDING"] }
      },
      include: recipeInclude
    });

    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return recipe;
  },

  async updateDraft(recipeId: string, authorId: string, input: RecipeInput) {
    const existing = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        authorId,
        status: { in: ["DRAFT", "REJECTED"] }
      }
    });

    if (!existing) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          title: input.title,
          shortDescription: input.shortDescription,
          prepMinutes: input.prepMinutes,
          cookMinutes: input.cookMinutes,
          servings: input.servings,
          coverImageUrl: input.coverImageUrl,
          category: input.category,
          cuisine: input.cuisine,
          difficulty: input.difficulty,
          locale: toDbLocale(input.locale),
          rejectionReason: null
        }
      });

      await tx.recipeImage.deleteMany({ where: { recipeId } });
      await tx.ingredient.deleteMany({ where: { recipeId } });
      await tx.step.deleteMany({ where: { recipeId } });

      if (input.images.length > 0) {
        await tx.recipeImage.createMany({
          data: input.images.map((image) => ({ ...image, recipeId }))
        });
      }

      await tx.ingredient.createMany({
        data: input.ingredients.map((ingredient) => ({
          recipeId,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          sortOrder: ingredient.sortOrder
        }))
      });

      await tx.step.createMany({
        data: input.steps.map((step) => ({
          recipeId,
          stepNumber: step.stepNumber,
          instruction: step.instruction
        }))
      });

      return tx.recipe.findUniqueOrThrow({
        where: { id: recipeId },
        include: recipeInclude
      });
    });
  },

  async deleteOwned(recipeId: string, authorId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        authorId,
        status: { in: ["DRAFT", "REJECTED"] }
      }
    });

    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    await prisma.recipe.delete({
      where: { id: recipeId }
    });
  },

  async moveToDraft(recipeId: string, authorId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        authorId,
        status: "PENDING"
      }
    });

    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status: "DRAFT",
        submittedAt: null,
        reviewedAt: null,
        reviewedById: null,
        rejectionReason: null
      },
      include: recipeInclude
    });
  },

  async submit(recipeId: string, authorId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, authorId },
      include: {
        ingredients: true,
        steps: true
      }
    });

    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    if (
      !recipe.coverImageUrl ||
      recipe.ingredients.length === 0 ||
      recipe.steps.length === 0
    ) {
      throw new AppError(400, "RECIPE_NOT_READY");
    }

    return prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status: "PENDING",
        submittedAt: new Date(),
        rejectionReason: null
      }
    });
  }
};

export const publicRecipesService = {
  async home() {
    const [trending, newest, categories] = await Promise.all([
      prisma.recipe.findMany({
        where: { status: "PUBLISHED" },
        include: {
          author: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: [
          { bookmarkCount: "desc" },
          { ratingAverage: "desc" },
          { createdAt: "desc" }
        ],
        take: 4
      }),
      prisma.recipe.findMany({
        where: { status: "PUBLISHED" },
        include: {
          author: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 7
      }),
      prisma.recipe.groupBy({
        by: ["category"],
        where: { status: "PUBLISHED" },
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
        take: 6
      })
    ]);

    return {
      trending,
      newest,
      categories: categories.map((item) => ({
        name: item.category,
        recipeCount: item._count.category
      }))
    };
  },

  async search(query: PublicRecipeDiscoveryQuery) {
    const where: Record<string, unknown> = {
      status: "PUBLISHED"
    };

    const andClauses: Array<Record<string, unknown>> = [];

    if (query.q) {
      andClauses.push({
        OR: [
          {
            title: {
              contains: query.q,
              mode: "insensitive"
            }
          },
          {
            ingredients: {
              some: {
                name: {
                  contains: query.q,
                  mode: "insensitive"
                }
              }
            }
          }
        ]
      });
    }

    if (query.category) {
      andClauses.push({
        category: query.category
      });
    }

    if (query.cuisine) {
      andClauses.push({
        cuisine: query.cuisine
      });
    }

    if (query.difficulty) {
      andClauses.push({
        difficulty: query.difficulty
      });
    }

    if (query.maxCookMinutes !== undefined) {
      andClauses.push({
        cookMinutes: {
          lte: query.maxCookMinutes
        }
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    return prisma.recipe.findMany({
      where,
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy:
        query.sort === "mostSaved"
          ? [
              { bookmarkCount: "desc" as const },
              { ratingAverage: "desc" as const },
              { createdAt: "desc" as const }
            ]
          : { createdAt: "desc" },
      distinct: ["id"]
    });
  },

  async explore(sort: "newest" | "mostSaved") {
    return prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: sort === "mostSaved" ? { bookmarkCount: "desc" } : { createdAt: "desc" }
    });
  },

  async getBySlug(slug: string) {
    return prisma.recipe.findFirst({
      where: {
        slug,
        status: "PUBLISHED"
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        ingredients: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { stepNumber: "asc" } },
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true
          }
        }
      }
    });
  }
};
