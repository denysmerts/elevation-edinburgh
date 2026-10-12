# Elevation Edinburgh — Agent Guide & Key Decisions

Elevation-aware walking/cycling routing PWA for Edinburgh. Shows not just the fastest
route but what the journey will feel like: routes colored by steepness, compared across
profiles (Fastest / Easier / Lower Elevation / Accessible). Motto: "Smarter routes,
Easier Journeys."

## Key decisions (do not re-litigate without an ADR)

| Decision | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript (strict) PWA | agreed stack; PWA → native later |
| Native path | Capacitor (planned, not yet added) | whole web app carries over; only adapters change |
| Map rendering | MapLibre GL JS | free, custom styles, `line-gradient` route coloring, 3D terrain later |
| Basemap tiles | OpenFreeMap | genuinely unlimited, no API key |
| Routing Phase A | OpenRouteService hosted API | free 2,500 req/day, zero infra |
| Routing Phase B | Self-hosted Valhalla (Edinburgh OSM extract) | `use_hills`/wheelchair costing per request — real hill avoidance |
| Elevation data | Scotland 1m LiDAR DTM (OGL) | 1m accuracy is the product differentiator vs SRTM ~30m |
| Geocoding | Photon (komoot), Edinburgh bbox | free, supports typeahead (Nominatim forbids autocomplete) |
| Terrain visuals | AWS Open Data Terrarium tiles | free raster-dem for hillshade/3D |
| Design source | Paper file (brand palette, validated steepness colors) | tokens mirror it: `--color-grade-*` |

New long-term decisions get a one-page ADR in `docs/adr/NNN-title.md` (context,
decision, consequences) and a row in this table.

## Architecture rule: platform-agnostic core

- `src/core/` is pure TypeScript — never imports React, MapLibre, or browser globals.
- Device capabilities (geolocation, storage, http) are used only via interfaces in
  `src/adapters/` (web impls today, Capacitor impls later).
- Features (`src/features/map|search|route-compare|elevation-profile`) never import
  each other; cross-feature needs go through `core` or app-level state.

Target structure: `src/app` (shell) · `src/core` (domain) · `src/adapters` ·
`src/features` · `src/components` (shared UI) · `src/styles` (tokens) · `src/lib`.

## Conventions (essentials)

- Files/folders: kebab-case everywhere, incl. components (`route-card.tsx` →
  `export function RouteCard`). Tests colocated (`*.test.ts`).
- Code: camelCase vars/hooks, PascalCase types/components, UPPER_SNAKE constants,
  boolean predicates (`isLoading`), props `onX` / handlers `handleX`.
- **Units in names**: `distanceMeters`, `gradePercent`, `durationSeconds` — never bare
  `distance`/`grade`.
- Domain vocabulary (no synonyms): `Route`, `Segment`, `GradeBand`
  (`flat|gentle|moderate|steep|verySteep`), `RouteProfile`
  (`fastest|easier|lowElevation|accessible`), `TravelMode` (`walking|cycling`), `Place`.
- Env vars: `VITE_` + UPPER_SNAKE (`VITE_ORS_API_KEY`, `VITE_ROUTING_BACKEND=ors|valhalla`);
  `.env.example` committed, real `.env*` gitignored.
- Git: trunk-based off `main`; branches `type/story-id-desc` (`feat/4.4-elevation-colored-route`);
  Conventional Commits (`feat(elevation): band segments into steepness classes`,
  body references `Story: 4.3`); squash-merge; CI must be green.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build (must pass before PR)
- `npm run lint` — ESLint

## Where things live

- `BACKLOG.md` — MVP epics/stories (mirrors the Trello "elevation" board)
- `docs/CONVENTIONS.md` — full conventions (this file holds the essentials)
- `docs/adr/` — architecture decision records
