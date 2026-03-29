import type { Response } from "express";
import { ok } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { bookmarksService } from "./bookmarks.service.js";

const getRecipeId = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export const bookmarksController = {
  async listMine(req: AuthenticatedRequest, res: Response) {
    const recipes = await bookmarksService.listMine(req.auth!.userId);
    return res.status(200).json(ok({ recipes }));
  },

  async add(req: AuthenticatedRequest, res: Response) {
    await bookmarksService.add(req.auth!.userId, getRecipeId(req.params.recipeId));
    return res.status(200).json(ok({ message: "BOOKMARKED" }));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await bookmarksService.remove(req.auth!.userId, getRecipeId(req.params.recipeId));
    return res.status(200).json(ok({ message: "UNBOOKMARKED" }));
  }
};
