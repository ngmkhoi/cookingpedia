import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../../middleware/auth.js";
import { bookmarksController } from "./bookmarks.controller.js";

export const bookmarksRouter = Router();

bookmarksRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return bookmarksController.listMine(req, res);
  })
);

bookmarksRouter.post(
  "/:recipeId",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return bookmarksController.add(req, res);
  })
);

bookmarksRouter.delete(
  "/:recipeId",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return bookmarksController.remove(req, res);
  })
);
