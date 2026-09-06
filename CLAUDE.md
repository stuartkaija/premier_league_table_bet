# Premier Table Game

A tracker for a bet between the user (Stu) and 3 friends (Dean, Nehad, Dave):
everyone predicted the final Premier League table order for the 2026-27
season, and this app tracks live standings against those predictions, scores
them, and ranks the players.

**Live** at `https://stuartkaija.github.io/premier_league_table_bet/`
(repo: `stuartkaija/premier_league_table_bet`, public — required so the raw
standings file is fetchable without auth, see Architecture).

## Stack

- React 19 + TypeScript
- Vite 8 (dev server, build)
- Tailwind CSS v4 (via `@tailwindcss/vite`) — all component styling is
  Tailwind utility classes in JSX; there are no other CSS files besides
  `src/index.css`. Light mode only (no dark mode / toggle).
- Oxlint (linting)
- Yarn Berry (pinned via `packageManager` in `package.json`, currently
  `yarn@3.5.0`) — see the Yarn gotchas below before touching CI.
- Hosting: GitHub Pages, deployed via GitHub Actions — **live**.
- Live data: [football-data.org](https://www.football-data.org/) (free tier)

## Architecture

The live table is **never fetched from the browser at the API level** — the
API key stays server-side, and only one scheduled job hits football-data.org
rather than every visitor:

1. `.github/workflows/fetch-standings.yml` runs on a schedule (every 3h) and
   on manual dispatch. It runs `scripts/fetch-standings.mjs`, which calls the
   football-data.org standings endpoint using the `FOOTBALL_DATA_API_KEY`
   repo secret, and writes the result to `src/data/standings.json`.
2. If that file changed, the workflow commits and pushes it to `main`.
3. **The frontend fetches that committed file at runtime**, directly from
   `raw.githubusercontent.com/stuartkaija/premier_league_table_bet/main/src/data/standings.json`
   (see `App.tsx`) — it is *not* imported at build time. This means standings
   updates show up on a page refresh with no rebuild/redeploy required.

`.github/workflows/deploy.yml` (build + deploy to Pages) only runs on pushes
to `main` or manual dispatch — i.e. only when app code actually changes. It
deliberately does **not** run in response to `fetch-standings.yml`; that
would rebuild and redeploy identical code just because data changed, which
is unnecessary now that the frontend fetches data independently.

Players' bets are static/locked for the season, so they live in a plain data
file (`bets.ts`) rather than any storage layer. The whole app is otherwise
100% static — no backend, no database.

### Gotchas hit getting the pipeline live (useful if CI breaks again)

- **Yarn Berry vs. Yarn Classic**: CI has no way to know you're using Yarn
  Berry (v3+) unless told. Without a `packageManager` field, GitHub's runner
  falls back to the ancient bundled Yarn Classic (v1), which can't even parse
  a Berry-generated `yarn.lock` — every install fails instantly with "lockfile
  needs to be updated". Fixed via `"packageManager": "yarn@3.5.0"` in
  `package.json` plus a `corepack enable` step before `actions/setup-node` in
  `deploy.yml`.
- **Yarn Berry's PnP linker breaks TypeScript on CI**: locally, `yarn` used a
  normal `node_modules` folder — but that turned out to be from a *personal,
  machine-global* `~/.yarnrc.yml` (`nodeLinker: node-modules`), which
  obviously doesn't exist on a fresh CI runner. Without it, Yarn Berry
  defaults to its PnP linker, which doesn't produce a real `node_modules`,
  breaking `tsc`'s `types: ["vite/client"]` / `types: ["node"]` resolution.
  Fixed with a **project-level** `.yarnrc.yml` setting the same option, so
  it's reproducible everywhere, not dependent on any one machine's config.
- **A bot-authenticated push doesn't trigger other workflows**: pushes made
  from *within* a workflow run using the default `GITHUB_TOKEN` are
  deliberately excluded from triggering other workflows' `on: push` (GitHub's
  anti-loop protection). This is why `fetch-standings.yml` committing new
  data never used to trigger `deploy.yml`. Worth remembering if any future
  workflow needs to react to another workflow's commit — the fix is a
  `workflow_run` trigger (or a PAT instead of the default token), not `push`.
  Not currently in use, since the runtime-fetch architecture above removed
  the need for it entirely.

