# Cookpedia Homepage and Auth Navigation Redesign

## Overview

This spec refines the public-facing Cookpedia experience after the initial phase-1 implementation exposed two quality gaps:

- the homepage currently behaves like a functional shell rather than an editorial-grade cover page
- the top navigation does not reflect real authentication states or the intended product flow for guests, users, and admins

The redesign should preserve the existing backend foundations and product rules while upgrading the presentation, information hierarchy, and auth-entry experience.

## Goals

- make the homepage feel like the cover of a strong culinary product, not a placeholder dashboard
- keep guests free to explore public content without being blocked too early
- make authentication entry feel elegant and contextual rather than abrupt
- avoid exposing admin navigation in the public client shell
- keep the information architecture practical enough to ship in phase 1 without inventing a full CMS

## Problems in the Current UI

- header navigation is static and does not reflect signed-in versus guest states
- guests do not get a clear account entry point that matches the intended auth flow
- homepage hero is structurally correct but too sparse and visually generic
- homepage lacks a practical footer
- homepage does not foreground trending content, featured categories, or fresh discovery strongly enough
- admin workflow is too visible conceptually if represented directly in client navigation

## Product Rules

### Guest Access

Guests can freely access:

- homepage
- search
- category-like discovery sections
- author pages
- recipe detail pages

Guests must authenticate only when they attempt protected actions:

- save/bookmark
- rate/review
- create recipe
- profile/settings access
- admin/moderation routes

### Admin Access

Admin navigation must not be exposed as a public client-side nav item.

Rules:

- admin users do not get a visible `Moderation` entry in the shared header or account dropdown
- after successful admin login, redirect to `/admin/recipes/pending`
- if an admin clicks the main `Cookpedia` logo, route them to `/` rather than forcing them back into the admin queue
- admin protection remains enforced by backend guards and role checks, not by hiding links alone

## Header Design

### Visual Treatment

The header uses a floating pill-bar style:

- positioned with a top offset (~16px default, ~12px when scrolled) to float above the hero
- horizontally centered using `left-1/2 -translate-x-1/2` with `width: calc(100% - 2rem)` and a max-width of 1400px
- border-radius of 2.5rem (unscrolled) / 2rem (scrolled) for a rounded capsule appearance
- when scrolled, gains a semi-transparent glass background (`bg-[var(--canvas)]/85`), subtle border, soft shadow, and `backdrop-blur-xl`
- transitions smoothly between transparent and glass states using 500ms easing

### Shared Structure

- left side: `Cookpedia` wordmark/logo
- right side: public discovery link(s) plus one account trigger
- `Profile` and other user actions should never sit as loose equal-weight nav items next to public links

### Guest Header

Guest state should show:

- `Search`
- `Trending`
- one account button on the right

The guest account button:

- can be icon-led, text-led, or both
- should read as an account entry point, for example `Login / Register`
- opens a dropdown with:
  - `Login`
  - `Register`

### Authenticated User Header

Authenticated state should show:

- `Search`
- `Trending`
- one profile trigger on the right

The profile trigger:

- can use avatar if available, otherwise an icon/user mark
- may show `Profile` or a compact user identity label
- opens a dropdown with:
  - `Profile`
  - `My Recipes`
  - `Saved`
  - `Settings`
  - `Logout`

### Mobile Header

- do not try to preserve every desktop link inline
- keep the logo visible
- keep the account trigger visible
- reduce public links to the minimum needed for clarity

## Auth Gate Design

Protected actions should not hard-redirect guests to auth routes immediately. They should open a login dialog first.

### Triggered By

- save/bookmark buttons
- rating/review actions
- create recipe CTA
- profile/settings entry
- admin-only destinations

### Dialog Behavior

The auth gate dialog should contain:

- quick login form
- secondary CTA to go to `Register`
- explicit dismiss action such as `Continue browsing`

### Post-Login Intent

After successful login:

- small protected actions should continue the interrupted intent when feasible
- route-based intents should continue to the intended page after login
- admin login should redirect to `/admin/recipes/pending`

## Homepage Composition

The homepage should follow an editorial-discovery rhythm rather than a plain app shell rhythm.

Reading order:

