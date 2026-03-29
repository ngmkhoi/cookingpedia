# Realtime Form Validation Design

## Overview

Cookpedia currently validates form input too late and surfaces failures too vaguely. The backend already returns structured validation errors for schema failures, but the frontend collapses them into generic messages such as `API_WRITE_FAILED:*`. That leaves users guessing which field is wrong, whether a field is missing, or whether they can fix the problem without retrying the entire form.

This design introduces realtime, inline field validation across authentication and recipe authoring flows. It combines local validation for immediate feedback with debounced server validation for fields that must be unique in the database. The result should feel fast, specific, and safe without weakening login security.

## Goals

- Show field errors inline under the exact input that needs correction
- Validate required fields as soon as users blur or continue typing
- Re-check active fields while typing with a debounced cadence
- Add realtime availability checks for user-facing unique fields during registration
- Preserve generic server responses for login failures so the auth surface does not reveal whether an account exists
- Map backend validation failures back into form fields instead of collapsing them into generic form errors

## Non-Goals

- No shared validation package between `apps/web` and `apps/api` in this phase
- No realtime uniqueness checks for system-generated fields such as `Recipe.slug`
- No redesign of the entire auth or recipe authoring layouts
- No introduction of a full form framework replacement beyond the existing `react-hook-form` setup
- No change to authentication security policy beyond improving client-visible error handling

## Scope

This design covers three user-facing forms:

- login
- register
- recipe studio create/edit

It also adds one new backend read endpoint for registration availability checks and upgrades frontend API error parsing so existing backend validation payloads can be rendered inline.

## Current Problems

### Frontend Error Collapse

`apps/web/lib/api.ts` throws generic string errors when a request fails. Forms therefore cannot distinguish:

- schema validation failures
- duplicate unique-field conflicts
- authentication failures
- business-rule failures such as `RECIPE_NOT_READY`

### Authentication UX Gap

`apps/web/components/auth/auth-form.tsx` only renders a single generic error block. Users do not see which field is malformed or missing before submit, and registration cannot warn that an email or username is already taken until the final request fails.

### Recipe Studio UX Gap

`apps/web/components/recipes/recipe-studio-form.tsx` does not surface field-level validation guidance. Array fields such as ingredients and steps are especially opaque because users have no inline signal about which row is invalid.

## Design Direction

### Validation Model

Use a hybrid validation model:

- local validation for required, format, length, number range, and URL rules
- debounced server validation only for user-facing unique fields
- backend remains the final source of truth at submit time

This provides immediate feedback without turning every keystroke into a network request.

### Visual Treatment

The validation UI should stay quiet and precise:

- labels above fields
- helper or status text below fields
- error text directly under the affected field
- muted `checking` state with a small progress affordance
- subtle success state rather than bright green badges

The goal is clarity, not noisy form chrome. This follows the existing Cookpedia palette and the design direction already established across the app.

### Component Strategy

Reuse existing `Input` and `Textarea` components. Add a small form-field presentation layer in the web app so validation state, helper text, availability status, and `aria-invalid` are handled consistently.

Per the shadcn guidance used in this project:

- the control remains the existing input component
- error text stays directly below the control
- validation state is semantic, not implemented with arbitrary one-off styles

## User-Facing Behavior

### Login

Fields:

- email
- password

Behavior:

- local validation runs on blur
- after blur, further edits re-check on debounce
- inline errors cover required, valid email format, and minimum password length
- submit stays available once local validation passes
- server login failures remain form-level only

Server failure display:

- `Email or password is incorrect`

The UI must never indicate whether the email exists, whether the password alone is wrong, or whether the target account is an admin account.

### Register

Fields:

- displayName
- username
- email
- password

Behavior:

- all fields get local inline validation on blur and debounced re-validation while typing
- `email` and `username` additionally perform debounced availability checks once local validation passes
- the form should not fire availability requests for empty or locally invalid values
- submit is blocked while `email` or `username` is still in `checking` state

Availability states:

- `unchecked`
- `checking`
- `available`
- `taken`
- `invalid`

Display examples:

- `Checking availability...`
- `Email is available`
- `This email is already in use`
- `This username is already taken`

### Recipe Studio

Fields:

- title
- shortDescription
- prepMinutes
- cookMinutes
- servings
- category
- cuisine
- difficulty
- locale
- coverImageUrl
- each ingredient row
- each step row

Behavior:

- local validation runs inline on blur and debounced re-check while typing
- no unique-check API is used here
- `coverImageUrl` is optional; blank is valid, but a non-empty value must be a valid URL
- ingredient and step errors render under the exact row and control that failed
- submit buttons are disabled while the form is invalid or currently submitting

## Unique Fields And Realtime Availability

The Prisma schema contains several unique constraints, but not all of them are user-facing:

- `User.email` — user-facing, must get realtime check
- `User.username` — user-facing, must get realtime check
- `Recipe.slug` — generated by backend, no realtime user check
- composite recipe child constraints — internal, handled by local form normalization and ordering

