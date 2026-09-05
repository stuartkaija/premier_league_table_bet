# Premier Table Game

A tracker for a bet between the user (Stu) and 3 friends (Dean, Nehad, Dave):
everyone predicted the final Premier League table order for the 2026-27
season, and this app tracks live standings against those predictions, scores
them, and ranks the players.

## Stack

- React 19 + TypeScript
- Vite 8 (dev server, build)
- Tailwind CSS v4 (via `@tailwindcss/vite`) — all component styling is
  Tailwind utility classes in JSX; there are no other CSS files besides
  `src/index.css`
- Oxlint (linting)
- Yarn (package manager)
- Hosting: GitHub Pages, deployed via GitHub Actions (not set up yet)
- Live data: [football-data.org](https://www.football-data.org/) (free tier)

## Architecture

The live table is **never fetched from the browser**. Instead:

1. `.github/workflows/fetch-standings.yml` runs on a schedule (every 3h) and
   on manual dispatch. It runs `scripts/fetch-standings.mjs`, which calls the
   football-data.org standings endpoint using the `FOOTBALL_DATA_API_KEY`
   repo secret, and writes the result to `src/data/standings.json`.
2. If that file changed, the workflow commits and pushes it to `main`.
3. That push triggers `.github/workflows/deploy.yml`, which builds the app
   with `yarn build` and deploys `dist/` to GitHub Pages.

This keeps the API key server-side only, avoids rate-limit issues from
multiple people loading the page, and means the app itself is 100% static —
no backend, no database. Players' bets are static/locked for the season, so
they live in a plain data file rather than any storage layer.

**This pipeline is scaffolded but not yet live** — no git repo exists yet, so
neither workflow has actually run in GitHub Actions. `fetch-standings.mjs`
has been run and verified locally instead (see below).

## Data flow

- `src/data/teams.ts` — the real 20 clubs for the season, confirmed against a
  live API pull. `id` is each club's football-data.org `tla` (e.g. `MCI`,
  `ARS`), matching `standings.json`.
- `src/data/bets.ts` — each of the 4 players' real predicted finishing order
  (transcribed from `src/data/Sheet 1-Table 1.csv`), as an array of team ids,
  index 0 = predicted champion.
- `src/data/standings.json` — the live table, same team-id space as the bets.
  Currently holds a **real snapshot pulled locally** (matchday 2 of the
  2026-27 season) — not yet kept fresh automatically, since the GitHub
  Actions pipeline isn't running yet. Will go stale until either the pipeline
  is wired up or `yarn fetch:standings` is re-run manually.
- `src/lib/scoring.ts` — the real scoring rules: for each team, points are
  awarded by how many spots off its predicted position was from its actual
  position — exact match 6, 1 off 4, 2 off 3, 3 off 2, 4 off 1, 5+ off 0.
  Exports `scorePredictionRows` (per-team breakdown, used for cell tints) and
  `scoreAllPlayers` (totals + ranking).
- `src/types.ts` — `Team`, `PlayerBet`, `StandingsEntry`, `ScoreResult`.

All three (`teams.ts`, `bets.ts`, `standings.json`) share the same `tla`-based
team id scheme — keep them consistent if anything changes.

## Frontend

`src/App.tsx` renders one merged table (via `LeagueTable`) next to a Ranking
panel, side by side above ~1024px and stacked below it.

- `src/components/LeagueTable.tsx` — a single table: columns are `#`,
  Standings, then one column per player (Dean, Nehad, Dave, Stu). Each row is
  a table position; the Standings column shows the actual team, each player
  column shows their prediction for that position.
  - Prediction cells are tinted by points earned for that pick, one accent
    hue per tier: 6→spring-green, 4→turquoise, 3→strong-cyan, 2→blue-green,
    1→blue-slate, 0→no tint (untinted cells blend into the page background).
  - Hover: hovering a non-Standings cell outlines just that cell. Hovering the
    Standings cell in any row outlines the whole row — done via CSS
    `:has()` (Tailwind's `has-[.standings-cell:hover]:` variant) rather than
    JS state, since it's a pure visual effect.
- `src/components/TeamCell.tsx` — renders a team's logo + name. Logo path is
  `${import.meta.env.BASE_URL}logos/{teamId}.svg` — **must** go through
  `BASE_URL` rather than a hardcoded `/logos/...`, since `vite.config.ts` sets
  a non-root `base` for GitHub Pages and a literal absolute path 404s under
  that base. Logo files live in `public/logos/{TLA}.svg` (e.g. `MCI.svg`);
  missing files fail silently via `onError` (hides the broken-image icon).
  All 20 are currently in place.
- `src/components/ThemeToggle.tsx` — light/dark toggle button. Defaults to
  system preference (`prefers-color-scheme`), then persists an explicit
  choice to `localStorage` and sets `data-theme` on `<html>`, which overrides
  the system preference either way.

### Theming (`src/index.css`)

Colors are defined once via Tailwind v4's `@theme` block (which auto-generates
utility classes like `bg-surface`, `text-fg`, `border-line`) and re-pointed
for dark mode by overriding the same CSS custom properties under
`@media (prefers-color-scheme: dark)` and `:root[data-theme='dark']` — so
light/dark works with plain Tailwind utility classes, no `dark:` variants
needed anywhere.

- Neutral scheme (`surface`, `fg`, `fg-strong`, `line`) is built on the
  `blue-slate` palette.
- Five accent palettes are registered for the score-tint gradient:
  `blue-slate`, `blue-green`, `strong-cyan`, `turquoise`, `spring-green`
  (each 50–950). These are also available generally for any future accent
  use — only one shade of each (500, at varying opacity) is used today.

**Tailwind gotcha hit during development:** class names must appear as
literal, complete strings somewhere in the source — Tailwind's build-time
scanner does static text matching, it does not execute JS. Building a class
name by concatenating a variant and a utility from separate variables (e.g.
a `withVariant(variant)` helper) means the full string never appears literally
in the file, so Tailwind silently generates nothing for it. Always write
full class names out directly, even if repetitive.

## Commands

- `yarn dev` — start dev server
- `yarn build` — typecheck + production build
- `yarn lint` — run oxlint
- `yarn preview` — preview production build
- `yarn fetch:standings` — run the standings fetch script locally (needs
  `FOOTBALL_DATA_API_KEY` set in the environment — see below)

## Setup still needed

- [x] `scripts/fetch-standings.mjs` briefly had the real football-data.org API
      key hardcoded directly in the file (temporary, for local testing before
      git existed) — fixed, it now reads from
      `process.env.FOOTBALL_DATA_API_KEY` again.
- [ ] `git init`, create the GitHub repo (private, named
      `premier_league_table_bet` — `vite.config.ts`'s `base` and
      `package.json`'s `name` are already set to match), and push.
- [ ] Add the API key as a GitHub repo secret named `FOOTBALL_DATA_API_KEY`.
- [ ] Enable GitHub Pages for the repo with source "GitHub Actions".
- [ ] Walk through and test the `fetch-standings.yml` / `deploy.yml` workflow
      pipeline end-to-end (deferred earlier — user wanted this explained
      rather than just set up silently).
