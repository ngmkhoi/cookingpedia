import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { recipesController } from "./recipes.controller";
import { createRecipeSchema, updateRecipeSchema } from "./recipes.schemas";

export const recipesRouter = Router();

recipesRouter.get(
  "/home",
  asyncHandler(async (req, res) => {
    return recipesController.home(req, res);
  })
);

recipesRouter.get(
  "/explore",
  asyncHandler(async (req, res) => {
    return recipesController.explore(req, res);
  })
);

recipesRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    return recipesController.search(req, res);
  })
);

recipesRouter.get(
  "/slug/:slug",
  asyncHandler(async (req, res) => {
    return recipesController.getPublishedBySlug(req, res);
  })
);

recipesRouter.post(
  "/",
  requireAuth,
  validate(createRecipeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return recipesController.createDraft(req, res);
  })
);

recipesRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return recipesController.listMine(req, res);
  })
);

recipesRouter.get(
  "/:id/edit",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return recipesController.getEditable(req, res);
  })
);

recipesRouter.patch(
  "/:id",
  requireAuth,
  validate(updateRecipeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return recipesController.updateDraft(req, res);
  })
);

recipesRouter.post(
  "/:id/submit",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return recipesController.submit(req, res);
  })
);
