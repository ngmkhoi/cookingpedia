# Homepage Hero Fixed Background Design

## Overview

The homepage hero currently uses `heroRecipe.coverImageUrl` as the section background. That makes the top of the product visually unstable because the entire hero mood shifts based on whichever recipe happens to rank first. Busy or high-contrast food photography can overpower the headline, wash out navigation contrast, and make the hero feel inconsistent from one recipe set to another.

This design removes recipe imagery from the hero section background itself and replaces it with a fixed brand-controlled background. Recipe imagery remains in the featured recipe card on the right, so the product still feels culinary and content-driven without sacrificing hierarchy.

## Goals

- Make the homepage hero visually stable regardless of which recipe is featured
- Preserve strong contrast for headline, header, and primary actions
- Keep recipe imagery present in the hero through the featured card
- Stay within the existing Cookpedia palette and editorial direction

## Non-Goals

- No redesign of the hero layout structure
- No change to the featured recipe card content model
- No introduction of animated canvas, parallax, or other large motion treatments
- No new visual theme fork from the current Cookpedia palette

## Design Direction

### Background Strategy

The hero section background should become fixed and brand-controlled.

Recommended composition:

- a dark olive-to-warm neutral gradient as the base
- subtle radial washes for atmosphere
- no recipe image in the section background

This keeps the hero legible and lets the recipe image live where it is most useful: inside the featured card, where it reads as content rather than environmental decoration.

### Visual Tone

The background should feel:

- warm
- editorial
- grounded
- premium

It should not feel:

- glossy
- overly cinematic
- image-led
- dependent on whichever food photo happens to be selected

The palette should stay consistent with the current site variables:

- `--accent-strong`
- `--accent`
- `--canvas`
- warm neutral surface tones already present in `globals.css`

## Layout Behavior

### Left Column

No structural changes:

- headline remains large and left-aligned
- supporting copy remains readable over the fixed background
- search form and CTA row remain in place

### Right Column

Keep the featured recipe card and continue using `heroRecipe.coverImageUrl` inside the card image only.

This preserves:

- product relevance
- appetite appeal
- the feeling that the hero is still tied to live content

without allowing recipe images to dictate the entire hero atmosphere.

## Implementation Intent

### Current Problematic Behavior

The current page builds:

- a gradient overlay
- then appends `url(${heroRecipe.coverImageUrl})` to the hero section background when an image exists

That coupling should be removed.

### New Behavior

The hero section should always use a fixed CSS background string.

The featured card image should continue to use:

- `heroRecipe.coverImageUrl` when present

So the data relationship becomes:

- section background = fixed
- featured card image = dynamic

## Contrast And Readability

The fixed background must preserve enough darkness in the upper region to support:

- white or near-white hero heading
- subdued white supporting copy
- the transparent header treatment used on the homepage before scroll

The lower portion may transition toward `--canvas` to maintain continuity with the body of the page, but that transition should not happen so early that the headline area loses contrast.

## Testing

### Visual Verification

Manual checks should confirm:

- homepage hero no longer changes when the top featured recipe image changes
- headline remains readable on desktop and mobile
- the featured recipe card still shows recipe imagery correctly
- the homepage header remains readable against the fixed hero background

### Regression Safety

No route or API changes are required for this change. Verification can remain focused on:

- `pnpm typecheck`
- `pnpm test`
- visual inspection of the homepage hero

## Acceptance Criteria

- the homepage hero section never uses recipe image URLs as its background
- the featured recipe card still uses the featured recipe image
- headline and controls remain readable
- the hero still feels content-rich rather than empty

## Spec Self-Review

### Placeholder Scan

No TODO/TBD placeholders remain. The design explicitly states what becomes fixed and what remains dynamic.

### Internal Consistency

The design consistently keeps the layout intact while changing only the hero background behavior. There is no contradiction between the desire for a fixed hero atmosphere and the requirement to still show recipe imagery in the hero card.

### Scope Check

This is appropriately small for a single implementation pass. It affects homepage presentation only and does not expand into broader homepage redesign work.

### Ambiguity Check

The key behavioral rule is explicit:

- section background is fixed
- featured card image remains dynamic

That prevents misinterpretation during implementation.
