# Firebase Storage Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Firebase Storage uploads work through the existing backend upload endpoint with strict fail-fast env validation and visible frontend error handling.

**Architecture:** Keep the current `browser -> API -> Firebase Storage` flow. Tighten API env loading and validation so required secrets and Firebase settings must exist at startup, then normalize upload failures into stable API errors and surface them in the recipe form.

**Tech Stack:** Express, firebase-admin, Zod, Multer, Vitest, Next.js, React Hook Form

---

### Task 1: Lock in API upload tests first

**Files:**
- Modify: `apps/api/tests/profile-and-upload.test.ts`
- Reference: `apps/api/src/modules/uploads/uploads.service.ts`

- [ ] **Step 1: Write failing tests for successful and failed Firebase uploads**

Add cases that mock the upload service behavior so the endpoint contract is explicit:

```ts
it("uploads a valid image and returns imageUrl", async () => {
  // authenticate
  // mock uploadsService.saveRecipeImage to resolve a URL
  // post a PNG buffer
  // expect 201 and imageUrl
});

it("returns a stable error when storage upload fails", async () => {
  // authenticate
  // mock uploadsService.saveRecipeImage to reject
  // post a PNG buffer
  // expect 500 and an error code
});
```

- [ ] **Step 2: Run the targeted API test to verify the new case fails**

Run: `pnpm --filter @cookpedia/api test -- --run profile-and-upload.test.ts`
Expected: FAIL because the current controller/service path does not yet return the stable failure contract.

- [ ] **Step 3: Leave the existing invalid-file test intact**

Keep the current non-image rejection test as the low-level validation guard.

- [ ] **Step 4: Re-run the targeted API test after implementation**

Run: `pnpm --filter @cookpedia/api test -- --run profile-and-upload.test.ts`
Expected: PASS

### Task 2: Make API env loading strict and explicit

**Files:**
- Modify: `apps/api/src/config/env.ts`
- Modify: `apps/api/package.json`
- Modify: `.env.example`

- [ ] **Step 1: Remove runtime defaults for required API env**

Make these required in the env schema instead of using fallback values:

```ts
DATABASE_URL
API_PORT
WEB_ORIGIN
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_TTL
JWT_REFRESH_TTL
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_STORAGE_BUCKET
```

- [ ] **Step 2: Load the API `.env` before schema parsing**

Ensure the API process reads local env before `zod` validation runs so startup behavior is deterministic in dev and test.

- [ ] **Step 3: Update `.env.example` to match fail-fast behavior**

Document that these values are required and remove any implication that defaults will save startup.

- [ ] **Step 4: Verify env parsing still works in test execution**

Run: `pnpm --filter @cookpedia/api test -- --run health.test.ts`
Expected: PASS with env loading happening before app bootstrap.

### Task 3: Tighten Firebase initialization and upload failure handling

**Files:**
- Modify: `apps/api/src/lib/firebase.ts`
- Modify: `apps/api/src/modules/uploads/uploads.service.ts`
- Possibly modify: `apps/api/src/modules/uploads/uploads.controller.ts`

- [ ] **Step 1: Remove the fallback bucket path**

The Firebase module should no longer export a fake bucket when config is missing. It should initialize from validated env or fail clearly.

- [ ] **Step 2: Normalize upload failures into an application error**

Wrap provider errors from `bucket.file(...).save(...)` and convert them into a stable API-visible application error code.

- [ ] **Step 3: Keep success behavior unchanged**

On success, still return a public URL string for the uploaded object and preserve the existing endpoint shape:

```json
{ "imageUrl": "https://storage.googleapis.com/..." }
```

- [ ] **Step 4: Run the targeted upload test again**

Run: `pnpm --filter @cookpedia/api test -- --run profile-and-upload.test.ts`
Expected: PASS

### Task 4: Surface upload failures in the recipe form

**Files:**
- Modify: `apps/web/components/recipes/recipe-image-upload-field.tsx`

- [ ] **Step 1: Add a failing expectation mentally from current behavior**

Current behavior always calls `onUploaded(data.imageUrl)` without checking `response.ok`. The implementation must change so failed uploads do not mutate form state.

- [ ] **Step 2: Implement minimal UI state for upload errors**

Add:

```ts
const [uploadError, setUploadError] = useState("");
```

Then:

- clear previous errors at the start of upload
- only call `onUploaded` on success
- show a short visible error message on failure

- [ ] **Step 3: Preserve existing success flow**

Keep the button disabled while uploading and continue updating the recipe form when upload succeeds.

- [ ] **Step 4: Verify with full workspace tests**

Run: `pnpm test`
Expected: PASS

### Task 5: Final verification

**Files:**
- No new code

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Manual smoke test**

Start the app, sign in, upload a real image in the recipe form, confirm the returned URL is a real Firebase Storage URL and the form stores it.

- [ ] **Step 4: Commit the implementation**

```bash
git add apps/api/src/config/env.ts apps/api/src/lib/firebase.ts apps/api/src/modules/uploads/uploads.service.ts apps/api/tests/profile-and-upload.test.ts apps/web/components/recipes/recipe-image-upload-field.tsx .env.example apps/api/package.json
git commit -m "feat: harden firebase upload flow"
```
