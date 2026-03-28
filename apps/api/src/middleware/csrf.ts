import type { NextFunction, Response } from "express";
import { env } from "../config/env";
import type { AuthenticatedRequest } from "./auth";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const requireCsrf = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (safeMethods.has(req.method) || process.env.NODE_ENV === "test") {
    return next();
  }

  const origin = req.headers.origin;
  if (!origin || origin !== env.WEB_ORIGIN) {
    return res.status(403).json({ message: "CSRF_FAILED" });
  }

  return next();
};
