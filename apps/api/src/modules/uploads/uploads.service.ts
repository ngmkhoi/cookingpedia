import { RECIPE_IMAGE_FOLDER } from "../../constants/uploads";
import { bucket } from "../../lib/firebase";

export const uploadsService = {
  async saveRecipeImage(file: Express.Multer.File) {
    const objectName = `${RECIPE_IMAGE_FOLDER}/${Date.now()}-${file.originalname}`;
    const object = bucket.file(objectName);

    await object.save(file.buffer, {
      contentType: file.mimetype,
      public: true
    });

    return `https://storage.googleapis.com/${bucket.name}/${objectName}`;
  }
};
