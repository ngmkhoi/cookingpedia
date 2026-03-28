import { Router } from "express";
import multer from "multer";
import { MAX_IMAGE_UPLOAD_SIZE } from "../../constants/uploads";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { uploadsController } from "./uploads.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_UPLOAD_SIZE }
});

export const uploadsRouter = Router();

uploadsRouter.post(
  "/recipe-images",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    return uploadsController.createRecipeImage(req, res);
  })
);
