import type { Response } from "express";
import { ok } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { adminRecipesService } from "./admin-recipes.service.js";

const getRouteId = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export const adminRecipesController = {
  async listPending(_req: AuthenticatedRequest, res: Response) {
    const recipes = await adminRecipesService.listPending();
    return res.status(200).json(ok({ recipes }));
  },

  async getOne(req: AuthenticatedRequest, res: Response) {
    const recipe = await adminRecipesService.getForReview(getRouteId(req.params.id));
    return res.status(200).json(ok({ recipe }));
  },

  async approve(req: AuthenticatedRequest, res: Response) {
    const recipe = await adminRecipesService.approve(
      getRouteId(req.params.id),
      req.auth!.userId
    );
    return res.status(200).json(ok({ recipe }));
  },

  async reject(req: AuthenticatedRequest, res: Response) {
    const recipe = await adminRecipesService.reject(
      getRouteId(req.params.id),
      req.auth!.userId,
      String(req.body.rejectionReason ?? "")
    );
    return res.status(200).json(ok({ recipe }));
  }
};
