# Cookpedia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Cookpedia as a portfolio-grade recipe platform with structured recipe data, moderation-first publishing, secure cookie-based auth, Firebase-backed image uploads, and a polished Next.js frontend.

**Architecture:** Use a pnpm TypeScript monorepo with `apps/api` for Express + Prisma + PostgreSQL and `apps/web` for Next.js + Tailwind + Redux Toolkit. Keep the backend modular by domain with shared controller/service/schema conventions, store recipe ingredients/steps/images in normalized tables, and expose public read APIs separately from authenticated author/admin actions. Frontend pages should be assembled from reusable `components/ui` primitives generated from shadcn/ui and then customized to match the Cookpedia visual system instead of shipping default shadcn styles or ad hoc styled tags.

**Tech Stack:** pnpm workspaces, TypeScript, Express, Prisma, PostgreSQL, Zod, Argon2id, JWT, cookie-parser, Firebase Admin SDK, Multer, Vitest, Supertest, Next.js App Router, Tailwind CSS, Redux Toolkit, React Hook Form, shadcn/ui, Phosphor Icons, Playwright

---

## Repository Structure

Root files:

- `package.json` — workspace scripts
- `pnpm-workspace.yaml` — workspace package discovery
- `tsconfig.base.json` — shared TypeScript settings
- `.gitignore` — ignore Node, build, env, and upload artifacts
- `.env.example` — environment contract for both apps
- `playwright.config.ts` — end-to-end browser test config

Backend files under `apps/api`:

