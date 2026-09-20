# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status

Milestones M0–M6 of plan.md are implemented: every module has a page (Mail, Chat, Calendar incl. the multi-calendar overlay grid, Drive, Contacts, Keep, Tasks, Photos, Groups, YouTube, and the generic "Other data" browser). **M7 is done except the optional Typesense provider** (Dockerfile/compose, README, MIT license, Playwright smoke test in `e2e/`, `docs/security-review.md`). Measurements from the real export are in `docs/m0-spike-report.md`. The design docs remain the source of truth; read them before changing behavior:

- `intent.md`: the problem, scope and decisions.
- `spec.md`: requirements, design decisions, edge cases, acceptance criteria, and facts measured from a real 45GB export.
- `plan.md`: milestones M0–M7, file layout and verification checks.

## Commands

Package manager is pnpm.

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest), `pnpm check:conventions` (fails on convention violations, see below)
- Single test: `pnpm exec vitest run tests/unit/auth.test.ts` (or `-t "name"`)
- `pnpm index`: run the indexer once (scans `TAKEOUT_DIR`, writes the SQLite index in `DATA_DIR`). The sidebar's "Reindex" button spawns the same CLI (`server/indexer/spawn.ts`, via `tsx` from `node_modules`).
- Config comes from `.env.local` (gitignored): `TAKEOUT_DIR` (read-only export folder) and `DATA_DIR` (index, thumbnails, `auth.json`). Tests use the synthetic fixture in `tests/fixture/generate.ts`, never the real export.
- `pnpm test:e2e`: Playwright smoke test (`e2e/`, `playwright.config.ts`); it starts `pnpm start` on port 3210 with a synthetic fixture and a temp data dir, so run `pnpm build` first. For a production build next to a running dev server: `NEXT_DIST_DIR=.next-build pnpm build` (then `git checkout tsconfig.json`; Next rewrites its `include`), and `NEXT_DIST_DIR=.next-build pnpm test:e2e`.
- `.env.example` documents `TAKEOUT_DIR`, `DATA_DIR`, `ALLOWED_HOSTS` (`.gitignore` re-includes it despite `.env*`).
- Docker: `TAKEOUT_DIR=… docker compose up --build`. The image keeps `node_modules` and sources (not Next standalone) because the server spawns the indexer with `tsx`; `serverExternalPackages` covers the native modules.

## Architecture decisions that span the codebase (from spec.md)

- **Read-only input, separate writable state.** The Takeout folder is mounted read-only (`TAKEOUT_DIR`, `/takeout` in Docker); all derived data (SQLite index, thumbnails, `auth.json`) goes to `DATA_DIR` (`/data`). Nothing may ever write under the Takeout folder.
- **Separate indexer process.** A worker scans the Takeout tree and writes SQLite (WAL + FTS5, `better-sqlite3`); the Next.js server only reads it. Everything must stream: no large file (a 4.7GB mbox, 27MB `.ics`, multi-GB videos) is ever loaded into memory. The indexer is incremental and resumable, keyed by `(relative path, size, mtime)`.
- **Mail is offset-indexed.** The index stores byte offset and length per message in the mbox; bodies and attachments are parsed lazily by ranged read. The mbox stays the source of truth.
- **IDs, never paths.** The browser only sees opaque IDs; the server resolves them to files and `realpath`-checks containment under the mount root. Media and download routes must support HTTP `Range`.
- **Auth and host checks.** First-run "set a password" screen, scrypt hash in `/data/auth.json`, session cookie. `proxy.ts` validates `Host`/`Origin` and gates routes, but each route handler must re-check the session too (proxy is not the security boundary).
- **Untrusted content.** HTML (email, Keep, Groups) renders only in a sandboxed iframe with strict CSP and remote content blocked by default. Drive is download-only except images and videos (no docx/pdf/xlsx rendering libraries). No runtime network calls or CDN assets.
- **Search behind a `SearchProvider` interface.** SQLite FTS5 is the default; Typesense is an optional compose-profile add-on.
- **Priorities.** P0: Mail, Chat, Calendar (agenda), Drive list and search. P1: the multi-calendar overlay grid (the USP). P2: everything else.

## Code conventions (owner-mandated; details and enforcement in plan.md)

- No client-side API calls: data comes from Server Components, Server Functions, or a Zustand store. Only exception: `media`/`thumb`/`download` Route Handlers, which serve bytes to `<img>`/`<video>`/download links.
- Reuse generic components (`components/common/`); use shadcn components and check the shadcn skill/`docs` before writing UI.
- Every table uses the single TanStack `components/data-table/data-table.tsx`; column defs live only in `columns/<table>.column.tsx`.
- Formatters (date, time, currency, bytes…) only in `lib/helper.ts`; all static arrays/numbers/JSON only in `lib/constant.ts`.
- Every route has a page-shaped skeleton `loading.tsx` (shadcn `Skeleton`), never a progress bar.
- Desktop/laptop only: below `lg` the app shows a block screen.

