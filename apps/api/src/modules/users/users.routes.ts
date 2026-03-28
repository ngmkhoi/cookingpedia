import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { usersController } from "./users.controller";
import { updateProfileSchema } from "./users.schemas";

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
