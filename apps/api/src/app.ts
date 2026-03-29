import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { requireCsrf } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/error-handler.js";
import { router } from "./routes/index.js";

export const app = express();

app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api", requireCsrf, router);
app.use(errorHandler);
