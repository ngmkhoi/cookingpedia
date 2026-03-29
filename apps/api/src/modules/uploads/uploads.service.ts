import { AppError } from "../../lib/app-error.js";
import { RECIPE_IMAGE_FOLDER } from "../../constants/uploads.js";
import { bucket } from "../../lib/firebase.js";

export const uploadsService = {
  async saveRecipeImage(file: Express.Multer.File) {
    const objectName = `${RECIPE_IMAGE_FOLDER}/${Date.now()}-${file.originalname}`;
    const object = bucket.file(objectName);

    try {
      await object.save(file.buffer, {
        contentType: file.mimetype,
        public: true
      });
    } catch (error) {
      throw new AppError(500, "UPLOAD_FAILED", error instanceof Error ? error.message : undefined);
    }

    return `https://storage.googleapis.com/${bucket.name}/${objectName}`;
  }
};
