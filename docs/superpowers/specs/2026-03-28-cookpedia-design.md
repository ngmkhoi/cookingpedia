# Cookpedia Design Spec

## Overview

Cookpedia is a modern recipe-sharing platform inspired by Allrecipes, but designed as a stronger product in both structure and presentation. The core product differentiator is that recipes are stored as structured data rather than a text blob: ingredients are separate rows with quantity and unit, and cooking steps are separate ordered rows.

This project targets a portfolio-grade result:

- cleaner data modeling than a typical assignment submission
- a more distinctive and polished visual system than Allrecipes
- moderation-first publishing to reduce low-quality or deceptive recipe submissions
- production-minded security for authentication and session management

## Product Direction

Cookpedia follows a balanced product strategy:

- discovery and search are first-class on the homepage
- creator identity still matters through public author profiles
- the app should feel like a real platform, not a marketing landing page with a CRUD panel behind it

The homepage is a hybrid landing-and-explore page:

- it introduces the Cookpedia brand
- it exposes search immediately
- it highlights published recipes, ingredient-led discovery, and creator spotlights

## Visual Direction

Cookpedia combines:

- the layout discipline of the "Culinary System" direction
- the earthy palette and tactile materiality of the "Market Atlas" direction

Visual principles:

- structure is product-grade, clean, and modular
- palette uses warm neutral surfaces, stone-like grays, and deep olive/green accents
- the interface should feel like a curated culinary archive rather than a generic feed
- desktop layouts can be asymmetric, but mobile collapses aggressively into clean single-column flows

Design constraints:

- no generic three-column feature rows
- no AI-purple gradients or neon glows
- no emoji usage in product copy or UI
- no centered hero by default on desktop
- cards are used only when elevation communicates hierarchy; otherwise spacing and borders should do the work

## Tech Stack

### Backend

- Express.js
- Prisma ORM
- PostgreSQL
- JWT-based authentication
- httpOnly cookies for session transport
- Firebase Storage for image storage only

### Frontend

- Next.js App Router
- Tailwind CSS
- Redux Toolkit for selective global state
- shadcn/ui as the base component system, customized heavily to match Cookpedia's design language
- UI localization for `vi` and `en`

### Storage

- PostgreSQL is the primary application database
- Firebase Storage stores uploaded images and returns URLs that are saved in PostgreSQL

Firebase is not used as the main database and is not used as the authentication provider.

## Core Features

### UI Localization

Cookpedia supports interface localization in phase 1:

- UI text is available in `vi` and `en`
- authentication pages, navigation, filters, buttons, empty states, admin screens, and profile screens should all use localized UI copy
- user-generated recipe content is not auto-translated in phase 1
- each recipe stores its original `locale`
- the active UI locale and the recipe content locale are separate concerns

This keeps the portfolio strong without expanding scope into translated recipe content management.

### 1. Recipe Creation and Management

Authenticated users can create recipes with:

- title
- short description
- prep time in minutes
- cook time in minutes
- servings
- cover image
- image gallery
- category
- cuisine
- difficulty
- locale
- structured ingredient list
- structured ordered step list

Recipes support multiple images:

- one `coverImageUrl` is used for cards and primary previews
- additional gallery images are stored separately and shown on the recipe detail page

Recipes are created as drafts first, then submitted for moderation.

### 2. Recipe Discovery

The explore experience shows published recipes only.

Sorting:

- newest
- most saved

Displayed card data:

- recipe title
- cover image
- author name
- cooking/prep summary
- average rating

### 3. Rating and Review

Users can rate and review recipes from other authors.

Rules:

- rating score is 1 to 5
- one rating per `(userId, recipeId)`
- a user can update their own previous rating/review
- recipe authors cannot rate their own recipes
- only published recipes can be rated

### 4. Bookmarking

Users can save recipes to a personal saved list.

Rules:

- bookmarks are only meaningful for published recipes
- saved recipes are shown in the user's private profile area
- public users do not see another user's saved list

### 5. Search

Search supports:

- recipe title match
- ingredient name match

Additional filtering:

- cook time
- rating
- sorting by newest
- sorting by most saved

The ingredient search must use SQL joins rather than JSON searching.

### 6. Profiles

Cookpedia separates creator identity from account management.

Public profile:

- route: `/authors/[username]`
- visible to anyone
- shows avatar, display name, bio, and published recipes only

Private profile:

- route: `/profile`
- visible only to the signed-in user
- shows `My Recipes` and `Saved`
- shows moderation status for the user's own recipes

