import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../../middleware/auth.js";
import { ratingsController } from "./ratings.controller.js";

export const ratingsRouter = Router();

ratingsRouter.post(
  "/:recipeId",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return ratingsController.save(req, res);
  })
);
