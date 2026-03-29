import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/app-error.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.code
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "VALIDATION_FAILED",
      issues: error.flatten()
    });
  }

  console.error(error);
  return res.status(500).json({
    message: "INTERNAL_SERVER_ERROR"
  });
};
