# Firebase Storage Upload Design

## Overview

Cookpedia already has an authenticated upload endpoint at `POST /api/uploads/recipe-images` and a recipe form that expects that endpoint to return an `imageUrl`. The missing piece is not a new upload architecture, but making the existing backend-driven Firebase Storage path reliable enough for real credentials and real buckets.

This design keeps the current flow:

- browser selects an image
- web app posts `multipart/form-data` to the API
- API validates auth and file shape
- API uploads the file to Firebase Storage through `firebase-admin`
- API returns a public image URL
- the recipe form stores that URL in `coverImageUrl` and `images[]`

The design also adopts a strict configuration posture:

- no default JWT secrets
- no default Firebase configuration
- no silent fallback for required runtime configuration
- missing required env must fail application startup immediately

## Goals

- Make Firebase Storage uploads work with the real credentials already placed in `.env`
- Preserve the existing backend upload flow so the frontend changes stay small
- Fail fast when JWT or Firebase configuration is missing or malformed
- Return stable API errors for upload failures instead of leaking raw provider errors
- Keep secrets server-side only
- Keep the existing database schema and recipe form contract intact

## Non-Goals

- No move to client-side Firebase SDK uploads
- No Firebase Auth migration
- No Firebase Analytics integration in this change
- No signed upload URL flow
- No schema changes in PostgreSQL or Prisma

## Current State

The repo already contains the core integration points:

- `apps/api/src/lib/firebase.ts` initializes `firebase-admin` storage and exposes a bucket-like object
- `apps/api/src/modules/uploads/uploads.service.ts` saves the uploaded buffer to the bucket
- `apps/api/src/modules/uploads/uploads.controller.ts` validates MIME type and returns `{ imageUrl }`
- `apps/web/components/recipes/recipe-image-upload-field.tsx` posts the file to the upload endpoint

The main gaps are:

- runtime env is not explicitly loaded by the API process
- several env values still have development defaults
- upload failures are not normalized into stable API errors
- the frontend assumes every upload succeeds

## Architecture

### Upload Path

The system will continue to use the existing backend-mediated upload path.

Why this is the right choice here:

- it matches the code already in the repo
- it avoids exposing storage credentials or changing Firebase rules design
- it keeps auth and upload policy enforcement in one place
- it requires fewer changes to tests and UI behavior

### Firebase Boundary

`apps/api/src/lib/firebase.ts` is the only module allowed to know how Firebase is initialized.

Responsibilities:

- read validated Firebase env values
- initialize `firebase-admin` once
- expose a storage bucket handle
- surface a clear initialization error if config is missing or invalid

Everything outside this module should treat Firebase as an implementation detail.

### Env Boundary

`apps/api/src/config/env.ts` becomes the strict runtime gate for the API.

Rules:

- required runtime secrets and provider config must be required in schema validation
- there are no default values for secrets or provider config
- startup must fail before the server listens if any required value is absent

This applies especially to:

- `DATABASE_URL`
- `API_PORT`
- `WEB_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`

`COOKIE_DOMAIN` may remain optional because an empty string can be a valid local-development choice.

## Detailed Design

### 1. API Environment Loading

The API must load env from its local `.env` file reliably before validation runs.

Design:

- load env at API startup, before the schema is parsed
- keep the env parsing centralized in `apps/api/src/config/env.ts`
- update package/runtime setup so local development and tests both resolve the same required env consistently

Expected behavior:

- if `.env` is missing a required key, the API exits during startup
- if `.env` has malformed values, the API exits during startup
- the failure happens before route registration starts serving traffic

### 2. Firebase Initialization

Firebase initialization should become strict and explicit.

Design:

- remove the fallback bucket object used when config is absent
- build the bucket only from validated env
- keep newline normalization for `FIREBASE_PRIVATE_KEY`
- treat missing or invalid Firebase config as a startup problem, not as a lazy runtime surprise

This avoids the current behavior where the app can boot with an upload path that is guaranteed to fail later.

### 3. Upload Service Behavior

The upload service will keep writing into the same bucket, but it will normalize failures.

Design:

- continue naming objects under `recipe-images/...`
- keep MIME type from the uploaded file
- save the file using the Firebase bucket handle
- convert Firebase/storage exceptions into a stable application error code

