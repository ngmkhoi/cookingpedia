import type { Response } from "express";
import { ALLOWED_IMAGE_MIME_TYPES } from "../../constants/uploads";
import { ok } from "../../lib/api-response";
import { AppError } from "../../lib/app-error";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { uploadsService } from "./uploads.service";

export const uploadsController = {
  async createRecipeImage(req: AuthenticatedRequest, res: Response) {
    if (
      !req.file ||
      !ALLOWED_IMAGE_MIME_TYPES.includes(
        req.file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
      )
    ) {
      throw new AppError(400, "INVALID_IMAGE");
    }

    let imageUrl: string;

    try {
      imageUrl = await uploadsService.saveRecipeImage(req.file);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, "UPLOAD_FAILED");
    }

    return res.status(201).json(ok({ imageUrl }));
  }
};
