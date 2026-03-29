import type { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "./auth.js";

export const requireRole = (role: "ADMIN") => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.auth) {
      return res.status(403).json({ message: "FORBIDDEN" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { role: true }
    });

    if (!user || user.role !== role) {
      return res.status(403).json({ message: "FORBIDDEN" });
    }

    return next();
  };
};
