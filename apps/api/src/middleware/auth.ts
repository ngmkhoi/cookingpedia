import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAMES } from "../constants/auth.js";
import { verifyAccessToken } from "../lib/jwt.js";

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    role: "USER" | "ADMIN";
    sessionId: string;
  };
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies[AUTH_COOKIE_NAMES.access];
  if (!token) {
    return res.status(401).json({ message: "UNAUTHENTICATED" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      sessionId: payload.sessionId
    };

    return next();
  } catch {
    return res.status(401).json({ message: "UNAUTHENTICATED" });
  }
};
