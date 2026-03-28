# Discovery Page V1 Design

## Overview

Cookpedia currently treats `/search` as a keyword-results page, but the product direction needs it to act more like the main table of contents for the recipe catalog. The homepage can stay curated and editorial, but discovery must become a reliable, content-first destination where users can browse without already knowing what to search for.

This design turns `/search` into a single discovery page that supports multiple entry points:

- `Search` in the header
- `See all newest` from the homepage
- category navigation from homepage category modules
- direct keyword search

The page remains one unified experience, but it supports multiple filter scopes. The visible primary controls stay simple, while advanced filters remain available behind a disclosure control.

## Goals

- Make `/search` useful even when no keyword is entered
- Keep discovery consolidated into one page rather than fragmenting routes
- Limit homepage `Newest recipes` to a preview and route users to the full listing
- Support multiple URL-driven entry points into the same filtered view
- Keep the V1 filter model intentionally small and expandable later
- Use the existing shadcn-based component strategy and preserve the current design language

## Non-Goals

- No separate `/discover` route in V1
- No separate dedicated newest-only page in V1
- No faceted search system with dozens of controls
- No pagination or infinite scroll redesign in this change unless needed to support the initial browse experience
- No backend rewrite beyond what discovery filtering actually needs

## Product Direction

The discovery page is the content index of the product.

The homepage remains:

- curated
- directional
- preview-based

The discovery page becomes:

- comprehensive
- filterable
- URL-driven
- a real place to browse published recipes even before typing a query

This avoids the current mismatch where the homepage feels polished and complete, but the deeper content path feels empty or unfinished.

## Information Architecture

### Primary Route

Use `/search` as the single discovery route.

Supported entry states:

- `/search` — all published recipes, default browse state
- `/search?sort=newest` — newest-first preset
- `/search?category=Dinner` — category preset
- `/search?q=egg` — keyword search
- combinations like `/search?sort=newest&category=Lunch`

### Homepage Role

The homepage should no longer imply that `Newest recipes` is a complete list.

Instead:

- show a curated preview only
- add a clear CTA such as `See all newest`
- route that CTA to `/search?sort=newest`

This makes the homepage a front cover and preview layer, while `/search` becomes the actual contents index.

## UI Structure

## Discovery Page Layout

The page should be organized in this order:

1. **Page intro**
   - left-aligned heading
   - short supporting copy
   - current state context such as browse vs filtered mode

2. **Primary controls**
   - large search input
   - sort control
   - `Advanced filters` toggle button

3. **Category quick filters**
   - visible chip-style category controls
   - acts as immediate topical navigation

4. **Active filter bar**
   - result count
   - active filter summary
   - clear filters action

5. **Recipe results grid**
   - recipe cards
   - empty state when filters are too narrow

## Primary Controls

The always-visible primary control set for V1:

- `search keyword`
- `sort`
- `category quick filters`

The sort control in V1 should include only:

- `Newest`
- `Most saved`

That keeps the first version tight and avoids exposing too many ranking modes before the browse model is stable.

## Advanced Filters

Advanced filters are secondary and should be hidden behind a toggle by default.

V1 advanced filters:

- `cuisine`
- `difficulty`
- `max cook time`

These should appear inline as a revealed panel rather than taking over the page.

The reason to prefer an inline reveal over a new route or heavy modal:

- the page is browse-first
- filters are supplemental
- the user should feel they are still on the main catalog page

## Component Strategy

This design should follow the current shadcn and frontend design constraints already used in the repo.

### shadcn-Oriented Composition

Preferred component set:

- `Input` for keyword search
- `ToggleGroup` for the sort switch
- `Button` for CTA actions and filter toggles
- chip-style buttons or badge-like controls for category quick filters
- `Collapsible`-style inline advanced filter region if available in the project, otherwise an equivalent existing component pattern

The page should compose existing components before introducing new bespoke primitives.

### Visual Direction

The page should feel like a premium index, not a utilitarian search dashboard.

Rules:

- keep the heading left-aligned
- avoid generic centered empty search layouts
- avoid a bland filter bar floating above a standard card grid
- use hierarchy to make categories feel like a table of contents, not like low-priority tags
- keep the homepage preview and discovery page visually related, but do not make the discovery page feel like a duplicate homepage section dump