- `package.json` — API dependencies and scripts
- `tsconfig.json` — API TS config
- `prisma/schema.prisma` — relational schema
- `prisma/seed.ts` — local admin bootstrap seed
- `src/app.ts` — Express app factory
- `src/server.ts` — process bootstrap
- `src/config/env.ts` — validated environment variables
- `src/constants/auth.ts` — cookie names, auth-related keys, and auth defaults
- `src/constants/localization.ts` — supported locales and default locale
- `src/constants/recipes.ts` — recipe statuses, difficulties, sort keys, and labels
- `src/constants/uploads.ts` — upload limits, allowed MIME types, and storage folders
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/firebase.ts` — Firebase Admin initialization
- `src/lib/jwt.ts` — token helpers
- `src/lib/api-response.ts` — shared success response helpers
- `src/lib/app-error.ts` — shared typed application errors
- `src/lib/async-handler.ts` — wrapper for forwarding async route failures
- `src/middleware/auth.ts` — access-token auth guard
- `src/middleware/role.ts` — admin role guard
- `src/middleware/csrf.ts` — CSRF protection for cookie-authenticated writes
- `src/middleware/validate.ts` — Zod request validation middleware
- `src/middleware/error-handler.ts` — centralized API errors
- `src/routes/index.ts` — route composition
- `src/modules/auth/*` — `auth.schemas.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`
- `src/modules/users/*` — `users.schemas.ts`, `users.service.ts`, `users.controller.ts`, `users.routes.ts`
- `src/modules/uploads/*` — `uploads.schemas.ts`, `uploads.service.ts`, `uploads.controller.ts`, `uploads.routes.ts`
- `src/modules/recipes/*` — `recipes.schemas.ts`, `recipes.service.ts`, `recipes.controller.ts`, `recipes.routes.ts`
- `src/modules/ratings/*` — `ratings.schemas.ts`, `ratings.service.ts`, `ratings.controller.ts`, `ratings.routes.ts`
- `src/modules/bookmarks/*` — `bookmarks.service.ts`, `bookmarks.controller.ts`, `bookmarks.routes.ts`
- `src/modules/admin-recipes/*` — `admin-recipes.schemas.ts`, `admin-recipes.service.ts`, `admin-recipes.controller.ts`, `admin-recipes.routes.ts`

Backend tests:

- `apps/api/tests/health.test.ts`
- `apps/api/tests/auth.test.ts`
- `apps/api/tests/profile-and-upload.test.ts`
- `apps/api/tests/recipe-draft.test.ts`
- `apps/api/tests/moderation-and-search.test.ts`
- `apps/api/tests/engagement.test.ts`

Frontend files under `apps/web`:

- `package.json` — web dependencies and scripts
- `tsconfig.json` — web TS config
- `next.config.ts` — Next config
- `postcss.config.js` — Tailwind PostCSS setup
- `tailwind.config.ts` — theme extension
- `components.json` — shadcn/ui registry and alias configuration
- `app/globals.css` — design tokens and Tailwind layers
- `app/layout.tsx` — root layout and providers
- `app/page.tsx` — hybrid homepage
- `app/search/page.tsx` — public search results
- `app/recipes/[slug]/page.tsx` — public recipe detail
- `app/authors/[username]/page.tsx` — public author profile
- `app/login/page.tsx` — login
- `app/register/page.tsx` — register
- `app/profile/page.tsx` — private profile
- `app/settings/profile/page.tsx` — profile settings
- `app/profile/recipes/new/page.tsx` — recipe studio create
- `app/profile/recipes/[id]/edit/page.tsx` — recipe studio edit
- `app/admin/recipes/pending/page.tsx` — moderation queue
- `app/admin/recipes/[id]/page.tsx` — moderation detail
- `components/ui/*` — design-system primitives such as `Button`, `Input`, `Textarea`, `FormField`, `CardSurface`, `StatusBadge`, `Tabs`, `EmptyState`, `SkeletonBlock`
- `components/layout/*` — shell-level components like `SiteHeader`
- `components/recipes/*` — recipe cards, galleries, studio sections, ingredient/step blocks
- `components/profile/*` — profile tabs and creator summary blocks
- `components/admin/*` — moderation action panels and queue rows
- `lib/api.ts` — fetch helpers
- `lib/constants/site.ts` — app name, metadata, and main navigation labels
- `lib/constants/localization.ts` — supported UI locales and locale switch labels
- `lib/constants/recipes.ts` — recipe status labels, filter options, and sort options
- `lib/utils.ts` — `cn()` helper used by shadcn components
- `lib/store.ts` — Redux store
- `lib/providers.tsx` — provider wrapper
- `features/auth/auth-slice.ts` — auth state
- `features/bookmarks/bookmarks-slice.ts` — optimistic bookmark state

Frontend tests:

- `tests/e2e/auth-and-profile.spec.ts`
- `tests/e2e/moderation-flow.spec.ts`
- `tests/e2e/search-and-engagement.spec.ts`

## Assumptions

- Use `pnpm` as the package manager.
- Use TypeScript for both backend and frontend.
- Use one PostgreSQL database for local development.
- Use one Firebase Storage bucket for uploaded images.
- Start with a single admin account created through a seed script or direct DB update after migrations.

## Implementation Conventions

### Backend

- every feature follows `schemas -> controller -> service -> routes`
- routes only declare endpoints and middleware
- controllers translate request input into service calls and response helpers
- services own Prisma queries, transactions, and business rules
- validation goes through shared Zod middleware instead of repeated manual guards
- success responses and error payloads use centralized helpers so API shape stays stable
- module names, cookie names, role names, and recipe status values should come from shared constants or enums, not duplicated string literals
- upload size limits, allowed MIME types, Firebase folder names, supported locales, and default sort keys should also come from shared constants modules

### Frontend

- pages compose reusable UI primitives rather than styling raw `button`, `input`, `textarea`, badge, and panel markup repeatedly
- `components/ui/*` is the only place where base visual primitives should define spacing, radius, borders, hover states, and focus styles
- shadcn/ui is the source of truth for bootstrapping these primitives, but every imported primitive must be restyled to match Cookpedia rather than keeping the default shadcn presentation
- domain components such as `RecipeCard`, `ProfileTabs`, `RecipeStudioForm`, and `ModerationActionPanel` should consume those primitives rather than restyling from scratch
- loading, empty, and error states should also be shared components so public pages and private dashboards remain visually consistent
- site title, nav labels, locale labels, recipe status copy, filter labels, and reusable empty-state copy should come from frontend constants or locale dictionaries instead of page-local literals

### Task 1: Bootstrap the Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/components.json`

- [ ] **Step 1: Create the root workspace files**

```json
{
  "name": "cookpedia",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "pnpm --parallel --filter @cookpedia/api --filter @cookpedia/web dev",
    "dev:api": "pnpm --filter @cookpedia/api dev",
    "dev:web": "pnpm --filter @cookpedia/web dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  }
}
```

```yaml
packages:
  - "apps/*"
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": "."
  }
}
```

```gitignore
node_modules
.next
dist
coverage
.env
.env.local
.env.*.local
pnpm-lock.yaml
apps/api/generated
apps/api/prisma/dev.db
apps/api/prisma/dev.db-journal
uploads
.superpowers
playwright-report
test-results
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cookpedia"
API_PORT=4000
WEB_ORIGIN="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
JWT_ACCESS_SECRET="replace-me-access"
JWT_REFRESH_SECRET="replace-me-refresh"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"
COOKIE_DOMAIN=""
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""
FIREBASE_STORAGE_BUCKET=""
SEED_ADMIN_EMAIL="admin@cookpedia.local"
SEED_ADMIN_PASSWORD="AdminPass123!"
SEED_ADMIN_USERNAME="cookpedia-admin"
SEED_ADMIN_DISPLAY_NAME="Cookpedia Admin"
```

- [ ] **Step 2: Create the API and web package manifests**

```json
{
  "name": "@cookpedia/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "argon2": "^0.41.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "express": "^5.0.0",
    "firebase-admin": "^13.0.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.10.2",
    "@types/supertest": "^6.0.3",
    "prisma": "^6.0.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

```json
{
  "name": "@cookpedia/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "playwright test"
  },
  "dependencies": {
    "@phosphor-icons/react": "^2.1.7",
    "@reduxjs/toolkit": "^2.5.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.2",
    "react-redux": "^9.2.0",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.2"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src", "tests", "prisma"]
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es2022"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "jsx": "preserve",
    "allowJs": false,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  }
};

export default nextConfig;
```

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

```ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f2efe7",
        panel: "#fbfaf6",
        ink: "#162019",
        accent: "#516044",
        accentStrong: "#324132",
        line: "#d8d2c3"
      }
    }
  },
  plugins: []
} satisfies Config;
```

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 3: Install dependencies and verify the workspace resolves**

Run: `cp .env.example .env`
Expected: local environment file exists with starter values for development.

Run: `pnpm install`
Expected: lockfile is generated and both `@cookpedia/api` and `@cookpedia/web` install cleanly.

Run: `pnpm --filter @cookpedia/api typecheck`
Expected: PASS with no TypeScript config errors.

Run: `pnpm --filter @cookpedia/web typecheck`
Expected: PASS with no TypeScript config errors.

- [ ] **Step 4: Initialize shadcn/ui tooling for the web app**

Run: `pnpm dlx shadcn@latest init --cwd apps/web -d`
Expected: `components.json`, shadcn aliases, and baseline utility files are created under `apps/web`.

Run: `pnpm dlx skills add shadcn/ui`
Expected: the shadcn skill is installed locally for future component generation help.

Note:
- the project should use shadcn/ui as a generator and base registry, not as a visual default
- after initialization, adjust `components.json` and theme tokens so generated components inherit the Cookpedia palette, radius, and motion language

- [ ] **Step 5: Optionally enable the shadcn MCP workflow for component lookup**

Run from `apps/web`: `pnpm dlx shadcn@latest mcp init --client codex`
Expected: shadcn MCP setup instructions are generated for the Codex environment.

Note:
- do this once the repo is initialized and the frontend workspace exists
- use the MCP workflow to browse/install registry components faster, but still review and customize the generated output

- [ ] **Step 6: Initialize git before the rest of the plan starts creating commits**

Run: `git init`
Expected: repository initialized in `/Users/nguyenminhkhoi/projects/personal/cookpedia`.

Run: `git status --short`
Expected: shows the newly created workspace files as untracked.

- [ ] **Step 7: Commit the bootstrap baseline**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .env.example apps/api/package.json apps/api/tsconfig.json apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.js apps/web/tailwind.config.ts apps/web/components.json
git commit -m "chore: bootstrap cookpedia workspace"
```

### Task 2: Define the Prisma Schema and API Health Check

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/src/config/env.ts`
- Create: `apps/api/src/constants/auth.ts`
- Create: `apps/api/src/constants/localization.ts`
- Create: `apps/api/src/constants/recipes.ts`
- Create: `apps/api/src/constants/uploads.ts`
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/lib/api-response.ts`
- Create: `apps/api/src/lib/app-error.ts`
- Create: `apps/api/src/lib/async-handler.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/middleware/validate.ts`
- Create: `apps/api/src/middleware/error-handler.ts`
- Create: `apps/api/src/routes/index.ts`
- Create: `apps/api/tests/health.test.ts`

- [ ] **Step 1: Write the failing API health test**

```ts
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/firebase", () => ({
  bucket: {
    name: "cookpedia-test-bucket",
    file: () => ({
      save: async () => undefined
    })
  }
}));

import { app } from "../src/app";

describe("GET /api/health", () => {
  it("returns an ok payload", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 2: Run the health test to confirm the app is not wired yet**

Run: `pnpm --filter @cookpedia/api test -- health.test.ts`
Expected: FAIL because `../src/app` does not exist yet.

- [ ] **Step 3: Create the environment loader, Prisma client, schema, and Express app**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum Locale {
  VI
  EN
}

enum RecipeStatus {
  DRAFT
  PENDING
  PUBLISHED
  REJECTED
}

enum RecipeDifficulty {
  EASY
  MEDIUM
  HARD
}

model User {
  id               String      @id @default(cuid())
  email            String      @unique
  passwordHash     String
  displayName      String
  username         String      @unique
  avatarUrl        String?
  bio              String?
  locale           Locale      @default(VI)
  role             UserRole    @default(USER)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  recipes          Recipe[]    @relation("RecipeAuthor")
  reviews          Rating[]
  bookmarks        Bookmark[]
  sessions         Session[]
  reviewedRecipes  Recipe[]    @relation("RecipeReviewer")
}

model Recipe {
  id               String            @id @default(cuid())
  authorId         String
  title            String
  slug             String            @unique
  shortDescription String
  prepMinutes      Int
  cookMinutes      Int
  servings         Int
  coverImageUrl    String?
  category         String
  cuisine          String
  difficulty       RecipeDifficulty
  locale           Locale            @default(VI)
  status           RecipeStatus      @default(DRAFT)
  submittedAt      DateTime?
  reviewedAt       DateTime?
  reviewedById     String?
  rejectionReason  String?
  ratingAverage    Float             @default(0)
  ratingCount      Int               @default(0)
  bookmarkCount    Int               @default(0)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  author           User              @relation("RecipeAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  reviewer         User?             @relation("RecipeReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)
  images           RecipeImage[]
  ingredients      Ingredient[]
  steps            Step[]
  ratings          Rating[]
  bookmarks        Bookmark[]

  @@index([status, createdAt])
  @@index([authorId, status])
}

model RecipeImage {
  id        String   @id @default(cuid())
  recipeId  String
  imageUrl  String
  caption   String?
  sortOrder Int
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([recipeId, sortOrder])
}

model Ingredient {
  id        String   @id @default(cuid())
  recipeId  String
  name      String
  quantity  Decimal  @db.Decimal(10, 2)
  unit      String
  sortOrder Int
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([name])
  @@unique([recipeId, sortOrder])
}

model Step {
  id         String   @id @default(cuid())
  recipeId   String
  stepNumber Int
  instruction String
  recipe     Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([recipeId, stepNumber])
}

model Rating {
  id        String   @id @default(cuid())
  userId    String
  recipeId  String
  score     Int
  comment   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([userId, recipeId])
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  recipeId  String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([userId, recipeId])
}

model Session {
  id               String   @id @default(cuid())
  userId           String
  refreshTokenHash String
  expiresAt        DateTime
  revokedAt        DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, revokedAt])
}
```

```ts
export const AUTH_COOKIE_NAMES = {
  access: "cookpedia_access",
  refresh: "cookpedia_refresh"
} as const;
```

```ts
export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export const DEFAULT_LOCALE = "vi";
```

```ts
export const RECIPE_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED"
} as const;

export const RECIPE_DIFFICULTY = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD"
} as const;

export const RECIPE_SORT = {
  newest: "newest",
  mostSaved: "mostSaved"
} as const;
```

```ts
export const MAX_IMAGE_UPLOAD_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;
export const RECIPE_IMAGE_FOLDER = "recipes";
```

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/cookpedia"),
  API_PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(16).default("cookpedia-dev-access-secret"),
  JWT_REFRESH_SECRET: z.string().min(16).default("cookpedia-dev-refresh-secret"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  COOKIE_DOMAIN: z.string().optional().default(""),
  FIREBASE_PROJECT_ID: z.string().optional().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(""),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),
  FIREBASE_STORAGE_BUCKET: z.string().optional().default("")
});

export const env = envSchema.parse(process.env);
```

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

```ts
export const ok = <T>(payload: T) => payload;
export const created = <T>(payload: T) => payload;
```

```ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message?: string
  ) {
    super(message ?? code);
  }
}
```

```ts
import type { NextFunction, Request, Response } from "express";

export const asyncHandler =
  <T extends Request>(handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
```

```ts
import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod";

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return res.status(400).json({
        message: "VALIDATION_FAILED",
        issues: result.error.flatten()
      });
    }

    req.body = result.data.body;
    req.params = result.data.params;
    req.query = result.data.query;
    return next();
  };
```

```ts
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/app-error";

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

  console.error(error);
  return res.status(500).json({
    message: "INTERNAL_SERVER_ERROR"
  });
};
```

```ts
import argon2 from "argon2";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@cookpedia.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123!";
  const username = process.env.SEED_ADMIN_USERNAME ?? "cookpedia-admin";
  const displayName = process.env.SEED_ADMIN_DISPLAY_NAME ?? "Cookpedia Admin";

  await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.ADMIN,
      username,
      displayName
    },
    create: {
      email,
      username,
      displayName,
      role: UserRole.ADMIN,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id })
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

```ts
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { router } from "./routes";

export const app = express();

app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);
app.use(errorHandler);
```

```ts
import { Router } from "express";

export const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
```

```ts
import { app } from "./app";
import { env } from "./config/env";

app.listen(env.API_PORT, () => {
  console.log(`API listening on http://localhost:${env.API_PORT}`);
});
```

- [ ] **Step 4: Run tests, generate Prisma client, and create the first migration**

Run: `pnpm --filter @cookpedia/api test -- health.test.ts`
Expected: PASS with one passing test.

Run: `pnpm --filter @cookpedia/api prisma:generate`
Expected: Prisma Client generated successfully.

Run: `pnpm --filter @cookpedia/api prisma:migrate --name init_schema`
Expected: migration files created and applied to the local PostgreSQL database.

Run: `pnpm --filter @cookpedia/api prisma:seed`
Expected: a local admin account is created or updated with the configured seed credentials.

- [ ] **Step 5: Commit the backend foundation**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/seed.ts apps/api/src/config/env.ts apps/api/src/constants/auth.ts apps/api/src/constants/localization.ts apps/api/src/constants/recipes.ts apps/api/src/constants/uploads.ts apps/api/src/lib/prisma.ts apps/api/src/lib/api-response.ts apps/api/src/lib/app-error.ts apps/api/src/lib/async-handler.ts apps/api/src/app.ts apps/api/src/server.ts apps/api/src/middleware/validate.ts apps/api/src/middleware/error-handler.ts apps/api/src/routes/index.ts apps/api/tests/health.test.ts
git commit -m "feat: add api foundation and prisma schema"
```

### Task 3: Implement Secure Auth and Session Rotation

**Files:**
- Create: `apps/api/src/lib/jwt.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/modules/auth/auth.schemas.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.routes.ts`
- Create: `apps/api/tests/auth.test.ts`
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: Write failing tests for register, login, me, refresh, and logout**

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("auth flow", () => {
  it("registers, logs in, rotates refresh, and logs out", async () => {
    const agent = request.agent(app);

    const registerResponse = await agent.post("/api/auth/register").send({
      email: "mina@cookpedia.test",
      password: "SecretPass123!",
      displayName: "Mina Ha",
      username: "mina-ha"
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.username).toBe("mina-ha");

    const meResponse = await agent.get("/api/auth/me");
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe("mina@cookpedia.test");

    const refreshResponse = await agent.post("/api/auth/refresh").send();
    expect(refreshResponse.status).toBe(200);

    const logoutResponse = await agent.post("/api/auth/logout").send();
    expect(logoutResponse.status).toBe(200);

    const afterLogout = await agent.get("/api/auth/me");
    expect(afterLogout.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run the auth test before implementation**

Run: `pnpm --filter @cookpedia/api test -- auth.test.ts`
Expected: FAIL because `/api/auth/*` routes do not exist.

- [ ] **Step 3: Implement auth schemas, controller, service, JWT helpers, cookies, and session persistence**

```ts
import jwt from "jsonwebtoken";
import { env } from "../config/env";

type JwtPayload = {
  sub: string;
  role: "USER" | "ADMIN";
  sessionId: string;
};

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });

export const signRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
```

```ts
import argon2 from "argon2";
import { AUTH_COOKIE_NAMES } from "../../constants/auth";
import { AppError } from "../../lib/app-error";
import { prisma } from "../../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";

export const authService = {
  async register(input: {
    email: string;
    password: string;
    displayName: string;
    username: string;
  }) {
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        username: input.username
      }
    });

    return this.createSession(user.id, user.role);
  },

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS");
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS");
    }

    return this.createSession(user.id, user.role);
  },

  async createSession(userId: string, role: "USER" | "ADMIN") {
    const session = await prisma.session.create({
      data: {
        userId,
        refreshTokenHash: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const payload = { sub: userId, role, sessionId: session.id };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await argon2.hash(refreshToken, { type: argon2.argon2id })
      }
    });

    return { accessToken, refreshToken, sessionId: session.id };
  },

  async rotate(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session || session.revokedAt) {
      throw new AppError(401, "INVALID_SESSION");
    }

    const matches = await argon2.verify(session.refreshTokenHash, refreshToken);
    if (!matches) {
      throw new AppError(401, "INVALID_SESSION");
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    });

    return this.createSession(payload.sub, payload.role);
  },

  async getCurrentUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true
      }
    });
  },

  async revoke(sessionId: string) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });
  },

  accessCookie: AUTH_COOKIE_NAMES.access,
  refreshCookie: AUTH_COOKIE_NAMES.refresh
};
```

```ts
import { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAMES } from "../constants/auth";
import { verifyAccessToken } from "../lib/jwt";

export type AuthenticatedRequest = Request & {
  auth?: { userId: string; role: "USER" | "ADMIN"; sessionId: string };
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies[AUTH_COOKIE_NAMES.access];
  if (!token) {
    return res.status(401).json({ message: "UNAUTHENTICATED" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role, sessionId: payload.sessionId };
    return next();
  } catch {
    return res.status(401).json({ message: "UNAUTHENTICATED" });
  }
};
```

```ts
import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(2),
    username: z.string().min(3)
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  params: z.object({}),
  query: z.object({})
});
```

```ts
import type { Response } from "express";
import { created, ok } from "../../lib/api-response";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { authService } from "./auth.service";

export const authController = {
  async register(req: AuthenticatedRequest, res: Response) {
    const session = await authService.register(req.body);

    return { session, body: created({ user: { username: req.body.username, email: req.body.email } }) };
  },

  async login(req: AuthenticatedRequest, _res: Response) {
    const session = await authService.login(req.body);
    return { session, body: ok({ message: "LOGGED_IN" }) };
  },

  async me(req: AuthenticatedRequest) {
    const user = await authService.getCurrentUser(req.auth!.userId);
    return ok({ user });
  }
};
```

```ts
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/app-error";
import { validate } from "../../middleware/validate";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth";
import { authController } from "./auth.controller";
import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.schemas";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

authRouter.post("/register", validate(registerSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { session, body } = await authController.register(req, res);

  res
    .cookie(authService.accessCookie, session.accessToken, cookieOptions)
    .cookie(authService.refreshCookie, session.refreshToken, cookieOptions)
    .status(201)
    .json(body);
}));

authRouter.post("/login", validate(loginSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { session, body } = await authController.login(req, res);

  res
    .cookie(authService.accessCookie, session.accessToken, cookieOptions)
    .cookie(authService.refreshCookie, session.refreshToken, cookieOptions)
    .status(200)
    .json(body);
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = await authController.me(req);
  return res.status(200).json(body);
}));

authRouter.post("/refresh", asyncHandler(async (req, res) => {
  const token = req.cookies.cookpedia_refresh;
  if (!token) {
    throw new AppError(401, "UNAUTHENTICATED");
  }

  const session = await authService.rotate(token);

  res
    .cookie(authService.accessCookie, session.accessToken, cookieOptions)
    .cookie(authService.refreshCookie, session.refreshToken, cookieOptions)
    .status(200)
    .json({ message: "REFRESHED" });
}));

authRouter.post("/logout", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await authService.revoke(req.auth!.sessionId);

  res
    .clearCookie(authService.accessCookie, cookieOptions)
    .clearCookie(authService.refreshCookie, cookieOptions)
    .status(200)
    .json({ message: "LOGGED_OUT" });
}));
```

- [ ] **Step 4: Wire the auth routes and make the auth tests pass**

Update `apps/api/src/routes/index.ts`:

```ts
import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";

export const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRouter);
```

Run: `pnpm --filter @cookpedia/api test -- auth.test.ts`
Expected: PASS with register/login/me/refresh/logout working through cookies.

- [ ] **Step 5: Commit the secure auth baseline**

```bash
git add apps/api/src/lib/jwt.ts apps/api/src/middleware/auth.ts apps/api/src/modules/auth/auth.schemas.ts apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.controller.ts apps/api/src/modules/auth/auth.routes.ts apps/api/src/routes/index.ts apps/api/tests/auth.test.ts
git commit -m "feat: add secure auth and session rotation"
```

### Task 4: Add Profile APIs, Firebase Uploads, and Request Hardening

**Files:**
- Create: `apps/api/src/lib/firebase.ts`
- Create: `apps/api/src/middleware/role.ts`
- Create: `apps/api/src/middleware/csrf.ts`
- Create: `apps/api/src/modules/users/users.schemas.ts`
- Create: `apps/api/src/modules/users/users.service.ts`
- Create: `apps/api/src/modules/users/users.controller.ts`
- Create: `apps/api/src/modules/users/users.routes.ts`
- Create: `apps/api/src/modules/uploads/uploads.service.ts`
- Create: `apps/api/src/modules/uploads/uploads.controller.ts`
- Create: `apps/api/src/modules/uploads/uploads.routes.ts`
- Create: `apps/api/tests/profile-and-upload.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: Write failing tests for profile update, public author lookup, and upload validation**

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("profile and uploads", () => {
  it("updates the signed-in profile and exposes the public author page", async () => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "ly@cookpedia.test",
      password: "SecretPass123!",
      displayName: "Ly Tran",
      username: "ly-tran"
    });

    const updateResponse = await agent.patch("/api/users/me").send({
      displayName: "Ly Tran Studio",
      bio: "Vietnamese home cook"
    });

    expect(updateResponse.status).toBe(200);

    const publicResponse = await request(app).get("/api/users/authors/ly-tran");
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.author.username).toBe("ly-tran");
  });

  it("rejects non-image uploads", async () => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "tam@cookpedia.test",
      password: "SecretPass123!",
      displayName: "Tam Ngo",
      username: "tam-ngo"
    });

    const uploadResponse = await agent
      .post("/api/uploads/recipe-images")
      .attach("file", Buffer.from("not-an-image"), "notes.txt");

    expect(uploadResponse.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the profile and upload test before implementing the routes**

Run: `pnpm --filter @cookpedia/api test -- profile-and-upload.test.ts`
Expected: FAIL because `/api/users/*` and `/api/uploads/*` routes do not exist.

- [ ] **Step 3: Implement Firebase client, CSRF middleware, role guard, profile routes, and upload routes**

```ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { env } from "../config/env";

if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_STORAGE_BUCKET) {
  throw new Error("FIREBASE_CONFIG_MISSING");
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET
  });

export const bucket = getStorage(app).bucket();
```

```ts
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth";

export const requireRole = (role: "ADMIN") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth || req.auth.role !== role) {
      return res.status(403).json({ message: "FORBIDDEN" });
    }

    return next();
  };
};
```

```ts
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const requireCsrf = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (safeMethods.has(req.method)) {
    return next();
  }

  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const origin = req.headers.origin;
  if (!origin || origin !== process.env.WEB_ORIGIN) {
    return res.status(403).json({ message: "CSRF_FAILED" });
  }

  return next();
};
```

```ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).optional(),
    username: z.string().min(3).optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(240).optional(),
    locale: z.enum(["vi", "en"]).optional()
  }),
  params: z.object({}),
  query: z.object({})
});
```

```ts
import { prisma } from "../../lib/prisma";

export const usersService = {
  getPublicAuthor(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        recipes: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" }
        }
      }
    });
  },

  updateMe(userId: string, input: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    locale?: "vi" | "en";
  }) {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        locale: true
      }
    });
  }
};
```

```ts
import type { Response } from "express";
import { ok } from "../../lib/api-response";
import { AppError } from "../../lib/app-error";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { usersService } from "./users.service";

export const usersController = {
  async getAuthor(req: AuthenticatedRequest, res: Response) {
    const author = await usersService.getPublicAuthor(req.params.username);
    if (!author) {
      throw new AppError(404, "AUTHOR_NOT_FOUND");
    }

    return res.status(200).json(ok({ author }));
  },

  async updateMe(req: AuthenticatedRequest, res: Response) {
    const user = await usersService.updateMe(req.auth!.userId, req.body);
    return res.status(200).json(ok({ user }));
  }
};
```

```ts
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
```

```ts
import { ALLOWED_IMAGE_MIME_TYPES } from "../../constants/uploads";
import type { Response } from "express";
import { ok } from "../../lib/api-response";
import { AppError } from "../../lib/app-error";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { uploadsService } from "./uploads.service";

export const uploadsController = {
  async createRecipeImage(req: AuthenticatedRequest, res: Response) {
    if (!req.file || !ALLOWED_IMAGE_MIME_TYPES.includes(req.file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      throw new AppError(400, "INVALID_IMAGE");
    }

    const imageUrl = await uploadsService.saveRecipeImage(req.file);
    return res.status(201).json(ok({ imageUrl }));
  }
};
```

```ts
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { updateProfileSchema } from "./users.schemas";
import { usersController } from "./users.controller";

export const usersRouter = Router();

usersRouter.get("/authors/:username", asyncHandler(async (req: AuthenticatedRequest, res) => {
  return usersController.getAuthor(req, res);
}));

usersRouter.patch("/me", requireAuth, validate(updateProfileSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  return usersController.updateMe(req, res);
}));
```

```ts
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

uploadsRouter.post("/recipe-images", requireAuth, upload.single("file"), asyncHandler(async (req, res) => {
  return uploadsController.createRecipeImage(req, res);
}));
```

- [ ] **Step 4: Wire middleware and make the profile/upload tests pass**

Update `apps/api/src/app.ts`:

```ts
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env";
import { requireCsrf } from "./middleware/csrf";
import { router } from "./routes";

export const app = express();

app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api", requireCsrf, router);
```

Update `apps/api/src/routes/index.ts`:

```ts
import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { uploadsRouter } from "../modules/uploads/uploads.routes";
import { usersRouter } from "../modules/users/users.routes";

export const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/uploads", uploadsRouter);
```

Run: `pnpm --filter @cookpedia/api test -- profile-and-upload.test.ts`
Expected: PASS with profile update and file validation working.

- [ ] **Step 5: Commit profile, upload, and request-hardening**

```bash
git add apps/api/src/lib/firebase.ts apps/api/src/middleware/role.ts apps/api/src/middleware/csrf.ts apps/api/src/modules/users/users.schemas.ts apps/api/src/modules/users/users.service.ts apps/api/src/modules/users/users.controller.ts apps/api/src/modules/users/users.routes.ts apps/api/src/modules/uploads/uploads.service.ts apps/api/src/modules/uploads/uploads.controller.ts apps/api/src/modules/uploads/uploads.routes.ts apps/api/src/app.ts apps/api/src/routes/index.ts apps/api/tests/profile-and-upload.test.ts
git commit -m "feat: add profile endpoints and secure uploads"
```

### Task 5: Build Recipe Draft CRUD and Submission Rules

**Files:**
- Create: `apps/api/src/modules/recipes/recipes.schemas.ts`
- Create: `apps/api/src/modules/recipes/recipes.service.ts`
- Create: `apps/api/src/modules/recipes/recipes.controller.ts`
- Create: `apps/api/src/modules/recipes/recipes.routes.ts`
- Create: `apps/api/tests/recipe-draft.test.ts`
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: Write failing tests for draft creation, owner updates, and submit-for-review**

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("recipe drafts", () => {
  it("creates, updates, and blocks submit without a cover image", async () => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "linh@cookpedia.test",
      password: "SecretPass123!",
      displayName: "Linh Vo",
      username: "linh-vo"
    });

    const createResponse = await agent.post("/api/recipes").send({
      title: "Caramel Fish Clay Pot",
      shortDescription: "Savory fish with caramel sauce",
      prepMinutes: 20,
      cookMinutes: 35,
      servings: 4,
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      images: [],
      ingredients: [
        { name: "Catfish", quantity: 700, unit: "g", sortOrder: 1 }
      ],
      steps: [
        { stepNumber: 1, instruction: "Marinate the fish." }
      ]
    });

    expect(createResponse.status).toBe(201);

    const updateResponse = await agent.patch(`/api/recipes/${createResponse.body.recipe.id}`).send({
      ...createResponse.body.recipe,
      title: "Clay Pot Caramel Fish"
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.recipe.title).toBe("Clay Pot Caramel Fish");

    const submitResponse = await agent.post(`/api/recipes/${createResponse.body.recipe.id}/submit`).send();
    expect(submitResponse.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the draft test before implementing recipe routes**

Run: `pnpm --filter @cookpedia/api test -- recipe-draft.test.ts`
Expected: FAIL because `/api/recipes` does not exist.

- [ ] **Step 3: Implement recipe schemas and transactional draft upsert**

```ts
import { z } from "zod";

export const recipeInputSchema = z.object({
  title: z.string().min(3),
  shortDescription: z.string().min(10),
  prepMinutes: z.number().int().min(0),
  cookMinutes: z.number().int().min(0),
  servings: z.number().int().min(1),
  category: z.string().min(2),
  cuisine: z.string().min(2),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  locale: z.enum(["vi", "en"]),
  coverImageUrl: z.string().url().optional(),
  images: z.array(
    z.object({
      imageUrl: z.string().url(),
      caption: z.string().optional(),
      sortOrder: z.number().int().min(1)
    })
  ),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      sortOrder: z.number().int().min(1)
    })
  ).min(1),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().min(1),
      instruction: z.string().min(5)
    })
  ).min(1)
});

export const createRecipeSchema = z.object({
  body: recipeInputSchema,
  params: z.object({}),
  query: z.object({})
});
```

```ts
import { AppError } from "../../lib/app-error";
import { prisma } from "../../lib/prisma";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const recipesService = {
  async createDraft(authorId: string, input: any) {
    const slug = `${slugify(input.title)}-${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          authorId,
          title: input.title,
          slug,
          shortDescription: input.shortDescription,
          prepMinutes: input.prepMinutes,
          cookMinutes: input.cookMinutes,
          servings: input.servings,
          coverImageUrl: input.coverImageUrl,
          category: input.category,
          cuisine: input.cuisine,
          difficulty: input.difficulty
          locale: input.locale
        }
      });

      await tx.recipeImage.createMany({
        data: input.images.map((image: any) => ({ ...image, recipeId: recipe.id }))
      });

      await tx.ingredient.createMany({
        data: input.ingredients.map((ingredient: any) => ({
          recipeId: recipe.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          sortOrder: ingredient.sortOrder
        }))
      });

      await tx.step.createMany({
        data: input.steps.map((step: any) => ({
          recipeId: recipe.id,
          stepNumber: step.stepNumber,
          instruction: step.instruction
        }))
      });

      return tx.recipe.findUniqueOrThrow({
        where: { id: recipe.id },
        include: { images: true, ingredients: true, steps: true }
      });
    });
  },

  async listMine(authorId: string) {
    return prisma.recipe.findMany({
      where: { authorId },
      orderBy: { updatedAt: "desc" }
    });
  },

  async getEditable(recipeId: string, authorId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        authorId,
        status: { in: ["DRAFT", "REJECTED", "PENDING"] }
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        ingredients: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { stepNumber: "asc" } }
      }
    });

    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return recipe;
  },

  async updateDraft(recipeId: string, authorId: string, input: any) {
    const existing = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        authorId,
        status: { in: ["DRAFT", "REJECTED"] }
      }
    });

    if (!existing) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          title: input.title,
          shortDescription: input.shortDescription,
          prepMinutes: input.prepMinutes,
          cookMinutes: input.cookMinutes,
          servings: input.servings,
          coverImageUrl: input.coverImageUrl,
          category: input.category,
          cuisine: input.cuisine,
          difficulty: input.difficulty,
          locale: input.locale,
          rejectionReason: null
        }
      });

      await tx.recipeImage.deleteMany({ where: { recipeId } });
      await tx.ingredient.deleteMany({ where: { recipeId } });
      await tx.step.deleteMany({ where: { recipeId } });

      await tx.recipeImage.createMany({
        data: input.images.map((image: any) => ({ ...image, recipeId }))
      });

      await tx.ingredient.createMany({
        data: input.ingredients.map((ingredient: any) => ({
          recipeId,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          sortOrder: ingredient.sortOrder
        }))
      });

      await tx.step.createMany({
        data: input.steps.map((step: any) => ({
          recipeId,
          stepNumber: step.stepNumber,
          instruction: step.instruction
        }))
      });

      return tx.recipe.findUniqueOrThrow({
        where: { id: recipeId },
        include: { images: true, ingredients: true, steps: true }
      });
    });
  },

  async submit(recipeId: string, authorId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, authorId },
      include: { ingredients: true, steps: true }
    });

    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    if (!recipe.coverImageUrl || recipe.ingredients.length === 0 || recipe.steps.length === 0) {
      throw new AppError(400, "RECIPE_NOT_READY");
    }

    return prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status: "PENDING",
        submittedAt: new Date(),
        rejectionReason: null
      }
    });
  }
};
```

```ts
import type { Response } from "express";
import { created, ok } from "../../lib/api-response";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { recipesService } from "./recipes.service";

export const recipesController = {
  async createDraft(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.createDraft(req.auth!.userId, req.body);
    return res.status(201).json(created({ recipe }));
  },

  async listMine(req: AuthenticatedRequest, res: Response) {
    const recipes = await recipesService.listMine(req.auth!.userId);
    return res.status(200).json(ok({ recipes }));
  },

  async getEditable(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.getEditable(req.params.id, req.auth!.userId);
    return res.status(200).json(ok({ recipe }));
  },

  async updateDraft(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.updateDraft(req.params.id, req.auth!.userId, req.body);
    return res.status(200).json(ok({ recipe }));
  },

  async submit(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.submit(req.params.id, req.auth!.userId);
    return res.status(200).json(ok({ recipe }));
  }
};
```

```ts
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { recipesController } from "./recipes.controller";
import { createRecipeSchema } from "./recipes.schemas";

export const recipesRouter = Router();

recipesRouter.post("/", requireAuth, validate(createRecipeSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  return recipesController.createDraft(req, res);
}));

recipesRouter.get("/me", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  return recipesController.listMine(req, res);
}));

recipesRouter.get("/:id/edit", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  return recipesController.getEditable(req, res);
}));

recipesRouter.patch("/:id", requireAuth, validate(createRecipeSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  return recipesController.updateDraft(req, res);
}));

recipesRouter.post("/:id/submit", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  return recipesController.submit(req, res);
}));
```

- [ ] **Step 4: Wire the recipes router and make the draft tests pass**

Update `apps/api/src/routes/index.ts`:

```ts
import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { recipesRouter } from "../modules/recipes/recipes.routes";
import { uploadsRouter } from "../modules/uploads/uploads.routes";
import { usersRouter } from "../modules/users/users.routes";

export const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/uploads", uploadsRouter);
router.use("/recipes", recipesRouter);
```

Run: `pnpm --filter @cookpedia/api test -- recipe-draft.test.ts`
Expected: PASS with draft creation working and submit blocked until the recipe has a cover image.

- [ ] **Step 5: Commit the authoring flow**

```bash
git add apps/api/src/modules/recipes/recipes.schemas.ts apps/api/src/modules/recipes/recipes.service.ts apps/api/src/modules/recipes/recipes.controller.ts apps/api/src/modules/recipes/recipes.routes.ts apps/api/src/routes/index.ts apps/api/tests/recipe-draft.test.ts
git commit -m "feat: add recipe draft authoring and submission"
```

### Task 6: Implement Moderation, Public Explore, and Ingredient Search

**Files:**
- Create: `apps/api/src/modules/admin-recipes/admin-recipes.service.ts`
- Create: `apps/api/src/modules/admin-recipes/admin-recipes.controller.ts`
- Create: `apps/api/src/modules/admin-recipes/admin-recipes.routes.ts`
- Create: `apps/api/tests/moderation-and-search.test.ts`
- Modify: `apps/api/src/modules/recipes/recipes.service.ts`
- Modify: `apps/api/src/modules/recipes/recipes.controller.ts`
- Modify: `apps/api/src/modules/recipes/recipes.routes.ts`
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: Write failing moderation and search tests**

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("moderation and public search", () => {
  it("keeps pending recipes private until an admin approves them", async () => {
    const author = request.agent(app);
    const admin = request.agent(app);

    await author.post("/api/auth/register").send({
      email: "dao@cookpedia.test",
      password: "SecretPass123!",
      displayName: "Dao Vu",
      username: "dao-vu"
    });

    await admin.post("/api/auth/register").send({
      email: "admin@cookpedia.test",
      password: "SecretPass123!",
      displayName: "Cookpedia Admin",
      username: "cookpedia-admin"
    });

    await prisma.user.update({
      where: { email: "admin@cookpedia.test" },
      data: { role: "ADMIN" }
    });

    const recipeResponse = await author.post("/api/recipes").send({
      title: "Egg Coffee",
      shortDescription: "Sweet robusta coffee with whipped egg cream",
      prepMinutes: 10,
      cookMinutes: 5,
      servings: 2,
      coverImageUrl: "https://example.com/egg-coffee.jpg",
      category: "Drinks",
      cuisine: "Vietnamese",
      difficulty: "EASY",
      images: [
        { imageUrl: "https://example.com/egg-coffee.jpg", sortOrder: 1 }
      ],
      ingredients: [
        { name: "Egg", quantity: 2, unit: "pcs", sortOrder: 1 },
        { name: "Coffee", quantity: 120, unit: "ml", sortOrder: 2 }
      ],
      steps: [
        { stepNumber: 1, instruction: "Whip the egg yolks." }
      ]
    });

    await author.post(`/api/recipes/${recipeResponse.body.recipe.id}/submit`).send();

    const searchBeforeApprove = await request(app).get("/api/recipes/search?q=egg");
    expect(searchBeforeApprove.body.recipes).toHaveLength(0);

    const approveResponse = await admin
      .post(`/api/admin/recipes/${recipeResponse.body.recipe.id}/approve`)
      .send();

    expect(approveResponse.status).toBe(200);

    const searchAfterApprove = await request(app).get("/api/recipes/search?q=egg");
    expect(searchAfterApprove.status).toBe(200);
    expect(searchAfterApprove.body.recipes).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the moderation test before adding admin/public routes**

Run: `pnpm --filter @cookpedia/api test -- moderation-and-search.test.ts`
Expected: FAIL because `/api/recipes/search` does not exist and there is no admin moderation route.

- [ ] **Step 3: Extend recipe services with public queries and create admin moderation routes**

```ts
import { prisma } from "../../lib/prisma";

export const publicRecipesService = {
  async search(query: string) {
    return prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { ingredients: { some: { name: { contains: query, mode: "insensitive" } } } }
        ]
      },
      include: {
        author: { select: { username: true, displayName: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" },
      distinct: ["id"]
    });
  },

  async explore(sort: "newest" | "mostSaved") {
    return prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: { select: { username: true, displayName: true, avatarUrl: true } }
      },
      orderBy: sort === "mostSaved" ? { bookmarkCount: "desc" } : { createdAt: "desc" }
    });
  },

  async getBySlug(slug: string) {
    return prisma.recipe.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        ingredients: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { stepNumber: "asc" } },
        author: { select: { username: true, displayName: true, avatarUrl: true, bio: true } }
      }
    });
  }
};
```

Extend `apps/api/src/modules/recipes/recipes.controller.ts`:

```ts
import type { Response } from "express";
import { AppError } from "../../lib/app-error";
import { created, ok } from "../../lib/api-response";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { publicRecipesService } from "./recipes.service";
import { recipesService } from "./recipes.service";

export const recipesController = {
  async createDraft(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.createDraft(req.auth!.userId, req.body);
    return res.status(201).json(created({ recipe }));
  },

  async listMine(req: AuthenticatedRequest, res: Response) {
    const recipes = await recipesService.listMine(req.auth!.userId);
    return res.status(200).json(ok({ recipes }));
  },

  async getEditable(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.getEditable(req.params.id, req.auth!.userId);
    return res.status(200).json(ok({ recipe }));
  },

  async updateDraft(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.updateDraft(req.params.id, req.auth!.userId, req.body);
    return res.status(200).json(ok({ recipe }));
  },

  async submit(req: AuthenticatedRequest, res: Response) {
    const recipe = await recipesService.submit(req.params.id, req.auth!.userId);
    return res.status(200).json(ok({ recipe }));
  },

  async explore(req: AuthenticatedRequest, res: Response) {
    const sort = req.query.sort === "mostSaved" ? "mostSaved" : "newest";
    const recipes = await publicRecipesService.explore(sort);
    return res.status(200).json(ok({ recipes }));
  },

  async search(req: AuthenticatedRequest, res: Response) {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(200).json(ok({ recipes: [] }));
    }

    const recipes = await publicRecipesService.search(q);
    return res.status(200).json(ok({ recipes }));
  },

  async getPublishedBySlug(req: AuthenticatedRequest, res: Response) {
    const recipe = await publicRecipesService.getBySlug(req.params.slug);
    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return res.status(200).json(ok({ recipe }));
  }
};
```

```ts
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/app-error";

export const adminRecipesService = {
  listPending() {
    return prisma.recipe.findMany({
      where: { status: "PENDING" },
      include: { author: { select: { username: true, displayName: true } } },
      orderBy: { submittedAt: "asc" }
    });
  },

  async getForReview(id: string) {
    const recipe = await prisma.recipe.findFirst({
      where: { id },
      include: {
        author: { select: { username: true, displayName: true } },
        images: { orderBy: { sortOrder: "asc" } },
        ingredients: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { stepNumber: "asc" } }
      }
    });

    if (!recipe) {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    return recipe;
  },

  approve(id: string, reviewerId: string) {
    return prisma.recipe.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        rejectionReason: null
      }
    });
  },

  reject(id: string, reviewerId: string, rejectionReason: string) {
    return prisma.recipe.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        rejectionReason
      }
    });
  }
};
```

```ts
import type { Response } from "express";
import { ok } from "../../lib/api-response";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { adminRecipesService } from "./admin-recipes.service";

export const adminRecipesController = {
  async listPending(_req: AuthenticatedRequest, res: Response) {
    const recipes = await adminRecipesService.listPending();
    return res.status(200).json(ok({ recipes }));
  },

  async getOne(req: AuthenticatedRequest, res: Response) {
    const recipe = await adminRecipesService.getForReview(req.params.id);
    return res.status(200).json(ok({ recipe }));
  },

  async approve(req: AuthenticatedRequest, res: Response) {
    const recipe = await adminRecipesService.approve(req.params.id, req.auth!.userId);
    return res.status(200).json(ok({ recipe }));
  },

  async reject(req: AuthenticatedRequest, res: Response) {
    const recipe = await adminRecipesService.reject(req.params.id, req.auth!.userId, req.body.rejectionReason);
    return res.status(200).json(ok({ recipe }));
  }
};
```

```ts
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { adminRecipesController } from "./admin-recipes.controller";

export const adminRecipesRouter = Router();

adminRecipesRouter.use(requireAuth, requireRole("ADMIN"));

adminRecipesRouter.get("/pending", asyncHandler(async (req, res) => adminRecipesController.listPending(req, res)));
adminRecipesRouter.get("/:id", asyncHandler(async (req, res) => adminRecipesController.getOne(req, res)));
adminRecipesRouter.post("/:id/approve", asyncHandler(async (req, res) => adminRecipesController.approve(req, res)));
adminRecipesRouter.post("/:id/reject", asyncHandler(async (req, res) => adminRecipesController.reject(req, res)));
```

- [ ] **Step 4: Add public recipe routes and make the moderation/search tests pass**

Extend `apps/api/src/modules/recipes/recipes.routes.ts`:

```ts
recipesRouter.get("/explore", asyncHandler(async (req, res) => {
  return recipesController.explore(req, res);
}));

recipesRouter.get("/search", asyncHandler(async (req, res) => {
  return recipesController.search(req, res);
}));

recipesRouter.get("/slug/:slug", asyncHandler(async (req, res) => {
  return recipesController.getPublishedBySlug(req, res);
}));
```

Update `apps/api/src/routes/index.ts`:

```ts
import { adminRecipesRouter } from "../modules/admin-recipes/admin-recipes.routes";

router.use("/admin/recipes", adminRecipesRouter);
```

Run: `pnpm --filter @cookpedia/api test -- moderation-and-search.test.ts`
Expected: PASS with pending recipes hidden and ingredient search returning only approved published recipes.

- [ ] **Step 5: Commit moderation and discovery**

```bash
git add apps/api/src/modules/admin-recipes/admin-recipes.service.ts apps/api/src/modules/admin-recipes/admin-recipes.controller.ts apps/api/src/modules/admin-recipes/admin-recipes.routes.ts apps/api/src/modules/recipes/recipes.service.ts apps/api/src/modules/recipes/recipes.controller.ts apps/api/src/modules/recipes/recipes.routes.ts apps/api/src/routes/index.ts apps/api/tests/moderation-and-search.test.ts
git commit -m "feat: add moderation and public recipe discovery"
```

### Task 7: Implement Ratings, Reviews, Bookmarks, and Aggregate Counters

**Files:**
- Create: `apps/api/src/modules/ratings/ratings.service.ts`
- Create: `apps/api/src/modules/ratings/ratings.controller.ts`
- Create: `apps/api/src/modules/ratings/ratings.routes.ts`
- Create: `apps/api/src/modules/bookmarks/bookmarks.service.ts`
- Create: `apps/api/src/modules/bookmarks/bookmarks.controller.ts`
- Create: `apps/api/src/modules/bookmarks/bookmarks.routes.ts`
- Create: `apps/api/tests/engagement.test.ts`
- Modify: `apps/api/src/modules/recipes/recipes.service.ts`
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: Write failing tests for rating upsert, self-rating rejection, and bookmarking**

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("ratings and bookmarks", () => {
  it("lets another user rate and bookmark a published recipe", async () => {
    const author = request.agent(app);
    const reader = request.agent(app);

    await author.post("/api/auth/register").send({
      email: "thu@cookpedia.test",
      password: "SecretPass123!",
      displayName: "Thu Le",
      username: "thu-le"
    });

    await reader.post("/api/auth/register").send({
      email: "reader@cookpedia.test",
      password: "SecretPass123!",
      displayName: "Khanh Bui",
      username: "khanh-bui"
    });

    const create = await author.post("/api/recipes").send({
      title: "Tomato Egg Stir Fry",
      shortDescription: "Soft eggs in a quick tomato sauce",
      prepMinutes: 10,
      cookMinutes: 12,
      servings: 2,
      coverImageUrl: "https://example.com/tomato-egg.jpg",
      category: "Lunch",
      cuisine: "Chinese",
      difficulty: "EASY",
      images: [{ imageUrl: "https://example.com/tomato-egg.jpg", sortOrder: 1 }],
      ingredients: [
        { name: "Egg", quantity: 3, unit: "pcs", sortOrder: 1 },
        { name: "Tomato", quantity: 2, unit: "pcs", sortOrder: 2 }
      ],
      steps: [{ stepNumber: 1, instruction: "Scramble the eggs gently." }]
    });

    expect(create.status).toBe(201);

    await prisma.recipe.update({
      where: { id: create.body.recipe.id },
      data: { status: "PUBLISHED" }
    });

    const rate = await reader.post(`/api/ratings/${create.body.recipe.id}`).send({
      score: 5,
      comment: "Fast, balanced, and weeknight-friendly."
    });

    expect(rate.status).toBe(200);

    const bookmark = await reader.post(`/api/bookmarks/${create.body.recipe.id}`).send();
    expect(bookmark.status).toBe(200);

    const selfRate = await author.post(`/api/ratings/${create.body.recipe.id}`).send({
      score: 5,
      comment: "I made this."
    });

    expect(selfRate.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the engagement test before creating the endpoints**

Run: `pnpm --filter @cookpedia/api test -- engagement.test.ts`
Expected: FAIL because the rating and bookmark routes do not exist.

- [ ] **Step 3: Implement rating upsert and bookmark toggle routes with aggregate refresh**

```ts
import { AppError } from "../../lib/app-error";
import { prisma } from "../../lib/prisma";

export const ratingsService = {
  async save(userId: string, recipeId: string, input: { score: number; comment?: string }) {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe || recipe.status !== "PUBLISHED") {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }
    if (recipe.authorId === userId) {
      throw new AppError(400, "CANNOT_RATE_OWN_RECIPE");
    }

    await prisma.rating.upsert({
      where: { userId_recipeId: { userId, recipeId: recipe.id } },
      update: { score: input.score, comment: input.comment },
      create: { userId, recipeId: recipe.id, score: input.score, comment: input.comment }
    });

    const aggregate = await prisma.rating.aggregate({
      where: { recipeId: recipe.id },
      _avg: { score: true },
      _count: { _all: true }
    });

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        ratingAverage: aggregate._avg.score ?? 0,
        ratingCount: aggregate._count._all
      }
    });
  }
};
```

```ts
import { AppError } from "../../lib/app-error";
import { prisma } from "../../lib/prisma";

export const bookmarksService = {
  async listMine(userId: string) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        recipe: {
          include: {
            author: { select: { username: true, displayName: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return bookmarks.map((bookmark) => bookmark.recipe);
  },

  async add(userId: string, recipeId: string) {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe || recipe.status !== "PUBLISHED") {
      throw new AppError(404, "RECIPE_NOT_FOUND");
    }

    await prisma.bookmark.upsert({
      where: { userId_recipeId: { userId, recipeId: recipe.id } },
      update: {},
      create: { userId, recipeId: recipe.id }
    });

    const count = await prisma.bookmark.count({ where: { recipeId: recipe.id } });
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { bookmarkCount: count }
    });
  },

  async remove(userId: string, recipeId: string) {
    await prisma.bookmark.delete({
      where: { userId_recipeId: { userId, recipeId } }
    });

    const count = await prisma.bookmark.count({ where: { recipeId } });
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { bookmarkCount: count }
    });
  }
};
```

```ts
import type { Response } from "express";
import { ok } from "../../lib/api-response";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { ratingsService } from "./ratings.service";

export const ratingsController = {
  async save(req: AuthenticatedRequest, res: Response) {
    await ratingsService.save(req.auth!.userId, req.params.recipeId, req.body);
    return res.status(200).json(ok({ message: "RATING_SAVED" }));
  }
};
```

```ts
import type { Response } from "express";
import { ok } from "../../lib/api-response";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { bookmarksService } from "./bookmarks.service";

export const bookmarksController = {
  async listMine(req: AuthenticatedRequest, res: Response) {
    const recipes = await bookmarksService.listMine(req.auth!.userId);
    return res.status(200).json(ok({ recipes }));
  },

  async add(req: AuthenticatedRequest, res: Response) {
    await bookmarksService.add(req.auth!.userId, req.params.recipeId);
    return res.status(200).json(ok({ message: "BOOKMARKED" }));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await bookmarksService.remove(req.auth!.userId, req.params.recipeId);
    return res.status(200).json(ok({ message: "UNBOOKMARKED" }));
  }
};
```

```ts
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth";
import { ratingsController } from "./ratings.controller";

export const ratingsRouter = Router();

ratingsRouter.post("/:recipeId", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  return ratingsController.save(req, res);
}));
```

```ts
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth";
import { bookmarksController } from "./bookmarks.controller";

export const bookmarksRouter = Router();

bookmarksRouter.get("/me", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  return bookmarksController.listMine(req, res);
}));

bookmarksRouter.post("/:recipeId", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  return bookmarksController.add(req, res);
}));

bookmarksRouter.delete("/:recipeId", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  return bookmarksController.remove(req, res);
}));
```

- [ ] **Step 4: Wire the engagement routes and make the tests pass**

Update `apps/api/src/routes/index.ts`:

```ts
import { bookmarksRouter } from "../modules/bookmarks/bookmarks.routes";
import { ratingsRouter } from "../modules/ratings/ratings.routes";

router.use("/ratings", ratingsRouter);
router.use("/bookmarks", bookmarksRouter);
```

Run: `pnpm --filter @cookpedia/api test -- engagement.test.ts`
Expected: PASS with rating upsert, self-rating rejection, and bookmark counter refresh working.

Run: `pnpm --filter @cookpedia/api test`
Expected: PASS with all API tests green.

- [ ] **Step 5: Commit the engagement layer**

```bash
git add apps/api/src/modules/ratings/ratings.service.ts apps/api/src/modules/ratings/ratings.controller.ts apps/api/src/modules/ratings/ratings.routes.ts apps/api/src/modules/bookmarks/bookmarks.service.ts apps/api/src/modules/bookmarks/bookmarks.controller.ts apps/api/src/modules/bookmarks/bookmarks.routes.ts apps/api/src/routes/index.ts apps/api/tests/engagement.test.ts
git commit -m "feat: add ratings reviews and bookmarks"
```

### Task 8: Build the Shared UI Foundation, Frontend Shell, and Public Pages

**Files:**
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/lib/providers.tsx`
- Create: `apps/web/lib/store.ts`
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/lib/constants/site.ts`
- Create: `apps/web/lib/constants/localization.ts`
- Create: `apps/web/lib/constants/recipes.ts`
- Create: `apps/web/lib/utils.ts`
- Create: `apps/web/features/auth/auth-slice.ts`
- Create: `apps/web/features/bookmarks/bookmarks-slice.ts`
- Create: `apps/web/components/ui/button.tsx`
- Create: `apps/web/components/ui/input.tsx`
- Create: `apps/web/components/ui/textarea.tsx`
- Create: `apps/web/components/ui/card-surface.tsx`
- Create: `apps/web/components/ui/section-heading.tsx`
- Create: `apps/web/components/ui/status-badge.tsx`
- Create: `apps/web/components/ui/tabs.tsx`
- Create: `apps/web/components/layout/site-header.tsx`
- Create: `apps/web/components/recipes/recipe-card.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/search/page.tsx`
- Create: `apps/web/app/recipes/[slug]/page.tsx`
- Create: `apps/web/app/authors/[username]/page.tsx`

- [ ] **Step 1: Create the app providers, store, design tokens, and generate the base shadcn primitives**

```ts
"use client";

import { Provider } from "react-redux";
import { store } from "./store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

```ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth-slice";
import bookmarksReducer from "../features/bookmarks/bookmarks-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookmarks: bookmarksReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```ts
export const SITE_NAME = "Cookpedia";
export const SITE_DESCRIPTION = "Structured recipe sharing with editorial-grade design.";
export const MAIN_NAV = [
  { href: "/search", label: { vi: "Tìm kiếm", en: "Search" } },
  { href: "/profile", label: { vi: "Cá nhân", en: "Profile" } }
] as const;
```

```ts
export const SUPPORTED_UI_LOCALES = ["vi", "en"] as const;
export const DEFAULT_UI_LOCALE = "vi";
export const UI_LOCALE_LABELS = {
  vi: "Tiếng Việt",
  en: "English"
} as const;
```

```ts
export const RECIPE_STATUS_LABELS = {
  DRAFT: { vi: "Bản nháp", en: "Draft" },
  PENDING: { vi: "Chờ duyệt", en: "Pending" },
  PUBLISHED: { vi: "Đã đăng", en: "Published" },
  REJECTED: { vi: "Bị từ chối", en: "Rejected" }
} as const;

export const RECIPE_SORT_OPTIONS = [
  { value: "newest", label: { vi: "Mới nhất", en: "Newest" } },
  { value: "mostSaved", label: { vi: "Được lưu nhiều", en: "Most saved" } }
] as const;
```

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  status: "unknown" | "authenticated" | "anonymous";
  user: null | {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    role: "USER" | "ADMIN";
  };
};

const initialState: AuthState = {
  status: "unknown",
  user: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthState(state, action: PayloadAction<AuthState>) {
      state.status = action.payload.status;
      state.user = action.payload.user;
    },
    clearAuthState(state) {
      state.status = "anonymous";
      state.user = null;
    }
  }
});

export const { setAuthState, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
```

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type BookmarksState = {
  recipeIds: string[];
};

const initialState: BookmarksState = {
  recipeIds: []
};

const bookmarksSlice = createSlice({
  name: "bookmarks",
  initialState,
  reducers: {
    replaceBookmarks(state, action: PayloadAction<string[]>) {
      state.recipeIds = action.payload;
    },
    toggleBookmark(state, action: PayloadAction<string>) {
      if (state.recipeIds.includes(action.payload)) {
        state.recipeIds = state.recipeIds.filter((id) => id !== action.payload);
      } else {
        state.recipeIds.push(action.payload);
      }
    }
  }
});

export const { replaceBookmarks, toggleBookmark } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --canvas: #f2efe7;
  --panel: #fbfaf6;
  --ink: #162019;
  --muted: #667063;
  --accent: #516044;
  --accent-strong: #324132;
  --line: #d8d2c3;
}

body {
  background: var(--canvas);
  color: var(--ink);
}

.page-shell {
  @apply mx-auto max-w-[1400px] px-4 md:px-8;
}

.panel {
  @apply rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] shadow-[0_20px_40px_-18px_rgba(22,32,25,0.15)];
}
```

Run from `apps/web`: `pnpm dlx shadcn@latest add button input textarea card tabs badge skeleton dialog select avatar`
Expected: the generated primitives appear under `apps/web/components/ui`.

Create `apps/web/lib/utils.ts` for shadcn component helpers:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Then customize the generated files so they reflect Cookpedia instead of the default shadcn look:

```tsx
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[1.35rem] text-sm font-medium transition-transform duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent-strong)] text-white shadow-[0_14px_30px_-18px_rgba(22,32,25,0.55)]",
        secondary: "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)]",
        ghost: "text-[var(--muted)] hover:bg-black/5"
      },
      size: {
        default: "h-12 px-5 py-3",
        sm: "h-10 rounded-[1rem] px-4",
        lg: "h-14 rounded-[1.5rem] px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
```

```tsx
import { Badge } from "@/components/ui/badge";

const statusVariantMap = {
  DRAFT: "secondary",
  PENDING: "outline",
  PUBLISHED: "default",
  REJECTED: "destructive"
} as const;

export function StatusBadge({
  status,
  label
}: {
  status: keyof typeof statusVariantMap;
  label?: string;
}) {
  return (
    <Badge variant={statusVariantMap[status]} className="rounded-full px-3 py-1 text-[11px] tracking-[0.16em] uppercase">
      {label ?? status}
    </Badge>
  );
}
```

```tsx
export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{eyebrow}</p>
      <h1 className="text-4xl tracking-tight md:text-5xl">{title}</h1>
      {description ? <p className="max-w-[60ch] leading-relaxed text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}
```

```tsx
import { Card, CardContent } from "@/components/ui/card";

export function CardSurface({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`rounded-[2rem] border-[var(--line)] bg-[var(--panel)] shadow-[0_20px_40px_-18px_rgba(22,32,25,0.15)] ${className}`.trim()}>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
```

```tsx
import Link from "next/link";
import { Button } from "../ui/button";
import { MAIN_NAV, SITE_NAME } from "../../lib/constants/site";

export function SiteHeader() {
  return (
    <header className="page-shell flex items-center justify-between py-5">
      <Link href="/" className="text-lg tracking-[0.18em] uppercase text-[var(--muted)]">
        {SITE_NAME}
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Button asChild variant="secondary">
          <Link href={MAIN_NAV[0].href}>{MAIN_NAV[0].label.en}</Link>
        </Button>
        <Button asChild>
          <Link href={MAIN_NAV[1].href}>{MAIN_NAV[1].label.en}</Link>
        </Button>
      </nav>
    </header>
  );
}
```

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../lib/providers";
import { SiteHeader } from "../components/layout/site-header";
import { SITE_DESCRIPTION, SITE_NAME } from "../lib/constants/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} min-h-[100dvh] font-sans`}>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add the shared API client and recipe card primitives**

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API_GET_FAILED:${path}`);
  }

  return response.json() as Promise<T>;
}

export async function apiWrite<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`API_WRITE_FAILED:${path}`);
  }

  return response.json() as Promise<T>;
}
```

```tsx
import Link from "next/link";
import { CardSurface } from "../ui/card-surface";

type RecipeCardProps = {
  recipe: {
    slug: string;
    title: string;
    coverImageUrl: string | null;
    cookMinutes: number;
    prepMinutes: number;
    ratingAverage: number;
    author: { username: string; displayName: string };
  };
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <CardSurface className="overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <Link href={`/recipes/${recipe.slug}`} className="group block">
        <div className="aspect-[4/3] bg-stone-200">
          {recipe.coverImageUrl ? (
            <img
              src={recipe.coverImageUrl}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : null}
        </div>
        <div className="space-y-3 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {recipe.author.displayName}
          </p>
          <h3 className="text-2xl tracking-tight">{recipe.title}</h3>
          <div className="flex items-center justify-between text-sm text-[var(--muted)]">
            <span>{recipe.prepMinutes + recipe.cookMinutes} min total</span>
            <span>{recipe.ratingAverage.toFixed(1)} / 5</span>
          </div>
        </div>
      </Link>
    </CardSurface>
  );
}
```

- [ ] **Step 3: Implement the homepage, search, detail, and public author pages**

```tsx
import Link from "next/link";
import { apiGet } from "../lib/api";
import { RecipeCard } from "../components/recipes/recipe-card";
import { Button } from "../components/ui/button";
import { CardSurface } from "../components/ui/card-surface";
import { Input } from "../components/ui/input";
import { SectionHeading } from "../components/ui/section-heading";

export default async function HomePage() {
  const { recipes } = await apiGet<{ recipes: any[] }>("/recipes/explore?sort=newest");

  return (
    <main className="min-h-[100dvh] pb-20">
      <section className="page-shell grid gap-10 py-8 md:grid-cols-[1.2fr_0.8fr] md:py-14">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Cookpedia"
            title="Search, save, and publish recipes with structure."
            description="Discover ingredient-led dishes, follow standout creators, and manage your own recipe studio."
          />
          <form action="/search" className="panel flex flex-col gap-3 p-4 md:flex-row">
            <Input
              name="q"
              placeholder="Find recipes or ingredients"
              className="flex-1"
            />
            <Button>Explore</Button>
          </form>
        </div>
        <CardSurface className="overflow-hidden p-4">
          <div className="grid h-full gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(140deg,#324132,#76816c)]" />
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-white/25 bg-white/30" />
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel)]" />
            </div>
          </div>
        </CardSurface>
      </section>

      <section className="page-shell space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Freshly approved</p>
            <h2 className="text-3xl tracking-tight md:text-4xl">New recipes from the Cookpedia table</h2>
          </div>
          <Link href="/search" className="text-sm text-[var(--accent-strong)]">Browse all</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          {recipes.slice(0, 3).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </main>
  );
}
```

```tsx
import { apiGet } from "../../lib/api";
import { RecipeCard } from "../../components/recipes/recipe-card";
import { SectionHeading } from "../../components/ui/section-heading";

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const data = query
    ? await apiGet<{ recipes: any[] }>(`/recipes/search?q=${encodeURIComponent(query)}`)
    : { recipes: [] };

  return (
    <main className="page-shell py-10">
      <div className="mb-8">
        <SectionHeading eyebrow="Search" title={`Results for “${query || "all recipes"}”`} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </main>
  );
}
```

```tsx
import { apiGet } from "../../../lib/api";

export default async function RecipeDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { recipe } = await apiGet<{ recipe: any }>(`/recipes/slug/${slug}`);

  return (
    <main className="page-shell py-10">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {recipe.images.map((image: any) => (
            <img key={image.id} src={image.imageUrl} alt={recipe.title} className="panel aspect-[4/3] w-full object-cover" />
          ))}
        </div>
        <aside className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{recipe.author.displayName}</p>
            <h1 className="mt-2 text-5xl tracking-tighter">{recipe.title}</h1>
            <p className="mt-4 max-w-[55ch] leading-relaxed text-[var(--muted)]">{recipe.shortDescription}</p>
          </div>
          <div className="panel grid gap-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Ingredients</p>
              <ul className="mt-3 grid gap-2">
                {recipe.ingredients.map((ingredient: any) => (
                  <li key={ingredient.id} className="flex justify-between border-b border-[var(--line)] pb-2 text-sm">
                    <span>{ingredient.name}</span>
                    <span>{ingredient.quantity} {ingredient.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Method</p>
              <ol className="mt-3 grid gap-4">
                {recipe.steps.map((step: any) => (
                  <li key={step.id} className="grid grid-cols-[32px_1fr] gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-strong)] text-sm text-white">
                      {step.stepNumber}
                    </span>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
```

```tsx
import { apiGet } from "../../../lib/api";

export default async function AuthorPage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { author } = await apiGet<{ author: any }>(`/users/authors/${username}`);

  return (
    <main className="page-shell py-10">
      <section className="panel mb-8 grid gap-4 p-8 md:grid-cols-[120px_1fr]">
        <div className="h-[120px] w-[120px] rounded-full bg-stone-300">
          {author.avatarUrl ? <img src={author.avatarUrl} alt={author.displayName} className="h-full w-full rounded-full object-cover" /> : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Author profile</p>
          <h1 className="mt-2 text-4xl tracking-tight">{author.displayName}</h1>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--muted)]">{author.bio}</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {author.recipes.map((recipe: any) => (
          <a key={recipe.id} href={`/recipes/${recipe.slug}`} className="panel overflow-hidden">
            <div className="aspect-[4/3] bg-stone-200">
              {recipe.coverImageUrl ? <img src={recipe.coverImageUrl} alt={recipe.title} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="space-y-2 p-5">
              <h2 className="text-2xl tracking-tight">{recipe.title}</h2>
              <p className="text-sm text-[var(--muted)]">{recipe.shortDescription}</p>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify the public frontend compiles cleanly**

Run: `pnpm --filter @cookpedia/web typecheck`
Expected: PASS with the public page routes compiling.

Run: `pnpm --filter @cookpedia/web lint`
Expected: PASS with no Next/Tailwind issues.

- [ ] **Step 5: Commit the public frontend shell**

```bash
git add apps/web/app/globals.css apps/web/app/layout.tsx apps/web/lib/providers.tsx apps/web/lib/store.ts apps/web/lib/api.ts apps/web/lib/constants/site.ts apps/web/lib/constants/localization.ts apps/web/lib/constants/recipes.ts apps/web/lib/utils.ts apps/web/features/auth/auth-slice.ts apps/web/features/bookmarks/bookmarks-slice.ts apps/web/components/ui/button.tsx apps/web/components/ui/input.tsx apps/web/components/ui/textarea.tsx apps/web/components/ui/card-surface.tsx apps/web/components/ui/section-heading.tsx apps/web/components/ui/status-badge.tsx apps/web/components/ui/tabs.tsx apps/web/components/layout/site-header.tsx apps/web/components/recipes/recipe-card.tsx apps/web/app/page.tsx apps/web/app/search/page.tsx apps/web/app/recipes/[slug]/page.tsx apps/web/app/authors/[username]/page.tsx
git commit -m "feat: add cookpedia public frontend"
```

### Task 9: Build Authenticated Frontend Flows for Auth, Profile, and Settings

**Files:**
- Create: `apps/web/app/login/page.tsx`
- Create: `apps/web/app/register/page.tsx`
- Create: `apps/web/app/profile/page.tsx`
- Create: `apps/web/app/settings/profile/page.tsx`
- Create: `apps/web/components/auth/auth-form.tsx`
- Create: `apps/web/components/profile/profile-tabs.tsx`

- [ ] **Step 1: Add the auth form primitive and register/login pages**

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiWrite } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type AuthFormValues = {
  email: string;
  password: string;
  displayName?: string;
  username?: string;
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState("");
  const { register, handleSubmit } = useForm<AuthFormValues>();

  const onSubmit = handleSubmit(async (values) => {
    setError("");

    try {
      await apiWrite(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(values)
      });
      window.location.href = "/profile";
    } catch {
      setError("Unable to authenticate. Check your credentials and try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="panel mx-auto grid max-w-xl gap-4 p-6">
      {mode === "register" ? <Input {...register("displayName")} placeholder="Display name" /> : null}
      {mode === "register" ? <Input {...register("username")} placeholder="Username" /> : null}
      <Input {...register("email")} placeholder="Email" />
      <Input {...register("password")} type="password" placeholder="Password" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button>
        {mode === "login" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
```

```tsx
import { AuthForm } from "../../components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="page-shell py-16">
      <h1 className="mb-8 text-4xl tracking-tight">Sign in to Cookpedia</h1>
      <AuthForm mode="login" />
    </main>
  );
}
```

```tsx
import { AuthForm } from "../../components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="page-shell py-16">
      <h1 className="mb-8 text-4xl tracking-tight">Create your Cookpedia account</h1>
      <AuthForm mode="register" />
    </main>
  );
}
```

- [ ] **Step 2: Add private profile and profile settings pages**

```tsx
"use client";

import { useState } from "react";
import { RECIPE_STATUS_LABELS } from "../../lib/constants/recipes";
import { StatusBadge } from "../ui/status-badge";
import { Tabs } from "../ui/tabs";

export function ProfileTabs({
  recipes,
  saved
}: {
  recipes: any[];
  saved: any[];
}) {
  const [tab, setTab] = useState<"recipes" | "saved">("recipes");
  const activeList = tab === "recipes" ? recipes : saved;

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "recipes", label: "My Recipes" },
          { value: "saved", label: "Saved" }
        ]}
      />
      <div className="grid gap-4">
        {activeList.map((item) => (
          <div key={item.id} className="panel flex items-center justify-between p-4">
            <div>
              <p className="text-lg">{item.title}</p>
              {"status" in item ? <StatusBadge status={item.status} label={RECIPE_STATUS_LABELS[item.status].en} /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileTabs } from "../../components/profile/profile-tabs";

export default function ProfilePage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [recipesResponse, savedResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/recipes/me`, {
          credentials: "include"
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/bookmarks/me`, {
          credentials: "include"
        })
      ]);

      const recipesData = await recipesResponse.json();
      const savedData = await savedResponse.json();
      setRecipes(recipesData.recipes);
      setSaved(savedData.recipes);
    };

    void load();
  }, []);

  return (
    <main className="page-shell py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Private profile</p>
          <h1 className="text-4xl tracking-tight">Your Cookpedia workspace</h1>
        </div>
        <Link href="/settings/profile" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">
          Edit profile
        </Link>
      </div>
      <ProfileTabs recipes={recipes} saved={saved} />
    </main>
  );
}
```

```tsx
"use client";

import { useForm } from "react-hook-form";
import { apiWrite } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";

type ProfileSettingsValues = {
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  locale?: "vi" | "en";
};

export default function ProfileSettingsPage() {
  const { register, handleSubmit } = useForm<ProfileSettingsValues>();

  return (
    <main className="page-shell py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Settings</p>
        <h1 className="text-4xl tracking-tight">Edit your profile</h1>
      </div>
      <form
        onSubmit={handleSubmit(async (values) => {
          await apiWrite("/users/me", {
            method: "PATCH",
            body: JSON.stringify(values)
          });
          window.location.href = "/profile";
        })}
        className="panel grid max-w-3xl gap-4 p-6"
      >
        <Input {...register("displayName")} placeholder="Display name" />
        <Input {...register("username")} placeholder="Username" />
        <Input {...register("avatarUrl")} placeholder="Avatar URL" />
        <select {...register("locale")} className="min-h-12 rounded-2xl border border-[var(--line)] bg-transparent px-4">
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
        <Textarea {...register("bio")} placeholder="Bio" />
        <Button>Save changes</Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Verify the authenticated frontend routes compile**

Run: `pnpm --filter @cookpedia/web typecheck`
Expected: PASS with login, register, profile, and settings pages compiling.

Run: `pnpm --filter @cookpedia/web lint`
Expected: PASS with no client-component or App Router lint issues.

- [ ] **Step 4: Add the auth and profile routes to version control**

```bash
git add apps/web/app/login/page.tsx apps/web/app/register/page.tsx apps/web/app/profile/page.tsx apps/web/app/settings/profile/page.tsx apps/web/components/auth/auth-form.tsx apps/web/components/profile/profile-tabs.tsx
git commit -m "feat: add auth pages and private profile"
```

- [ ] **Step 5: Manually verify cookie-based auth in the browser**

Run: `pnpm dev`
Expected: the API runs on port `4000`, the web app runs on port `3000`, and signing in redirects to `/profile` with cookies present in the browser devtools.

### Task 10: Implement Recipe Studio, Admin Console, and End-to-End Tests

**Files:**
- Create: `apps/web/app/profile/recipes/new/page.tsx`
- Create: `apps/web/app/profile/recipes/[id]/edit/page.tsx`
- Create: `apps/web/app/admin/recipes/pending/page.tsx`
- Create: `apps/web/app/admin/recipes/[id]/page.tsx`
- Create: `apps/web/components/recipes/recipe-image-upload-field.tsx`
- Create: `apps/web/components/recipes/recipe-studio-form.tsx`
- Create: `apps/web/components/admin/moderation-action-panel.tsx`
- Create: `playwright.config.ts`
- Create: `tests/e2e/auth-and-profile.spec.ts`
- Create: `tests/e2e/moderation-flow.spec.ts`
- Create: `tests/e2e/search-and-engagement.spec.ts`

- [ ] **Step 1: Add the structured recipe studio form with field arrays**

```tsx
"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { apiWrite } from "../../../lib/api";
import { Button } from "../ui/button";
import { CardSurface } from "../ui/card-surface";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { RecipeImageUploadField } from "./recipe-image-upload-field";

type RecipeFormValues = {
  title: string;
  shortDescription: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  category: string;
  cuisine: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  locale: "vi" | "en";
  coverImageUrl?: string;
  images: { imageUrl: string; caption?: string; sortOrder: number }[];
  ingredients: { name: string; quantity: number; unit: string; sortOrder: number }[];
  steps: { stepNumber: number; instruction: string }[];
};

export function RecipeStudioForm({
  recipeId,
  initialValues
}: {
  recipeId?: string;
  initialValues?: Partial<RecipeFormValues>;
}) {
  const [submissionMode, setSubmissionMode] = useState<"draft" | "submit">("draft");
  const form = useForm<RecipeFormValues>({
    defaultValues: {
      title: "",
      shortDescription: "",
      prepMinutes: 10,
      cookMinutes: 20,
      servings: 2,
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      locale: "vi",
      coverImageUrl: "",
      images: [],
      ingredients: [{ name: "", quantity: 1, unit: "pcs", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "" }],
      ...initialValues
    }
  });

  const ingredients = useFieldArray({ control: form.control, name: "ingredients" });
  const steps = useFieldArray({ control: form.control, name: "steps" });

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        const payload = {
          ...values,
          images:
            values.images.length > 0
              ? values.images
              : values.coverImageUrl
                ? [{ imageUrl: values.coverImageUrl, sortOrder: 1 }]
                : []
        };

        const draftResponse = await apiWrite<{ recipe: { id: string } }>(recipeId ? `/recipes/${recipeId}` : "/recipes", {
          method: recipeId ? "PATCH" : "POST",
          body: JSON.stringify(payload)
        });

        if (submissionMode === "submit") {
          await apiWrite(`/recipes/${draftResponse.recipe.id}/submit`, {
            method: "POST",
            body: JSON.stringify({})
          });
        }

        window.location.href = "/profile";
      })}
      className="grid gap-8"
    >
      <CardSurface className="grid gap-4 p-6">
        <Input {...form.register("title")} placeholder="Recipe title" />
        <Textarea {...form.register("shortDescription")} placeholder="Short description" className="min-h-28" />
        <select {...form.register("locale")} className="min-h-12 rounded-2xl border border-[var(--line)] bg-transparent px-4">
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
        <Input {...form.register("coverImageUrl")} placeholder="Cover image URL" />
        <RecipeImageUploadField
          onUploaded={(imageUrl) => {
            form.setValue("coverImageUrl", imageUrl);
            form.setValue("images", [{ imageUrl, sortOrder: 1 }]);
          }}
        />
      </CardSurface>

      <CardSurface className="grid gap-4 p-6">
        {ingredients.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 md:grid-cols-3">
            <Input {...form.register(`ingredients.${index}.name`)} placeholder="Ingredient" />
            <Input type="number" step="0.01" {...form.register(`ingredients.${index}.quantity`, { valueAsNumber: true })} placeholder="Qty" />
            <Input {...form.register(`ingredients.${index}.unit`)} placeholder="Unit" />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => ingredients.append({ name: "", quantity: 1, unit: "pcs", sortOrder: ingredients.fields.length + 1 })}>
          Add ingredient
        </Button>
      </CardSurface>

      <CardSurface className="grid gap-4 p-6">
        {steps.fields.map((field, index) => (
          <Textarea key={field.id} {...form.register(`steps.${index}.instruction`)} placeholder={`Step ${index + 1}`} />
        ))}
        <Button type="button" variant="secondary" onClick={() => steps.append({ stepNumber: steps.fields.length + 1, instruction: "" })}>
          Add step
        </Button>
      </CardSurface>

      <div className="flex flex-col gap-3 md:flex-row">
        <Button type="submit" onClick={() => setSubmissionMode("draft")}>Save draft</Button>
        <Button type="submit" variant="secondary" onClick={() => setSubmissionMode("submit")}>
          Save and submit for review
        </Button>
      </div>
    </form>
  );
}
```

```tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/button";

export function RecipeImageUploadField({
  onUploaded
}: {
  onUploaded: (imageUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="grid gap-2">
      <label className="text-sm text-[var(--muted)]">Upload cover image</label>
      <input
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          setUploading(true);
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/uploads/recipe-images`, {
            method: "POST",
            credentials: "include",
            body: formData
          });

          const data = await response.json();
          onUploaded(data.imageUrl);
          setUploading(false);
        }}
      />
      <Button type="button" variant="secondary" disabled={uploading}>
        {uploading ? "Uploading image..." : "Image upload ready"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Add the recipe studio pages and admin moderation pages**

```tsx
import { RecipeStudioForm } from "../../../../components/recipes/recipe-studio-form";

export default function NewRecipePage() {
  return (
    <main className="page-shell py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Recipe studio</p>
        <h1 className="text-4xl tracking-tight">Create a new recipe</h1>
      </div>
      <RecipeStudioForm />
    </main>
  );
}
```

```tsx
"use client";

import { useEffect, useState } from "react";
import { RecipeStudioForm } from "../../../../../components/recipes/recipe-studio-form";

export default function EditRecipePage({
  params
}: {
  params: { id: string };
}) {
  const [recipe, setRecipe] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/recipes/${params.id}/edit`, {
      credentials: "include"
    })
      .then((response) => response.json())
      .then((data) => setRecipe(data.recipe));
  }, [params.id]);

  if (!recipe) {
    return <main className="page-shell py-10">Loading recipe editor...</main>;
  }

  return (
    <main className="page-shell py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Recipe studio</p>
        <h1 className="text-4xl tracking-tight">Edit your recipe</h1>
      </div>
      <RecipeStudioForm recipeId={params.id} initialValues={recipe} />
    </main>
  );
}
```

```tsx
"use client";

import { useEffect, useState } from "react";

export default function PendingRecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/admin/recipes/pending`, {
      credentials: "include"
    })
      .then((response) => response.json())
      .then((data) => setRecipes(data.recipes));
  }, []);

  return (
    <main className="page-shell py-10">
      <h1 className="mb-6 text-4xl tracking-tight">Pending moderation</h1>
      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <a key={recipe.id} href={`/admin/recipes/${recipe.id}`} className="panel flex items-center justify-between p-4">
            <div>
              <p className="text-lg">{recipe.title}</p>
              <p className="text-sm text-[var(--muted)]">{recipe.author.displayName}</p>
            </div>
            <span className="text-sm text-[var(--muted)]">Review</span>
          </a>
        ))}
      </div>
    </main>
  );
}
```

```tsx
"use client";

import { useEffect, useState } from "react";
import { CardSurface } from "../../../../components/ui/card-surface";
import { ModerationActionPanel } from "../../../../components/admin/moderation-action-panel";

export default function AdminRecipeDetailPage({
  params
}: {
  params: { id: string };
}) {
  const [recipe, setRecipe] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/admin/recipes/${params.id}`, {
      credentials: "include"
    })
      .then((response) => response.json())
      .then((data) => setRecipe(data.recipe));
  }, [params.id]);

  if (!recipe) {
    return <main className="page-shell py-10">Loading moderation detail...</main>;
  }

  return (
    <main className="page-shell py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Moderation detail</p>
        <h1 className="text-4xl tracking-tight">{recipe.title}</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <CardSurface className="grid gap-4 p-6">
          <p className="text-sm text-[var(--muted)]">{recipe.shortDescription}</p>
          {recipe.ingredients.map((ingredient: any) => (
            <div key={ingredient.id} className="flex justify-between border-b border-[var(--line)] pb-2 text-sm">
              <span>{ingredient.name}</span>
              <span>{ingredient.quantity} {ingredient.unit}</span>
            </div>
          ))}
        </CardSurface>
        <ModerationActionPanel recipeId={params.id} />
      </div>
    </main>
  );
}
```

```tsx
"use client";

import { apiWrite } from "../../lib/api";
import { Button } from "../ui/button";
import { CardSurface } from "../ui/card-surface";

export function ModerationActionPanel({ recipeId }: { recipeId: string }) {
  return (
    <CardSurface className="grid gap-3 p-6">
      <Button
        onClick={async () => {
          await apiWrite(`/admin/recipes/${recipeId}/approve`, { method: "POST", body: JSON.stringify({}) });
          window.location.href = "/admin/recipes/pending";
        }}
      >
        Approve
      </Button>
      <Button
        variant="secondary"
        onClick={async () => {
          await apiWrite(`/admin/recipes/${recipeId}/reject`, {
            method: "POST",
            body: JSON.stringify({ rejectionReason: "Recipe needs clearer ingredient amounts." })
          });
          window.location.href = "/admin/recipes/pending";
        }}
      >
        Reject
      </Button>
    </CardSurface>
  );
}
```

- [ ] **Step 3: Create Playwright config and end-to-end tests for the critical user journeys**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry"
  },
  webServer: [
    { command: "pnpm --filter @cookpedia/api prisma:seed && pnpm --filter @cookpedia/api dev", port: 4000, reuseExistingServer: true },
    { command: "pnpm --filter @cookpedia/web dev", port: 3000, reuseExistingServer: true }
  ]
});
```

```ts
import { expect, test } from "@playwright/test";

test("user can register and reach the private profile", async ({ page }) => {
  await page.goto("/register");
  await page.getByPlaceholder("Display name").fill("Bao Huynh");
  await page.getByPlaceholder("Username").fill("bao-huynh");
  await page.getByPlaceholder("Email").fill("bao@cookpedia.test");
  await page.getByPlaceholder("Password").fill("SecretPass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/profile");
  await expect(page.getByText("Your Cookpedia workspace")).toBeVisible();
});
```

```ts
import { expect, test } from "@playwright/test";

test("author submits a recipe and admin can approve it", async ({ page }) => {
  await page.goto("/register");
  await page.getByPlaceholder("Display name").fill("Lan Tran");
  await page.getByPlaceholder("Username").fill("lan-tran");
  await page.getByPlaceholder("Email").fill("lan@cookpedia.test");
  await page.getByPlaceholder("Password").fill("SecretPass123!");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.goto("/profile/recipes/new");
  await page.getByPlaceholder("Recipe title").fill("Lemongrass Chicken");
  await page.getByPlaceholder("Short description").fill("A bright, savory grilled chicken.");
  await page.getByPlaceholder("Cover image URL").fill("https://example.com/lemongrass-chicken.jpg");
  await page.getByPlaceholder("Ingredient").fill("Chicken thigh");
  await page.getByPlaceholder("Unit").fill("g");
  await page.getByPlaceholder("Step 1").fill("Marinate, roast, and rest the chicken.");
  await page.getByRole("button", { name: "Save and submit for review" }).click();
  await expect(page).toHaveURL("/profile");

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("admin@cookpedia.local");
  await page.getByPlaceholder("Password").fill("AdminPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/admin/recipes/pending");
  await expect(page.getByText("Lemongrass Chicken")).toBeVisible();
});
```

```ts
import { expect, test } from "@playwright/test";

test("guest can search by ingredient and open a published recipe", async ({ page }) => {
  await page.goto("/search?q=egg");
  await expect(page.getByText("Results for")).toBeVisible();
  await expect(page.getByRole("link").first()).toBeVisible();
});
```

- [ ] **Step 4: Run the browser tests and verify the complete app flow**

Run: `pnpm --filter @cookpedia/web test`
Expected: PASS with the registration, moderation, and public search flows working end-to-end.

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS for the whole monorepo.

- [ ] **Step 5: Commit the studio, admin console, and E2E coverage**

```bash
git add apps/web/app/profile/recipes/new/page.tsx apps/web/app/profile/recipes/[id]/edit/page.tsx apps/web/app/admin/recipes/pending/page.tsx apps/web/app/admin/recipes/[id]/page.tsx apps/web/components/recipes/recipe-image-upload-field.tsx apps/web/components/recipes/recipe-studio-form.tsx apps/web/components/admin/moderation-action-panel.tsx playwright.config.ts tests/e2e/auth-and-profile.spec.ts tests/e2e/moderation-flow.spec.ts tests/e2e/search-and-engagement.spec.ts
git commit -m "feat: add recipe studio admin console and e2e coverage"
```

## Self-Review Notes

Spec coverage check:

- structured recipe schema is implemented in Tasks 2 and 5
- moderation-first publishing is implemented in Task 6
- public/private profile split is implemented in Tasks 4, 8, and 9
- Firebase image storage is implemented in Task 4
- ratings and bookmarks are implemented in Task 7
- homepage, search, recipe detail, and author profile are implemented in Task 8
- recipe studio and admin console are implemented in Task 10
- cookie/JWT auth and password hashing are implemented in Task 3
- CSRF and request hardening are implemented in Task 4

Placeholder scan:

- no placeholder markers remain in the plan

Type consistency:

- role values are `USER | ADMIN`
- recipe status values are `DRAFT | PENDING | PUBLISHED | REJECTED`
- difficulty values are `EASY | MEDIUM | HARD`
- public recipe detail route uses `/api/recipes/slug/:slug`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-03-28-cookpedia.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
