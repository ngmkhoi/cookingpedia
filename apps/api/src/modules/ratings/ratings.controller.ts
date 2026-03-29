import type { Response } from "express";
import { ok } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { ratingsService } from "./ratings.service.js";

const getRecipeId = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export const ratingsController = {
  async save(req: AuthenticatedRequest, res: Response) {
    const data = await ratingsService.save(
      req.auth!.userId,
      getRecipeId(req.params.recipeId),
      req.body
    );
    return res.status(200).json(ok({ message: "RATING_SAVED", ...data }));
  },

  async getMine(req: AuthenticatedRequest, res: Response) {
    const rating = await ratingsService.getMine(
      req.auth!.userId,
      getRecipeId(req.params.recipeId)
    );
    return res.status(200).json(ok({ rating }));
  }
};
