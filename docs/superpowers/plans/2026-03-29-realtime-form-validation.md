# Realtime Form Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add realtime inline validation for login, register, and recipe studio, including debounced availability checks for unique registration fields and structured frontend error mapping.

**Architecture:** Keep backend validation authoritative while moving immediate UX feedback into the web forms. Add one auth availability endpoint plus field-aware conflict responses for register, then teach the web API layer and form components to parse structured errors and render inline validation states.

**Tech Stack:** Express, Prisma, Zod, Next.js App Router, React Hook Form, Playwright, Vitest

---

### Task 1: Lock backend auth validation contracts with failing tests

**Files:**
- Modify: `apps/api/tests/auth.test.ts`

- [ ] **Step 1: Add failing availability and field-conflict tests**

Add tests that expect:

- `GET /api/auth/availability` to report `available`, `taken`, and `unchecked`
- duplicate register submit to return `FIELD_CONFLICT` with `fieldErrors`
- login to keep returning `INVALID_CREDENTIALS`

- [ ] **Step 2: Run auth tests to verify the new expectations fail**

Run: `pnpm --filter @cookpedia/api test -- auth.test.ts`

Expected: FAIL because `/api/auth/availability` does not exist and duplicate register still returns `USER_ALREADY_EXISTS`.

### Task 2: Implement backend auth availability and conflict mapping

**Files:**
- Modify: `apps/api/src/modules/auth/auth.schemas.ts`
- Modify: `apps/api/src/modules/auth/auth.routes.ts`
- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`

- [ ] **Step 1: Add availability query schema**

Support optional `email` and `username` query params.

- [ ] **Step 2: Add controller/service methods for availability**

Return per-field statuses:

- `available`
- `taken`
- `invalid`
- `unchecked`

- [ ] **Step 3: Translate register uniqueness races into field-aware errors**

Keep backend generic for login. Only register duplicate conflicts become:

```json
{
  "message": "FIELD_CONFLICT",
  "fieldErrors": {
    "email": "This email is already in use"
  }
}
```

- [ ] **Step 4: Add auth availability route**

Expose `GET /api/auth/availability` using the new query schema.

- [ ] **Step 5: Re-run auth tests**

Run: `pnpm --filter @cookpedia/api test -- auth.test.ts`

Expected: PASS for the new auth API contract coverage.

### Task 3: Add typed frontend API error parsing

**Files:**
- Modify: `apps/web/lib/api.ts`

- [ ] **Step 1: Add a failing web-side consumer expectation**

Use the form work in later tasks as the consumer. The web API layer must stop throwing opaque `API_WRITE_FAILED:*` strings for JSON responses.

- [ ] **Step 2: Introduce structured `ApiError` parsing**

Teach `apiGet` and `apiWrite` to:

- read response JSON when present
- throw structured objects with `status`, `message`, `fieldErrors`, and `issues`
- preserve generic fallback when the response is not JSON

- [ ] **Step 3: Keep high-risk callers behaviorally stable**

Do not broaden semantics beyond structured error parsing. `apiWrite` has a `HIGH` blast radius, so preserve success-path behavior exactly.

- [ ] **Step 4: Run web typecheck**

Run: `pnpm --filter @cookpedia/web typecheck`

Expected: PASS

### Task 4: Add reusable debounced validation helpers

**Files:**
- Create: `apps/web/hooks/use-debounced-value.ts`
- Create: `apps/web/hooks/use-field-availability.ts`
- Create: `apps/web/components/forms/form-field-shell.tsx`

- [ ] **Step 1: Add debounced value hook**

Return a debounced copy of an input value so forms can validate while typing without firing on every keystroke.

- [ ] **Step 2: Add availability hook for register**

Accept field name and value, skip invalid values, cancel stale requests, and expose:

- `status`
- `message`
- `isChecking`

- [ ] **Step 3: Add a shared field shell**

Render:

- label
- helper/status text
- error text
- invalid styling hooks

The shell should work with existing `Input` and `Textarea` components and follow the existing Cookpedia design language.

- [ ] **Step 4: Run web typecheck**

Run: `pnpm --filter @cookpedia/web typecheck`

Expected: PASS

### Task 5: Implement inline validation in auth form

**Files:**
- Modify: `apps/web/components/auth/auth-form.tsx`

- [ ] **Step 1: Add local field rules**

Use React Hook Form rules for:

- `displayName`
- `username`
- `email`
- `password`

Set validation to run on blur and then re-check on change.

- [ ] **Step 2: Add debounced availability for register**

Only for:

- `email`
- `username`

Skip requests while the field is locally invalid.

- [ ] **Step 3: Map backend field errors into RHF**

Use `setError` for:

- `VALIDATION_FAILED`
- `FIELD_CONFLICT`

Keep `INVALID_CREDENTIALS` form-level and generic.

- [ ] **Step 4: Render inline field states**

Show:

- helper text
- checking state
- taken state
- inline validation errors

- [ ] **Step 5: Run web typecheck**

Run: `pnpm --filter @cookpedia/web typecheck`

Expected: PASS

### Task 6: Implement inline validation in recipe studio

**Files:**
- Modify: `apps/web/components/recipes/recipe-studio-form.tsx`

- [ ] **Step 1: Add local field rules for top-level fields**

Cover:

- title
- shortDescription
- prepMinutes
- cookMinutes
- servings
- category
- cuisine
- coverImageUrl

- [ ] **Step 2: Add inline validation for array rows**

Render per-row errors for:

- `ingredients.*.name`
- `ingredients.*.quantity`
- `ingredients.*.unit`
- `steps.*.instruction`

- [ ] **Step 3: Map backend `VALIDATION_FAILED` issues to RHF paths**

Convert backend field paths into the correct form field names so users can see which ingredient or step row failed.

- [ ] **Step 4: Disable submit while invalid or submitting**

Keep both submit buttons aligned with realtime validation state.

- [ ] **Step 5: Run web typecheck**

Run: `pnpm --filter @cookpedia/web typecheck`

Expected: PASS

### Task 7: Add end-to-end coverage for realtime UX

**Files:**
- Modify: `tests/e2e/auth-and-profile.spec.ts`

- [ ] **Step 1: Add failing auth validation scenario**

Cover:

- inline register field errors on blur
- debounced taken/available states for username or email
- generic login failure message

- [ ] **Step 2: Add failing recipe validation scenario**

Cover:

- inline recipe errors before submit
- no opaque failure-only flow

- [ ] **Step 3: Run the E2E spec and verify failures first**

Run: `pnpm --filter @cookpedia/web test -- --grep "validation|register|recipe"`

Expected: FAIL before implementation is complete.

- [ ] **Step 4: Re-run after implementation**

Run: `pnpm --filter @cookpedia/web test -- auth-and-profile.spec.ts`

Expected: PASS

### Task 8: Final verification

**Files:**
- Verify only

- [ ] **Step 1: Run backend auth verification**

Run: `pnpm --filter @cookpedia/api test -- auth.test.ts`

Expected: PASS

- [ ] **Step 2: Run frontend typecheck**

Run: `pnpm --filter @cookpedia/web typecheck`

Expected: PASS

- [ ] **Step 3: Run focused E2E coverage**

Run: `pnpm --filter @cookpedia/web test -- auth-and-profile.spec.ts`

Expected: PASS

- [ ] **Step 4: Review VCS scope**

Run: `git diff --stat`

Expected: only the intended auth validation, recipe validation, helper, and test files are changed for this slice.
