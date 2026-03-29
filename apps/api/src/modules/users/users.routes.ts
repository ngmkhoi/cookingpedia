import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { usersController } from "./users.controller.js";
import { updateProfileSchema } from "./users.schemas.js";

export const usersRouter = Router();

usersRouter.get(
  "/authors/:username",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return usersController.getAuthor(req, res);
  })
);

usersRouter.patch(
  "/me",
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    return usersController.updateMe(req, res);
  })
);
