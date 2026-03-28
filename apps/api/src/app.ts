import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { requireCsrf } from "./middleware/csrf";
import { errorHandler } from "./middleware/error-handler";
import { router } from "./routes";

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
