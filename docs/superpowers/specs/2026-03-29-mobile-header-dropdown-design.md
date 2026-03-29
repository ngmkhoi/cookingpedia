# Mobile Header Dropdown Design

## Overview

The current header works well on desktop and tablet, but on mobile the top bar still tries to carry too many primary navigation actions inline. Search, Trending, and the account trigger compete for horizontal space, which makes the header feel cramped and weakens tap clarity.

This change keeps the desktop and tablet experience intact and only adjusts mobile behavior. On small screens, the header should collapse its primary navigation into the existing account-led trigger so the top bar remains compact while still exposing both browsing and account actions.

## Goals

- Preserve the current desktop and tablet header behavior exactly
- Reduce mobile header clutter without introducing a separate hamburger system
- Keep navigation and account access unified on mobile
- Maintain the current Cookpedia visual language and dropdown pattern

## Non-Goals

- No desktop header redesign
- No tablet header redesign
- No new route structure
- No full-screen drawer or sheet in V1
- No new navigation component family

## Product Direction

The header should behave differently by screen size, not by product area.

Desktop and tablet already communicate:

- brand
- main navigation
- account entry

clearly enough.

Mobile is the only breakpoint where the current inline layout stops paying off. The solution should therefore be responsive simplification, not a full navigation rewrite.

## Responsive Behavior

### Desktop And Tablet

No behavior changes.

Keep:

- logo on the left
- `Search` and `Trending` visible as separate top-level actions
- account trigger on the right

### Mobile

On mobile, the visible header should collapse to:

- logo on the left
- one account-led trigger on the right

The standalone `Search` and `Trending` controls should no longer appear inline in the bar on mobile.

## Trigger Model

The mobile trigger should remain account-led rather than introducing a new menu button.

### Anonymous User

Trigger label:

- `Login / Register`

Reason:

- keeps the account-first framing already established in the current header
- is more explicit than a generic `Menu`
- still works as the single mobile access point for both navigation and auth

### Authenticated User

Trigger label:

- existing user display label where it fits
- if the name becomes visually awkward on mobile, fallback to `Profile`

This keeps the trigger semantically aligned with the user state without overloading the small-screen header.

## Dropdown Contents

The dropdown remains one unified menu on mobile.

### Shared Navigation Group

Always include:

- `Search`
- `Trending`

These should appear above account actions and feel like the “explore” layer.

### Anonymous Account Group

When not signed in, show:

- `Login`
- `Register`

### Authenticated Account Group

When signed in, show:

- `Profile`
- `My Recipes`
- `Saved`
- `Settings`
- `Logout`

### Admin-Only Item

If the user is an admin, also include:

- `Moderation queue`

## Visual And Interaction Design

### Layout

The dropdown should continue to open from the right edge below the trigger, following the same general interaction model as the current menu.

Do not turn it into:

- a full-screen sheet
- a centered modal
- a bottom drawer

for this iteration.

### Touch Target Behavior

Mobile menu items should be slightly roomier than the current desktop-feeling list, so taps feel intentional and not compressed.

### Styling Direction

Keep the existing header/menu visual language:

- rounded surfaces
- warm neutral panel tones
- subtle borders
- soft hover/press response

The menu should feel like the same Cookpedia header system, just collapsed intelligently for mobile.

## Technical Direction

The simplest implementation path is to reuse the existing `SiteHeader` component and change its responsive rendering rules.

Preferred implementation approach:

- keep one header component
- hide the standalone nav links below the mobile breakpoint
- keep one dropdown trigger
- insert `Search` and `Trending` into the dropdown menu content on mobile

This avoids maintaining separate desktop and mobile navigation systems.

## Accessibility And Usability

The mobile header must still support:

- readable trigger label
- clear tap target sizing
- obvious open/close state
- keyboard-accessible menu behavior

The dropdown should not overflow horizontally or produce awkward clipping on narrow screens.

## Testing Strategy

### Mobile E2E

At a mobile viewport, verify:

- inline `Search` and `Trending` are no longer visible in the header
- the account-led trigger is visible
- opening the trigger reveals `Search` and `Trending`
- anonymous state reveals `Login` and `Register`

### Desktop Regression

At desktop viewport, verify:

- `Search` and `Trending` remain visible inline
- the existing account trigger behavior is unchanged

### Visual Verification

Check manually that:

- the trigger label fits comfortably on mobile
- the dropdown does not feel cramped
- navigation remains understandable without the separate inline links

## Acceptance Criteria

- desktop and tablet header behavior stays unchanged
- mobile header only shows logo plus one account-led trigger
- mobile dropdown includes `Search` and `Trending`
- anonymous mobile state includes `Login` and `Register`
- authenticated mobile state keeps account actions available
- the resulting mobile header feels less crowded and easier to use

## Spec Self-Review

### Placeholder Scan

No TODO/TBD placeholders remain. The spec is explicit about which breakpoint changes and which stay untouched.

### Internal Consistency

The spec consistently preserves desktop/tablet behavior and narrows all changes to mobile only.

### Scope Check

This is appropriately small for a single implementation pass. It affects one component family and one responsive behavior set.

### Ambiguity Check

The key rule is explicit:

- desktop/tablet unchanged
- mobile collapses top-level nav into the existing account-led trigger

That should be sufficient to write an implementation plan without guessing the intended behavior.