1. brand + search
2. trending recipes
3. featured categories
4. newest recipes
5. practical footer

### Hero

- left-aligned editorial composition
- dominant headline with stronger personality than the rest of the UI
- search built directly into the hero and treated as the main action
- supporting copy should explain discovery and structured recipes clearly, without marketing cliches
- right side should act as visual cover art, not as an empty placeholder card

### Trending Recipes

Trending must be the first major content section after the hero.

Selection rule:

- primary order: `most saved`
- tie-break: `highest rated`

Presentation rule:

- one recipe should lead visually
- supporting recipes should not be perfectly equal clones
- use stronger hierarchy, larger image treatment, and tighter metadata

### Featured Categories

Featured categories should be dynamic, based on published recipe data rather than a hardcoded marketing list.

Expected behavior:

- derive from published recipes
- select the top 6 categories by published recipe count
- exclude categories with no published recipes
- present as visually meaningful discovery blocks, not plain pills

### Newest From Cookpedia

- secondary discovery section
- lighter visual weight than trending
- keeps the homepage feeling alive and recently updated
- section heading uses a single display title "Newest recipes" with an inline descriptor "Fresh from the kitchen — recently approved and ready to try." on the same baseline row, rather than splitting into a label, heading, and separate description paragraph

### Footer

The footer should be practical, not editorial.

Include:

- quick links
- account/auth links
- category/discovery links
- contact
- legal links

It should still match the same palette, spacing, and typography system as the rest of the page.

## Visual Direction

The target tone is:

`culinary archive meets modern product`

### Principles

- feels like the cover of a digital culinary journal
- still reads as a real application, not a concept-only landing page
- strong hierarchy between sections
- asymmetry where useful, not everywhere
- no generic three-equal-card feature rows
- no flat placeholder feel

### Typography

- hero and major section titles should use a more editorial serif display face
- UI controls, nav, metadata, and dense supporting copy should stay on a clean sans-serif
- section labels should feel intentional, not default uppercase filler

### Surfaces and Layout

- use the existing warm neutral and olive palette as the base
- avoid repetitive white-card grids with identical rhythm everywhere
- allow one lead card or lead visual per major section
- desktop should feel composed and directional
- mobile should collapse into a clean single-column flow without feeling stripped

## Data and Architecture Implications

The redesign should work with the existing backend where possible, but it changes frontend data needs.

### Authentication State

The shared shell needs a real auth-aware header. That means the frontend must be able to determine:

- guest versus authenticated state
- user identity for the profile trigger
- whether the signed-in user is admin at login time for redirect behavior

Source of truth:

- use `/auth/me` as the canonical auth-state read
- after login or register succeeds, resolve the destination from the authenticated user returned by the next auth-state read rather than guessing from client state

### Homepage Data

The homepage needs, at minimum:

- trending recipe collection
- newest recipe collection
- featured category collection

Preferred implementation direction:

- provide server-friendly data for homepage sections in a stable way
- prefer a dedicated homepage payload such as `/recipes/home` over scattering unrelated fetch logic across many small components
- avoid scattering multiple ad hoc client-only fetches across small components

### Admin Redirect

After login, the frontend needs enough user data to know whether to route to:

- `/profile` for normal users
- `/admin/recipes/pending` for admins

## Non-Goals

This redesign does not require:

- a full CMS
- translated recipe content
- exposing admin navigation publicly
- redesigning every page into an editorial layout
- replacing the existing backend auth model

## Testing Requirements

### Header

- guest sees discovery links and account entry button
- authenticated user sees profile trigger and dropdown actions
- admin is not shown a dedicated public moderation nav item

### Auth Gate

- guest clicking protected actions opens login dialog
- login from dialog succeeds
- register remains reachable from the same interaction path

### Homepage

- hero search works directly from the homepage
- trending section renders from real data
- featured categories render from published data
- newest section renders
- footer links appear and route correctly

### Admin Flow

- admin login redirects to `/admin/recipes/pending`
- admin can still return to `/` via the main logo

## Implementation Note

This redesign should be applied as an upgrade to the existing phase-1 UI, not a rewrite from scratch. Existing routing, auth APIs, moderation rules, and recipe discovery behavior remain the foundation.
