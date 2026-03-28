import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiEnvPath = resolve(currentDir, "../../.env");

try {
  process.loadEnvFile(apiEnvPath);
} catch (error) {
  const errorCode =
    error && typeof error === "object" && "code" in error ? error.code : undefined;

  if (errorCode !== "ENOENT") {
    throw error;
  }
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number(),
  WEB_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().min(1),
  JWT_REFRESH_TTL: z.string().min(1),
  COOKIE_DOMAIN: z.string(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).transform((value) => value.replace(/\\n/g, "\n")),
  FIREBASE_STORAGE_BUCKET: z.string().min(1)
});

export const env = envSchema.parse(process.env);