Expected API-level error semantics:

- invalid file type remains `400 INVALID_IMAGE`
- Firebase provider unavailable or misconfigured becomes a stable `500` class error
- storage write failures also become a stable `500` class error

The API response should remain machine-friendly so the frontend can show a short user-facing message.

### 4. Frontend Upload UX

The recipe form should stop assuming a successful upload.

Design:

- check `response.ok` before using the response body
- parse error payloads safely
- keep current field state unchanged on failure
- show a short visible error message in the upload field
- disable the upload action while the file is being sent

Success behavior stays the same:

- set `coverImageUrl`
- set `images` to the returned uploaded image

Failure behavior changes:

- do not write a broken URL into the form
- do not silently swallow provider errors

### 5. Env Template

`.env.example` should document the required backend Firebase variables and stop implying defaults will be used.

It should clearly indicate:

- these values are required
- `FIREBASE_CLIENT_EMAIL` comes from the service account JSON
- `FIREBASE_PRIVATE_KEY` must be pasted as the private key value from that JSON
- JWT values are real required secrets, not development placeholders at runtime

The template remains a template only. No real secrets go into git.

## Data Flow

### Happy Path

1. User selects an image in the recipe form
2. Web app sends `POST /api/uploads/recipe-images` with credentials and form data
3. API validates authenticated session
4. API validates file presence, MIME type, and upload size
5. Upload service writes the file to Firebase Storage
6. API returns `{ imageUrl }`
7. Web app updates `coverImageUrl` and `images[]`

### Failure Path

1. User selects an image
2. Web app posts to upload endpoint
3. API reaches Firebase upload path
4. Firebase initialization or save fails
5. API returns stable error payload
6. Web app shows a short error message
7. Form state remains unchanged

## Error Handling

### Startup Errors

These should abort startup:

- missing JWT secrets
- missing Firebase project or bucket config
- missing database URL
- malformed required env values

This is intentional. The service should not run in a partially configured state.

### Request Errors

These should be returned as request-time API errors:

- unsupported upload MIME type
- file too large
- Firebase write failure after startup

The request path should never expose raw stack traces or provider internals to the browser.

## Testing Strategy

### Red-Green Scope

Tests should be added or updated before implementation changes:

- API test for successful upload path using a mocked bucket save
- API test for storage failure returning a stable error response
- existing invalid-file test remains in place

The web layer does not need a real Firebase integration test here. It needs only enough coverage to ensure the upload component handles success and failure responses correctly.

### Verification

Required verification after implementation:

- `pnpm typecheck`
- `pnpm test`
- manual smoke test: create or edit a recipe, upload a real image, verify a real Firebase Storage URL is returned and persisted in the form

## Files Expected To Change

- `apps/api/package.json`
- `apps/api/src/config/env.ts`
- `apps/api/src/lib/firebase.ts`
- `apps/api/src/modules/uploads/uploads.service.ts`
- `apps/api/tests/profile-and-upload.test.ts`
- `apps/web/components/recipes/recipe-image-upload-field.tsx`
- `.env.example`

Additional small edits are acceptable if needed to support the above, but the change should stay tightly scoped to upload reliability and strict env handling.

## Risks

### Risk: Local development becomes stricter

Removing defaults means anyone running the API without a valid `.env` will fail immediately.

This is acceptable and intended. The project owner explicitly wants fail-fast behavior over permissive local fallbacks.

### Risk: Firebase bucket URL format differences

Different Firebase projects can surface bucket names in slightly different forms.

Mitigation:

- keep `FIREBASE_STORAGE_BUCKET` explicit in env
- treat the env value as the source of truth

### Risk: Existing tests may rely on implicit defaults

Tests that assume secrets or provider values exist implicitly may fail once env becomes strict.

Mitigation:

- ensure test execution path loads env consistently
- keep test setup explicit instead of relying on fallback values

## Acceptance Criteria

- API startup fails immediately if required env values are missing
- Firebase Storage uploads succeed with the real `.env` values already configured locally
- upload endpoint returns a usable `imageUrl`
- upload endpoint returns a stable error when Firebase upload fails
- recipe form only updates image fields on successful upload
- typecheck and test suite both pass