## Design system

The UI follows a Claude Design handoff (reference copy in `design/`, git-ignored; its source of truth is `design/project/Takeout Viewer.dc.html`). Rules that matter when changing UI:

- **All colours are tokens in `app/globals.css`** (light + `.dark`): `--bg/--panel/--surf/--line/--line2/--ink/--ink2/--mute/--faint/--acc/--accbg/--sel/--hov/--ok`, module chips `--k-<kind>-bg/fg`, calendar palette `--cal-1..12`, stack ramp `--stack-1..5`, `--on-acc`, `--scrim`. They map onto shadcn's semantic tokens and are exposed as Tailwind colours (`bg-panel`, `text-faint`, `border-line2`, `bg-acc`...). No colour literals in code: `pnpm check:conventions` (rule E9) fails on them (only generated `components/ui/` and the isolated email iframe document are exempt).
- Fonts are IBM Plex Sans/Mono (`font-sans`, `font-mono`); labels are mono, uppercase, tracked (`font-mono text-[9.5px] tracking-[.16em] uppercase text-faint`).
- Shell = floating sidebar card + 42px top bar (`components/layout/`); pages fill the area under it (`h-full`, scroll inside). Pages set the breadcrumb with `<Crumb value="Mail / Inbox" />`.
- Reuse: `ModuleHeader`/`TablePage` (title + mono sub + controls), `OptionGroup`/`UrlOptionGroup` (pills, tabs, segments), `SearchInput`, `SortChips`, `UrlPagination`, `DataTable` (design table look), `KindChip`.

## Gotchas

- **Branding:** the app is called TakeoutLens (`APP_NAME` in `lib/constant.ts`). Logos are `public/brand/icon.png` (sidebar, lock screen) and `app/icon.png` (favicon); `proxy.ts` excludes `/brand/` and `/icon.png` from its session redirect so the lock screen can load them. Any new asset shown before login must be added to that matcher.
- **CI:** `.github/workflows/docker-publish.yml` publishes the multi-arch image on `v*` tags; it needs the `DOCKERHUB_USERNAME` variable and `DOCKERHUB_TOKEN` secret.

- **Index database:** never delete only `index.db-wal`/`-shm` while a server is running; to reset, delete all three `index.db*` files and run `pnpm index` (it is derived data; sessions live in it, so everyone is logged out; `auth.json` is separate). `getDb()` reopens when the schema version or the file's inode changes, so hot reload picks up new migrations.
- **Adding a table or index:** append a new string to `MIGRATIONS` in `server/db/schema.ts` (never edit old ones) and register a per-module indexer in `server/indexer/run.ts`. Small modules (contacts, keep, tasks, youtube, groups metadata, browse) parse their files on demand instead.
- **Charts:** the Home storage donut uses shadcn `chart` (Recharts). Colours must be CSS variables (`STORAGE_SEGMENT_COLORS`), never literals; set an explicit `size-*` on `ChartContainer` and `isAnimationActive={false}` on `Pie`, otherwise it renders oversized/blank.
- **Flip `built: true`** on a module in `lib/constant.ts` when its page ships (module cards only link built modules).
- **Browser testing of the dev server:** a background tab throttles React effects/hydration, so screenshots can show the pre-hydration state; take a screenshot/interaction first and re-check before assuming a bug.

- **This is a newer Next.js (16.x, React 19).** Middleware is now `proxy.ts`. Check `node_modules/next/dist/docs/` before using any API from memory; the docs are organized under `01-app/` (getting-started, guides, api-reference). The Range/streaming behavior of Route Handlers was not confirmed in the docs and must be verified early.
- **shadcn is configured with the `radix-mira` style** (`components.json`, alias `@/components`, `@/lib`, Tailwind v4 with CSS variables in `app/globals.css`). Add components with the shadcn CLI/skill rather than hand-writing them. `.claude/skills/` and `.agents/skills/` contain the shadcn skills, locked in `skills-lock.json`.
- **Real export quirks that will break naive parsers:** Chat `created_date` is a localized string whose AM/PM separator is U+202F; Chat DM folder names are opaque IDs (titles come from `group_info.json`); Photos sidecars are `X.jpg.json` with truncated names; only English folder names are supported.
- **Never put real export content in fixtures, tests, docs or logs.** The export contains live credentials (e.g. the Keep "Passwords" note) and other people's data.
