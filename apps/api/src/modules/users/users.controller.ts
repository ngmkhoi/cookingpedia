import type { Response } from "express";
import { ok } from "../../lib/api-response";
import { AppError } from "../../lib/app-error";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { usersService } from "./users.service";

export const usersController = {
  async getAuthor(req: AuthenticatedRequest, res: Response) {
    const username = Array.isArray(req.params.username)
      ? req.params.username[0]
      : req.params.username;
    const author = await usersService.getPublicAuthor(username);
    if (!author) {
      throw new AppError(404, "AUTHOR_NOT_FOUND");
    }

    return res.status(200).json(ok({ author }));
  },

  async updateMe(req: AuthenticatedRequest, res: Response) {
    const user = await usersService.updateMe(req.auth!.userId, req.body);
    return res.status(200).json(ok({ user }));
  }
};
