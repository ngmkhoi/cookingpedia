import type { Response } from "express";
import { ok } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { ratingsService } from "./ratings.service.js";

const getRecipeId = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export const ratingsController = {
  async save(req: AuthenticatedRequest, res: Response) {
    await ratingsService.save(req.auth!.userId, getRecipeId(req.params.recipeId), req.body);
    return res.status(200).json(ok({ message: "RATING_SAVED" }));
  }
};
