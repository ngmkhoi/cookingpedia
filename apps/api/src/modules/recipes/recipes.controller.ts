import type { Response } from "express";
import { AppError } from "../../lib/app-error.js";
import { created, ok } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { publicRecipesService, recipesService } from "./recipes.service.js";

const getRouteId = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const toApiLocale = (locale: "VI" | "EN") => (locale === "EN" ? "en" : "vi");
const recipeDifficulties = new Set(["EASY", "MEDIUM", "HARD"]);

const serializeRecipe = (recipe: {
  locale: "VI" | "EN";
  coverImageUrl?: string | null;
  ingredients?: Array<{ quantity: { toString(): string } | number | string }>;
  [key: string]: unknown;
}) => ({
  ...recipe,
  coverImageUrl: recipe.coverImageUrl ?? undefined,
  locale: toApiLocale(recipe.locale),
  ingredients: recipe.ingredients?.map((ingredient) => ({
    ...ingredient,
    quantity: Number(ingredient.quantity)
  }))
});

const serializeRecipeList = <
  T extends {
    locale: "VI" | "EN";
    coverImageUrl?: string | null;
    ingredients?: Array<{ quantity: { toString(): string } | number | string }>;
    [key: string]: unknown;
  }
>(
  recipes: T[]
) => recipes.map((recipe) => serializeRecipe(recipe));

export const recipesController = {
  async createDraft(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.createDraft(req.auth!.userId, req.body);
    return res.status(201).json(created({ recipe: serializeRecipe(recipe) }));
  },

  async listMine(req: AuthenticatedRequest, res: Response) {
    const recipes = await recipesService.listMine(req.auth!.userId);
    return res.status(200).json(ok({ recipes }));
  },

  async getEditable(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.getEditable(
      getRouteId(req.params.id),
      req.auth!.userId
    );
    return res.status(200).json(ok({ recipe: serializeRecipe(recipe) }));
  },

  async updateDraft(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.updateDraft(
      getRouteId(req.params.id),
      req.auth!.userId,
      req.body
    );
    return res.status(200).json(ok({ recipe: serializeRecipe(recipe) }));
  },

  async submit(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.submit(
      getRouteId(req.params.id),
      req.auth!.userId
    );
    return res.status(200).json(ok({ recipe }));
  },

  async explore(req: AuthenticatedRequest, res: Response) {
    const sort = req.query.sort === "mostSaved" ? "mostSaved" : "newest";
    const recipes = await publicRecipesService.explore(sort);
    return res.status(200).json(ok({ recipes: serializeRecipeList(recipes) }));
  },

  async search(req: AuthenticatedRequest, res: Response) {
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const cuisine = String(req.query.cuisine || "").trim();
    const difficulty = String(req.query.difficulty || "").trim().toUpperCase();
    const rawMaxCookMinutes = String(req.query.maxCookMinutes || "").trim();
    const parsedMaxCookMinutes = Number(rawMaxCookMinutes);
    const maxCookMinutes =
      rawMaxCookMinutes && Number.isFinite(parsedMaxCookMinutes) && parsedMaxCookMinutes > 0
        ? parsedMaxCookMinutes
        : undefined;
    const sort = req.query.sort === "mostSaved" ? "mostSaved" : "newest";

    const recipes = await publicRecipesService.search({
      q: q || undefined,
      category: category || undefined,
      cuisine: cuisine || undefined,
      difficulty: recipeDifficulties.has(difficulty)
        ? (difficulty as "EASY" | "MEDIUM" | "HARD")
        : undefined,
      maxCookMinutes,
      sort
    });
    return res.status(200).json(ok({ recipes: serializeRecipeList(recipes) }));
  },

  async home(_req: AuthenticatedRequest, res: Response) {
    const data = await publicRecipesService.home();
    return res.status(200).json(
      ok({
        trending: serializeRecipeList(data.trending),
        newest: serializeRecipeList(data.newest),
        categories: data.categories
      })
    );
  },

  async getPublishedBySlug(req: AuthenticatedRequest, res: Response) {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const recipe = await publicRecipesService.getBySlug(slug);
    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return res.status(200).json(ok({ recipe: serializeRecipe(recipe) }));
  }
};
