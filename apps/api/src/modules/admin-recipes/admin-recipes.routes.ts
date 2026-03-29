import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";
import { adminRecipesController } from "./admin-recipes.controller.js";

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
