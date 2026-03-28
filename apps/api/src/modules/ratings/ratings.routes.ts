import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../../middleware/auth";
import { ratingsController } from "./ratings.controller";

export const ratingsRouter = Router();

ratingsRouter.post(
  "/:recipeId",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return ratingsController.save(req, res);
  })
);
