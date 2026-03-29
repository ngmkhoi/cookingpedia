import { Router } from "express";
import { adminRecipesRouter } from "../modules/admin-recipes/admin-recipes.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { bookmarksRouter } from "../modules/bookmarks/bookmarks.routes.js";
import { recipesRouter } from "../modules/recipes/recipes.routes.js";
import { ratingsRouter } from "../modules/ratings/ratings.routes.js";
import { uploadsRouter } from "../modules/uploads/uploads.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/uploads", uploadsRouter);
router.use("/recipes", recipesRouter);
router.use("/admin/recipes", adminRecipesRouter);
router.use("/ratings", ratingsRouter);
router.use("/bookmarks", bookmarksRouter);