## Data flow

- `src/data/teams.ts` — the real 20 clubs for the season, confirmed against a
  live API pull. `id` is each club's football-data.org `tla` (e.g. `MCI`,
  `ARS`), matching `standings.json`.
- `src/data/bets.ts` — each of the 4 players' real predicted finishing order
  (originally transcribed from a CSV, since deleted), as an array of team
  ids, index 0 = predicted champion.
- `src/data/standings.json` — the live table, same team-id space as the bets.
  Kept fresh by `fetch-standings.yml`; fetched by the frontend at runtime
  (see Architecture) rather than imported.
- `src/lib/scoring.ts` — the real scoring rules: for each team, points are
  awarded by how many spots off its predicted position was from its actual
  position — exact match 6, 1 off 4, 2 off 3, 3 off 2, 4 off 1, 5+ off 0.
  Exports `scorePredictionRows` (per-team breakdown, used for cell tints) and
  `scoreAllPlayers` (totals + ranking).
- `src/types.ts` — `Team`, `PlayerBet`, `StandingsEntry`, `ScoreResult`.

All three (`teams.ts`, `bets.ts`, `standings.json`) share the same `tla`-based
team id scheme — keep them consistent if anything changes.

## Frontend

`src/App.tsx` fetches standings on mount (`useEffect` + `fetch`, with
loading/error states), then renders one merged table (via `LeagueTable`)
next to a Ranking panel, side by side above ~1024px and stacked below it.
Because the data is fetched asynchronously, all derived data (sorted
standings, per-pick points, table rows, rankings) is computed inside the
component body rather than at module scope — it doesn't exist until the
fetch resolves.

- `src/components/LeagueTable.tsx` — a single table: columns are `#`,
  Standings, then one column per player (Dean, Nehad, Dave, Stu). Each row is
  a table position; the Standings column shows the actual team, each player
  column shows their prediction for that position.
  - Prediction cells are tinted by points earned for that pick, one accent
    hue per tier: 6→spring-green, 4→turquoise, 3→strong-cyan, 2→blue-green,
    1→blue-slate, 0→no tint (untinted cells blend into the page background).
  - Hover: hovering any cell in a row outlines the whole row (plain
    `hover:outline-*` on the `<tr>` — hover state bubbles up from any child
    cell natively, so no JS state or `:has()` trickery is needed).
- `src/components/TeamCell.tsx` — renders a team's logo + name. Logo path is
  `${import.meta.env.BASE_URL}logos/{teamId}.svg` — **must** go through
  `BASE_URL` rather than a hardcoded `/logos/...`, since `vite.config.ts` sets
  a non-root `base` for GitHub Pages and a literal absolute path 404s under
  that base. Logo files live in `public/logos/{TLA}.svg` (e.g. `MCI.svg`);
  missing files fail silently via `onError` (hides the broken-image icon).
  All 20 are currently in place.

## Theming (`src/index.css`)

Light mode only — colors are defined once via Tailwind v4's `@theme` block
(which auto-generates utility classes like `bg-surface`, `text-fg`,
`border-line`). No dark mode, no toggle, no `data-theme` handling.

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
  `FOOTBALL_DATA_API_KEY` set in the environment)

## Next steps

- [ ] **Error handling** — `App.tsx` currently shows a bare
      "Couldn't load standings: ..." message if the runtime fetch fails.
      Needs a real look: better styling, maybe a retry action.
- [ ] **Styling and color-coding of points** — revisit the score-tint visual
      design in `LeagueTable.tsx` / `index.css`.
- [ ] **Ranking panel position** — reconsider where the Ranking panel sits
      relative to the main table.
- [ ] **Tablet/mobile view** — currently only has one breakpoint (stacks
      vertically under ~1024px); needs real small-screen design, not just a
      stacked fallback of the desktop layout.

## Working agreement

- The user runs all `git` commands themselves (`git commit`, `git push`,
  etc.) — make file changes and hand back the exact commands to run, don't
  execute them.
