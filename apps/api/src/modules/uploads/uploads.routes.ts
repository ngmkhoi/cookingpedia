import { Router } from "express";
import multer from "multer";
import { MAX_IMAGE_UPLOAD_SIZE } from "../../constants/uploads.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { uploadsController } from "./uploads.controller.js";

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