Profile settings:

- route: `/settings/profile`
- lets the user edit display name, username, avatar, and bio

### 7. Admin Moderation

Publishing is moderation-first.

Recipe visibility flow:

- author creates `DRAFT`
- author submits recipe for review -> `PENDING`
- admin approves -> `PUBLISHED`
- admin rejects -> `REJECTED`

Only `PUBLISHED` recipes appear in:

- homepage
- search results
- recipe public detail pages
- public author profiles

Authors can revise rejected recipes and submit again.

## Data Model

### User

Primary fields:

- `id`
- `email`
- `passwordHash`
- `displayName`
- `username`
- `avatarUrl`
- `bio`
- `locale`
- `role`
- `createdAt`
- `updatedAt`

Constraints:

- `email` unique
- `username` unique
- `role` enum: `USER | ADMIN`

### Recipe

Primary fields:

- `id`
- `authorId`
- `title`
- `slug`
- `shortDescription`
- `prepMinutes`
- `cookMinutes`
- `servings`
- `coverImageUrl`
- `category`
- `cuisine`
- `difficulty`
- `locale`
- `status`
- `submittedAt`
- `reviewedAt`
- `reviewedById`
- `rejectionReason`
- `ratingAverage`
- `ratingCount`
- `bookmarkCount`
- `createdAt`
- `updatedAt`

Constraints:

- `slug` unique
- `status` enum: `DRAFT | PENDING | PUBLISHED | REJECTED`

Notes:

- `ratingAverage`, `ratingCount`, and `bookmarkCount` are denormalized counters for faster public queries
- `coverImageUrl` is required before a recipe can be submitted for moderation

### RecipeImage

Primary fields:

- `id`
- `recipeId`
- `imageUrl`
- `caption`
- `sortOrder`

### Ingredient

Primary fields:

- `id`
- `recipeId`
- `name`
- `quantity`
- `unit`
- `sortOrder`

Notes:

- ingredients remain separate rows
- this table is required for SQL join-based ingredient search

### Step

Primary fields:

- `id`
- `recipeId`
- `stepNumber`
- `instruction`

Notes:

- steps are stored separately and ordered explicitly
- this table must not be replaced with a JSON blob

### Rating

Primary fields:

- `id`
- `userId`
- `recipeId`
- `score`
- `comment`
- `createdAt`
- `updatedAt`

Constraints:

- unique `(userId, recipeId)`

### Bookmark

Primary fields:

- `id`
- `userId`
- `recipeId`
- `createdAt`

Constraints:

- unique `(userId, recipeId)`

### Session

Primary fields:

- `id`
- `userId`
- `refreshTokenHash`
- `expiresAt`
- `revokedAt`
- `createdAt`
- `updatedAt`

Purpose:

- server-side refresh session tracking
- secure logout and token rotation
- ability to revoke compromised refresh sessions

## Backend Architecture

The backend should be split into focused Express modules:

- `auth`
- `users`
- `recipes`
- `uploads`
- `ratings`
- `bookmarks`
- `admin-recipes`

## Backend Conventions

The backend must keep one coding style across all modules so the codebase remains maintainable as features expand.

Every feature module should follow the same layering:

- request validation at the boundary
- thin route/controller handling
- business logic in services
- persistence and transactions in service-level Prisma calls

Most modules should use this file shape:

- `module.schemas.ts` for Zod input/output contracts
- `module.service.ts` for business logic and Prisma queries
- `module.controller.ts` for request-to-service orchestration
- `module.routes.ts` for route declaration and middleware wiring

Notes:

- for very small modules, the controller layer may stay extremely thin but should still avoid embedding business rules in routes
- multipart upload flows can use middleware-level validation where a pure Zod schema is not the main validation mechanism

Conventions:

- route handlers stay thin and should not contain business logic
- Prisma access belongs in services, not in route files
- validation happens at the request boundary before controller logic
- write operations that touch multiple tables should use transactions
- response shapes should be consistent across modules
- API errors should go through a centralized error format instead of ad hoc `res.status(...).json(...)` branches scattered everywhere
- enums, status values, cookie names, and auth constants should live in shared modules rather than repeated literals
- repeated limits, labels, sort keys, locale options, and default values should come from shared constants/config modules rather than scattered string and number literals

## Shared Constants

Cookpedia should centralize reusable constants instead of hardcoding them across controllers, services, and pages.

Backend constant groups:

