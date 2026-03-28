import { Router } from "express";
import { env } from "../../config/env";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/app-error";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schemas";
import { authService } from "./auth.service";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
};

authRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { session, body } = await authController.register(req, res);

    res
      .cookie(authService.accessCookie, session.accessToken, cookieOptions)
      .cookie(authService.refreshCookie, session.refreshToken, cookieOptions)
      .status(201)
      .json(body);
  })
);

authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { session, body } = await authController.login(req, res);

    res
      .cookie(authService.accessCookie, session.accessToken, cookieOptions)
      .cookie(authService.refreshCookie, session.refreshToken, cookieOptions)
      .status(200)
      .json(body);
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = await authController.me(req);
    return res.status(200).json(body);
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies[authService.refreshCookie];
    if (!token) {
      throw new AppError(401, "UNAUTHENTICATED");
    }

    const session = await authService.rotate(token);

    res
      .cookie(authService.accessCookie, session.accessToken, cookieOptions)
      .cookie(authService.refreshCookie, session.refreshToken, cookieOptions)
      .status(200)
      .json({ message: "REFRESHED" });
  })
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await authService.revoke(req.auth!.sessionId);

    res
      .clearCookie(authService.accessCookie, cookieOptions)
      .clearCookie(authService.refreshCookie, cookieOptions)
      .status(200)
      .json({ message: "LOGGED_OUT" });
  })
);