Therefore the new realtime availability API is intentionally limited to registration fields:

- email
- username

## API Contract

### New Endpoint

`GET /api/auth/availability`

Query params:

- `email?`
- `username?`

Response shape:

```json
{
  "email": { "status": "available" },
  "username": { "status": "unchecked" }
}
```

Allowed status values:

- `available`
- `taken`
- `invalid`
- `unchecked`

### Register Submit Conflict

Registration must stay race-safe even if an availability check said a value was free moments earlier. On final submit, the backend should return field-aware conflicts when uniqueness fails.

Response shape:

```json
{
  "message": "FIELD_CONFLICT",
  "fieldErrors": {
    "email": "This email is already in use"
  }
}
```

or

```json
{
  "message": "FIELD_CONFLICT",
  "fieldErrors": {
    "username": "This username is already taken"
  }
}
```

If both conflict, both keys may be present.

### Existing Validation Errors

Schema failures continue to return:

```json
{
  "message": "VALIDATION_FAILED",
  "issues": {
    "formErrors": [],
    "fieldErrors": {
      "body.email": ["Invalid email"]
    }
  }
}
```

The frontend must translate these into field-level `react-hook-form` errors rather than rendering a generic request failure.

### Frontend Error Object

The frontend API layer should throw structured errors rather than opaque strings.

Target shape:

```ts
type ApiError = {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
  issues?: {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  };
};
```

This allows forms to decide whether to:

- set a field error
- set a form-level error
- render a fallback message

## Security Posture

### Login

Login must remain intentionally vague on server-authenticated failures:

- the backend returns `INVALID_CREDENTIALS`
- the frontend shows one generic form-level message
- no server response reveals whether the email exists or which part of the credential pair failed

This protects against simple user enumeration and keeps the login surface harder to probe.

### Availability Endpoint

Availability checks are limited to registration and should not be reused for login. They should only run once local validation passes and should be debounced to reduce unnecessary probing and request noise.

If this surface becomes noisy in production, a later phase may add targeted rate limiting. That is not required for this implementation pass.

## Frontend Architecture

### Shared Hooks

Introduce two small client-side hooks:

- `useDebouncedValue`
- `useFieldAvailability`

`useDebouncedValue` should be generic and reusable across forms.

`useFieldAvailability` should:

- accept field name and current value
- skip invalid or empty values
- expose `status`, `message`, and `isChecking`
- cancel stale results when the value changes

### Form Error Mapping

Each form should:

- use `react-hook-form` for local rules
- call `setError` when backend field errors are returned
- keep form-level errors only for truly global failures such as `INVALID_CREDENTIALS`

### Reusable Field Presentation

Create a small presentation wrapper around existing controls so all forms consistently support:

- label
- helper text
- status text
- error text
- `aria-invalid`
- `data-invalid`

The wrapper should be lean and source-controlled in the app rather than pulling in a large component migration as part of this change.

## Backend Architecture

### Auth Module

Add one availability route under auth.

Responsibilities:

- validate incoming query values
- skip omitted fields cleanly
- check `User.email` and `User.username` independently
- return field statuses in one request

### Error Translation

Registration duplicate handling should stop returning only `USER_ALREADY_EXISTS` and instead translate known unique conflicts into field-aware responses that the frontend can attach to the exact input.

## Testing

### Backend

Add tests for:

- `GET /api/auth/availability` returns `available`
- returns `taken` for existing email
- returns `taken` for existing username
- register duplicate conflict maps to `fieldErrors`
- login still returns generic `INVALID_CREDENTIALS`

### Frontend

Add tests for:

- auth form shows inline required/format errors on blur
- register form shows debounced availability state for email and username
- register submit maps backend field conflicts inline
- recipe studio shows inline validation under invalid ingredient and step rows
- recipe studio does not reject blank `coverImageUrl`

### End-To-End

Add one or more E2E checks that cover:

- register form realtime feedback
- recipe form inline validation before submit
- generic login failure messaging

## Acceptance Criteria

- users see inline field errors on auth and recipe forms before final submit
- registration checks email and username availability in realtime with debounce
- login failures remain generic and do not reveal which credential is wrong
- backend validation payloads map back into specific frontend fields
- recipe field errors render under the exact field or row that failed
- no user-facing form still relies on `API_WRITE_FAILED:*` as the primary visible error

## Spec Self-Review

### Placeholder Scan

No TODO or TBD placeholders remain. The fields, API contract, security posture, and validation layers are explicitly named.

### Internal Consistency

The design consistently applies a hybrid validation strategy: local first, debounced remote for uniqueness, backend as final authority. Login remains generic while registration can expose availability safely.

### Scope Check

This is focused on validation UX and the minimum backend support required for it. It does not expand into broader recipe workspace, rating, or bookmark redesign work.

### Ambiguity Check

The user-facing unique fields are explicitly limited to `email` and `username`. `Recipe.slug` is explicitly excluded from realtime checking because it is backend-generated. Login response visibility is also explicit: generic only.