The design should stay within the existing Cookpedia palette and typography system:

- warm neutral base
- deep olive accenting
- expressive serif display only where already appropriate
- no new visual theme fork

## Homepage Preview Behavior

### Newest Recipes Section

The homepage `Newest recipes` section should display exactly `6` recipes total.

Composition:

- `1` featured recipe
- `5` smaller supporting recipes

Add a visible CTA near the section heading:

- `See all newest`

Destination:

- `/search?sort=newest`

The CTA should sit in the heading region so it is obvious this section is a preview, not the complete catalog.

### Category Navigation

Category interactions from the homepage should also route into the discovery page rather than staying isolated in homepage-only sections.

Expected behavior:

- click category -> `/search?category=<name>`

This aligns homepage browsing with the discovery architecture instead of creating multiple disconnected filter experiences.

## Backend Scope

The backend scope for V1 should stay intentionally small.

### Existing Route Reuse

Do not create a new discovery route if the current public recipe query path can be extended safely.

The current public search/explore behavior should be extended to support the discovery query model.

Required query dimensions for V1:

- `q`
- `category`
- `sort`
- `cuisine`
- `difficulty`
- `maxCookMinutes`

### Default Browse State

The critical behavior change:

- when no `q` is present, the discovery page must still receive published recipes

That means the underlying API path cannot treat “empty search” as “return no results” for the discovery use case.

### Sorting

V1 sorting requirements:

- `newest`
- `mostSaved`

These are sufficient for the first release and already align with the current content model.

## URL State Model

The discovery page should be URL-driven so every state can be linked into directly.

Examples:

- `/search`
- `/search?sort=newest`
- `/search?sort=mostSaved`
- `/search?category=Drinks`
- `/search?q=egg&category=Breakfast`
- `/search?difficulty=EASY&maxCookMinutes=20`

Benefits:

- entry points from homepage are cheap
- filter state is shareable
- browser navigation behaves naturally
- no duplicated client-only state model is required for V1

## Empty, Loading, and Error States

This page is discovery-critical, so it must not feel broken under common states.

### Loading

- render layout-aware loading placeholders
- do not render a blank grid frame

### Empty

If filters return nothing:

- show a clear empty state
- explain that no recipes matched the current filters
- offer a `Clear filters` action

### Error

If recipe loading fails:

- show a visible inline error state
- avoid leaving the discovery page visually hollow

## Testing Strategy

### API Tests

Add or extend tests to confirm:

- default browse without `q` returns published recipes
- `sort=newest` returns newest ordering
- `sort=mostSaved` returns save-ranked ordering
- `category` filters correctly
- advanced filter fields narrow the result set correctly

### Web / E2E Tests

Add or extend tests to confirm:

- header `Search` leads to a populated discovery page
- homepage `See all newest` leads to `/search?sort=newest`
- homepage category interactions lead to `/search?category=...`
- advanced filters open and affect results
- empty state appears when filters are too narrow

## Files Expected To Change

Frontend:

- `apps/web/app/page.tsx`
- `apps/web/components/home/newest-grid.tsx`
- `apps/web/app/search/page.tsx`
- one or more small discovery-oriented UI components under `apps/web/components/...`
- related E2E tests in `tests/e2e/...`

Backend:

- the public recipes query path under `apps/api/src/modules/recipes/...`
- related API tests

Exact file decomposition should be decided in the implementation plan, but the work should stay focused on discovery and homepage preview behavior.

## Risks

### Risk: Discovery page becomes too heavy too early

Mitigation:

- keep only two primary sort modes
- keep advanced filters hidden by default
- do not add extra ranking concepts in V1

### Risk: Homepage and discovery feel visually disconnected

Mitigation:

- keep category language and recipe card vocabulary consistent
- use the homepage CTA to teach the transition from preview to full listing

### Risk: Search semantics get muddled

Mitigation:

- treat `/search` as discovery-first
- ensure the page still supports keyword input prominently
- avoid separate browse routes in V1

## Acceptance Criteria

- `/search` shows published recipes even without a query
- homepage `Newest recipes` shows only a 6-item preview
- homepage provides a `See all newest` CTA linking to `/search?sort=newest`
- category navigation routes into the same discovery page
- discovery page supports visible primary filters and hidden advanced filters
- the page never feels empty by default when content exists in the catalog
