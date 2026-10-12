# Elevation Edinburgh — Repo Conventions

Applies to the whole repo. Enforced by ESLint/Prettier/CI where possible; by review otherwise.

## Guiding rule: platform-agnostic core

We ship a PWA first and convert to native (Capacitor) later. Everything that makes this
app valuable — routing profiles, grade math, steepness banding, domain types — must not
know it runs in a browser.

- `src/core/` **must not** import React, MapLibre, or any browser global (`window`,
  `document`, `navigator`, `localStorage`; network access goes through an injected client).
- Platform capabilities (geolocation, storage, network status, share) are accessed only
  through interfaces in `src/adapters/`. The web implementations live there today; the
  Capacitor implementations drop in beside them later without touching features.
- Enforced by ESLint import-boundary rules (`import/no-restricted-paths`), not memory.

## Folder structure

```
src/
  app/              # app shell: entry, providers, top-level routes, service worker glue
  core/             # platform-agnostic domain logic (pure TS, no React/DOM)
    routing/        #   route profiles, costing presets, route model
    elevation/      #   sampling, grade %, steepness banding
    types.ts        #   shared domain types (see vocabulary below)
  adapters/         # platform abstraction: interface + web impl per capability
    geolocation/
    storage/
    http/
  features/         # UI feature modules — a feature owns its components/hooks/state
    map/
    search/
    route-compare/
    elevation-profile/
  components/       # shared presentational components (Button, Sheet, Legend)
  styles/           # design tokens (from Paper), global css
  lib/              # generic helpers with no domain meaning (formatters, debounce)
  assets/
public/             # static: icons, manifest assets
docs/               # this file, ADRs (docs/adr/NNN-title.md), validation routes
```

Rules:
- Features may import `core`, `adapters` (interfaces), `components`, `lib` — never each
  other. Cross-feature needs go through `core` or lifted state in `app`.
- A feature folder contains `components/`, `hooks/`, `state/` as needed, plus an
  `index.ts` exporting its public surface. Import features only via their `index.ts`.
- No `utils/` dumping ground; if a helper has domain meaning it belongs in `core`.

## Naming

### Files & folders
- **kebab-case for every file and folder**: `route-compare/`, `use-route-query.ts`,
  `grade-banding.ts`, `route-card.tsx`. No exceptions for components.
  Why: macOS is case-insensitive, Linux CI is case-sensitive — PascalCase filenames
  cause the classic "works on my machine" git rename bugs.
- Tests colocated: `grade-banding.test.ts` next to `grade-banding.ts`.
- One React component per file; the file is named after its default export
  (`route-card.tsx` → `export function RouteCard`).

### Code (TypeScript)
- `camelCase` — variables, functions, hooks (`useRouteQuery`), object keys.
- `PascalCase` — React components, types, interfaces, enums (`Route`, `GradeBand`).
  No `I` prefix on interfaces, no `T` prefix on types.
- `UPPER_SNAKE_CASE` — true module-level constants (`EDINBURGH_BOUNDS`, `MAX_ZOOM`).
- Booleans read as predicates: `isLoading`, `hasElevation`, `canRoute`.
- Handlers: props are `onX` (`onRouteSelect`), implementations are `handleX`.
- **Units live in the name** — this app is made of numbers that go wrong silently:
  `distanceMeters`, `elevationMeters`, `gradePercent`, `durationSeconds`,
  `speedKmh`. Never a bare `distance` or `grade`.

### Domain vocabulary (use these words, no synonyms)
- `Route` — one A→B result from the engine.
- `Segment` — a piece of a route between two sampled points; carries `gradePercent`.
- `GradeBand` — steepness class: `flat | gentle | moderate | steep | verySteep`
  (signed: negative grade = downhill, banding handles direction).
- `RouteProfile` — `'fastest' | 'easier' | 'lowElevation' | 'accessible'`.
- `TravelMode` — `'walking' | 'cycling'`.
- `Place` — a geocoded origin/destination (search result or map pick).

### Environment variables
- Client-exposed: `VITE_` prefix, UPPER_SNAKE: `VITE_ORS_API_KEY`,
  `VITE_ROUTING_BACKEND` (`ors | valhalla`), `VITE_VALHALLA_URL`.
- `.env.example` is committed and always current; `.env*` (except example) gitignored.
- Secrets never in code, never in Vite-exposed vars unless genuinely public-tier keys.

### CSS / design tokens
- Tokens mirror the Paper design system: `--color-grade-flat`, `--color-grade-steep`,
  `--space-2`, `--radius-sheet`. Components consume tokens, never raw hex.

## Git

### Branches
- Trunk-based: short-lived branches off `main`, merged by PR. No `develop` branch.
- Name: `type/story-id-short-description` (kebab-case), story id from the backlog/Trello:
  - `feat/0.3-vite-scaffold`
  - `feat/4.4-elevation-colored-route`
  - `fix/2.2-autocomplete-focus-trap`
  - `chore/ci-node-version`, `docs/adr-routing-engine`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `spike` (throwaway
  experiments — never merged, deleted after learning is written up).

### Commits — Conventional Commits
`type(scope): imperative summary` — lower-case, no trailing period, ≤72 chars.

- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `style`.
- Scope = feature or area: `map`, `search`, `routing`, `elevation`, `pwa`, `ci`.
- Body (when needed): the why, not the what. Reference the story: `Story: 4.4`.

```
feat(elevation): band segments into steepness classes

Bands follow the validated design-system scale; downhill grades
band separately so descents can warn accessibility users.

Story: 4.3
```

### Pull requests
- One story per PR where possible; PR title follows the commit convention.
- Template asks: what/why, story link, screenshots for UI, "core stayed
  platform-agnostic?" checkbox.
- Squash-merge to `main`; the squash commit message follows the commit convention.
- CI (lint, typecheck, test, build) must be green; `main` is protected.

## Decisions
Anything with long-term consequences (routing engine swap, state library, token format)
gets a one-page ADR in `docs/adr/NNN-title.md`: context, decision, consequences.
ADR 001 is the stack choice already made (MapLibre + OpenFreeMap + ORS→Valhalla + LiDAR).
