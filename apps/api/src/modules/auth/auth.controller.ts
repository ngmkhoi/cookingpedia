import type { Response } from "express";
import { created, ok } from "../../lib/api-response";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { authService } from "./auth.service";

export const authController = {
  async register(req: AuthenticatedRequest, _res: Response) {
    const session = await authService.register(req.body);

    return {
      session,
      body: created({
        user: {
          username: req.body.username,
          email: req.body.email
        }
      })
    };
  },

  async login(req: AuthenticatedRequest, _res: Response) {
    const session = await authService.login(req.body);

    return {
      session,
      body: ok({ message: "LOGGED_IN" })
    };
  },

  async me(req: AuthenticatedRequest) {
    const user = await authService.getCurrentUser(req.auth!.userId);
    return ok({ user });
  }
};
