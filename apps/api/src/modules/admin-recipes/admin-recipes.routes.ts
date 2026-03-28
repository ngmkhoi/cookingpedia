import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { adminRecipesController } from "./admin-recipes.controller";

export const adminRecipesRouter = Router();

adminRecipesRouter.use(requireAuth, requireRole("ADMIN"));

adminRecipesRouter.get(
  "/pending",
  asyncHandler(async (req, res) => adminRecipesController.listPending(req, res))
);
adminRecipesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => adminRecipesController.getOne(req, res))
);
adminRecipesRouter.post(
  "/:id/approve",
  asyncHandler(async (req, res) => adminRecipesController.approve(req, res))
);
adminRecipesRouter.post(
  "/:id/reject",
  asyncHandler(async (req, res) => adminRecipesController.reject(req, res))
);