- auth constants: cookie names, token names, session-related keys
- recipe constants: status values, difficulty values, sort keys, public list defaults
- upload constants: file size limit, allowed MIME types, Firebase folder names
- localization constants: supported locales and default locale

Frontend constant groups:

- site constants: brand name, metadata, main navigation
- recipe constants: status labels, sort options, filter options, difficulty labels
- localization constants: supported locales, locale labels, language switcher items
- UI constants: shared copy for loading, empty, and error states where appropriate

### Auth Module

Responsibilities:

- register
- login
- logout
- current user session lookup
- refresh token rotation

### Users Module

Responsibilities:

- get public author profile
- update current user profile
- validate username uniqueness

### Recipes Module

Responsibilities:

- create draft
- update draft or rejected recipe by owner
- submit recipe for review
- get published recipe detail
- list published recipes for explore
- search published recipes by title or ingredient
- list current user's own recipes with statuses

### Uploads Module

Responsibilities:

- accept authenticated image uploads
- validate file type and size
- upload to Firebase Storage
- return public URLs or storage-backed URLs for frontend use

### Ratings Module

Responsibilities:

- create or update rating
- enforce unique rating per user-recipe pair
- enforce no self-rating
- refresh recipe aggregates

### Bookmarks Module

Responsibilities:

- save recipe
- unsave recipe
- list current user's saved recipes
- refresh recipe bookmark aggregates

### Admin Recipes Module

Responsibilities:

- list pending recipes
- inspect recipe details before moderation
- approve recipe
- reject recipe with reason

## Frontend Architecture

The frontend should use Next.js App Router with a mix of server-rendered pages and isolated client components.

Redux Toolkit should be reserved for cross-page state such as:

- current auth state
- optimistic bookmark actions
- possibly search UI state if it needs to persist across page transitions

The frontend should avoid pushing all data fetching into Redux.

## Frontend Component System

The frontend should not let each page invent its own buttons, fields, panels, and status visuals. Cookpedia needs a reusable UI layer so the interface stays consistent and easy to evolve.

The component stack should be split into two layers:

- `components/ui/*` for primitive building blocks
- `components/<domain>/*` for recipe/profile/admin-specific composites

For Cookpedia, `components/ui/*` should be generated from shadcn/ui where possible, then customized to fit the earthy, editorial-leaning product language. The project should not ship the raw default shadcn look.

Expected UI primitives:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `FormField`
- `CardSurface`
- `SectionHeading`
- `StatusBadge`
- `Tabs`
- `EmptyState`
- `SkeletonBlock`

Core domain composites:

- `RecipeCard`
- `AuthForm`
- `ProfileTabs`
- `RecipeStudioForm`
- `ModerationActionPanel`

As the detail and studio pages grow, split larger sections into focused subcomponents such as:

- `RecipeMeta`
- `IngredientList`
- `StepList`
- `RecipeGallery`

Conventions:

- use shadcn/ui as the base source for primitives such as button, input, textarea, badge, tabs, dialog, sheet, select, avatar, and skeleton
- customize shadcn tokens, radii, colors, shadows, spacing, and variants so the output aligns with `design-taste-frontend`
- pages compose primitives and composites rather than styling raw buttons and fields repeatedly
- semantic HTML still matters, but appearance and interaction styling should be centralized in reusable components
- status colors and copy for `DRAFT`, `PENDING`, `PUBLISHED`, and `REJECTED` should come from a shared badge system
- form labels, helper text, and error text should come from shared form-field patterns so studio/profile/auth screens stay visually aligned
- locale labels, navigation labels, section copy, and CTA text should come from shared translation dictionaries or locale modules rather than page-level hardcoded strings

## Frontend Routes

### Public

- `/`
- `/search`
- `/recipes/[slug]`
- `/authors/[username]`
- `/login`
- `/register`

### Authenticated User

- `/profile`
- `/profile/recipes/new`
- `/profile/recipes/[id]/edit`
- `/settings/profile`

### Admin

- `/admin/recipes/pending`
- `/admin/recipes/[id]`

## Key Screens

### Homepage

Sections:

- brand hero with large search input
- featured published recipes
- ingredient-led discovery
- creator spotlight
- possibly trending or most-saved recipe strip

### Search Results

Features:

- search by recipe title or ingredient
- filter by cook time and rating
- sort by newest or most saved
- results shown as highly visual recipe cards

### Recipe Detail

Features:

