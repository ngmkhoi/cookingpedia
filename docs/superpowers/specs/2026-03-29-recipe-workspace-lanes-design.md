# Recipe Workspace Lanes Design

## Overview

Cookpedia currently mixes too many private concerns into `/profile`. The page acts like a recipe workspace, the header repeats links that point back into the same workspace, and private recipe creation still hangs off `/profile/recipes/*` even though public author identity already lives at `/authors/[username]`.

This design splits the private user surface into clearer lanes:

- `/settings/profile` for private profile editing
- `/my-recipes` for recipe management
- `/saved` for bookmark management

The goal is to make each lane do one thing well without introducing a large dashboard or broader account-center overhaul.

## Goals

- Remove the private recipe workspace role from `/profile`
- Make `/my-recipes` the clear home for author-owned recipe management
- Make `/saved` the clear home for bookmark management
- Keep `/settings/profile` as the private profile editor
- Add the minimum backend actions needed to manage private recipes:
  - delete draft/rejected
  - move pending back to draft

## Non-Goals

- No all-in-one private dashboard page
- No full settings center with preferences, notifications, and privacy sections yet
- No published recipe editing workflow
- No rating UI in this slice
- No advanced sorting, filtering, analytics, or pagination in the management pages

## Information Architecture

### Public

- `/authors/[username]` remains the public author profile
- public recipe pages remain under `/recipes/[slug]`

### Private

- `/settings/profile` is the private profile editing route
- `/my-recipes` is the private recipe workspace
- `/saved` is the private bookmark workspace

### Deprecated Private Meanings

`/profile` should no longer be treated as the private recipe workspace. To avoid breaking old links during transition, it may redirect, but it should not continue as the main management page.

## User Workflows

### My Recipes

`/my-recipes` should show the current user's recipes and status-aware actions.

Per-status actions:

- `DRAFT`
  - Edit
  - Delete
  - Submit for review
- `REJECTED`
  - Edit
  - Delete
  - Resubmit
- `PENDING`
  - View
  - Move back to draft
- `PUBLISHED`
  - View

### Saved

`/saved` should show the current user's bookmarked recipes with actions:

- Open recipe
- Unsave

### Settings/Profile

`/settings/profile` remains the profile editor. It should not also try to act like a recipe manager.

## Design Direction

### Navigation

Authenticated account navigation should point to the private lanes directly:

- `My Recipes`
- `Saved`
- `Settings`

There is no need to keep a private `Profile` entry in the account menu if the public author profile remains `/authors/[username]`.

### My Recipes Page

The page should be a focused management list:

- clear page title
- primary `Create recipe` CTA
- recipe rows/cards with:
  - title
  - status
  - short description
  - updated timestamp
  - compact action row

Empty state:

- explain that no recipes exist yet
- include a `Create your first recipe` CTA

### Saved Page

The page should be simpler than `My Recipes`:

- compact saved recipe cards
- author and recipe metadata
- `Open` and `Unsave` actions

Empty state:

- explain nothing has been saved yet
- send the user back to discovery/search

## Routing Strategy

### New Private Routes

- `/my-recipes`
- `/my-recipes/new`
- `/my-recipes/[id]/edit`
- `/saved`

### Transitional Compatibility

Keep the old `/profile/recipes/new` and `/profile/recipes/[id]/edit` entry points as redirects to the new `/my-recipes/*` routes during migration.

## Backend Changes

### Existing Endpoints Reused

- `GET /api/recipes/me`
- `GET /api/recipes/:id/edit`
- `POST /api/recipes`
- `PATCH /api/recipes/:id`
- `POST /api/recipes/:id/submit`
- `GET /api/bookmarks/me`
- `DELETE /api/bookmarks/:recipeId`

### New Endpoints Needed

- `DELETE /api/recipes/:id`
  - allowed for `DRAFT` and `REJECTED`
- `POST /api/recipes/:id/move-to-draft`
  - allowed for `PENDING`
  - changes status back to `DRAFT`
  - clears `submittedAt`

### Pending Policy

This slice does not allow direct editing while a recipe is `PENDING`.

Instead:

- user views the recipe
- user chooses `Move back to draft`
- then edits from draft state

This keeps the moderation state clear and avoids author edits racing against admin review.

## Testing

### Backend

Add API tests for:

- deleting a draft
- deleting a rejected recipe
- preventing deletion of a pending/published recipe
- moving a pending recipe back to draft

### End-To-End

Add E2E coverage for:

- navigating to `/my-recipes`
- creating a recipe from the `Create recipe` CTA
- seeing draft/pending actions
- moving a pending recipe back to draft
- viewing `/saved`
- unsaving a saved recipe

## Acceptance Criteria

- authenticated navigation links directly to `My Recipes`, `Saved`, and `Settings`
- recipe creation entry points no longer depend on `/profile`
- `/my-recipes` supports edit/delete/submit/view/move-back-to-draft according to status
- `/saved` supports viewing and unsaving saved recipes
- `/settings/profile` remains the private profile editor

## Spec Self-Review

### Placeholder Scan

No TODO or TBD placeholders remain.

### Internal Consistency

The design consistently treats `Settings`, `My Recipes`, and `Saved` as separate private lanes while keeping author identity public under `/authors/[username]`.

### Scope Check

This is intentionally narrow. It adds only the routes and actions needed to make private recipe and bookmark management usable right now.

### Ambiguity Check

The pending-policy decision is explicit: no direct editing while pending; users must move back to draft first.