- multi-image gallery
- metadata block
- structured ingredients
- structured steps
- average rating and review list
- bookmark action

### Recipe Studio

Features:

- draft editor
- image upload and gallery management
- structured ingredient field array
- structured step field array
- status panel showing draft/pending/rejected/published

### Private Profile

Features:

- `My Recipes`
- `Saved`
- quick access to edit profile
- moderation badges visible for own recipes

### Public Author Profile

Features:

- avatar
- display name
- bio
- published recipe list only

### Admin Moderation

Features:

- pending recipe queue
- review detail page
- approve
- reject with rejection reason

## Authentication and Security

Security is a hard requirement.

### Password Handling

- passwords must be hashed with Argon2id before storage
- plain text passwords must never be logged or stored

### Session Strategy

Use JWT plus cookies:

- access token: short-lived
- refresh token: longer-lived
- both transported in cookies

Cookie rules:

- `httpOnly`
- `sameSite=lax`
- `secure` in production

Do not store auth tokens in:

- `localStorage`
- `sessionStorage`

### Refresh Session Storage

Refresh sessions are stored in PostgreSQL through the `Session` table.

Rules:

- only hashed refresh tokens are stored
- refresh rotation invalidates old sessions
- logout revokes the active refresh session

### API Protection

Required protections:

- authentication middleware for protected endpoints
- role guard for admin endpoints
- ownership checks for user-owned recipes and profile actions
- request validation for body, params, and query strings
- CSRF protection for cookie-authenticated write endpoints via origin checking and a CSRF token strategy if frontend and backend are deployed on different origins
- restricted CORS configuration
- rate limiting on auth-sensitive endpoints

### Upload Security

Image upload rules:

- authenticated users only
- whitelist image MIME types
- enforce file size limits
- reject unexpected content types
- store files in Firebase Storage only after validation

### Rendering Safety

- user-generated review/comment text must be rendered safely
- no unsafe HTML rendering from user input

## Query and Search Notes

Ingredient search requires joins across recipe and ingredient tables.

High-level query intent:

- match recipe title by partial text
- or match ingredient name by partial text
- return unique recipes only
- limit results to `PUBLISHED`

Public recipe list queries should be optimized around:

- status
- created date
- bookmark count
- average rating

## Business Rules

- authors cannot rate their own recipes
- recipe creation starts as draft
- only admins can publish or reject recipes
- rejected recipes can be edited and resubmitted
- only published recipes are public
- saved recipes are private to the user
- public profiles show published recipes only
- guests must not be able to read pending or rejected recipe detail pages
- username and slug must be unique

## Edge Cases

- prevent duplicate results when multiple ingredient rows match the same recipe
- prevent submission without cover image
- preserve explicit order for images, ingredients, and steps
- ensure deleting a recipe cascades or safely cleans related images, ingredients, steps, ratings, and bookmarks
- ensure pending/rejected recipes never leak into public feeds or profile pages
- ensure username collisions and slug collisions are handled deterministically

## Testing Scope

### Backend

- auth register/login/logout/refresh flows
- password hashing behavior
- refresh session revocation
- recipe status transitions
- ingredient-based search
- unique rating enforcement
- self-rating rejection
- admin-only moderation endpoints

### Frontend

- recipe studio field arrays for ingredients and steps
- profile tabs
- moderation badge rendering
- loading states
- empty states
- error states

### Integration

- create draft -> upload image -> submit -> admin approve -> recipe becomes public
- published recipe -> another user bookmarks -> another user rates
- rejected recipe -> owner edits -> resubmits successfully

## Implementation Priorities

Recommended build order:

1. initialize backend and frontend workspaces
2. implement Prisma schema and database migrations
3. implement auth, cookies, JWT, and session storage
4. implement recipe draft CRUD with structured ingredients, steps, and images
5. implement moderation flow
6. implement public homepage, detail page, and search
7. implement bookmarks and ratings
8. implement private profile, public author profile, and profile settings
9. polish UX states and motion

## Non-Goals for Phase 1

- social login
- following creators
- moderation audit history table
- advanced image editing/cropping
- multi-role editorial workflows beyond admin approval
- chat or notifications

## Spec Outcome

This spec defines a portfolio-focused Cookpedia that:

- satisfies the assignment's structured recipe requirements
- uses proper relational design for ingredients and steps
- supports SQL-based ingredient search
- introduces moderation and security strong enough to feel production-minded
- leaves room for future expansion without complicating phase 1 unnecessarily
