# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status

Implementation in progress (plan.md milestones). M0 (foundations + spike, see `docs/m0-spike-report.md`) and M1 (indexer, auth, home, diagnostics, file routes) are done; Mail (M2) is next. The app is a self-hosted Google Takeout viewer (Next.js + shadcn/ui, run via Docker or `pnpm start`). The design lives in docs that are the source of truth; read them before building:

- `intent.md`: the problem, scope and decisions.
- `plan.md`: milestones M0–M7, the file layout (`server/`, `columns/`, `components/common|data-table|skeletons`, `stores/`) and the verification checks; start at M0 (feasibility spike) and stop for owner review after it.
- `spec.md`: requirements, design decisions, edge cases, acceptance criteria, and facts measured from a real 45GB export. Follows the AI-native SDLC chain (`intent.md` → `spec.md` → `plan.md`); `plan.md` is drafted; code should not start until it is approved. Each file's `Status:` footer says whether it is still draft.

## Commands

Package manager is pnpm.

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest), `pnpm check:conventions` (fails on convention violations, see below)
- Single test: `pnpm exec vitest run tests/unit/auth.test.ts` (or `-t "name"`)
- `pnpm index`: run the indexer once (scans `TAKEOUT_DIR`, writes the SQLite index in `DATA_DIR`). The Home page's "Index now" button spawns the same CLI.
- Config comes from `.env.local` (gitignored): `TAKEOUT_DIR` (read-only export folder) and `DATA_DIR` (index, thumbnails, `auth.json`). Tests use the synthetic fixture in `tests/fixture/generate.ts`, never the real export.
- No e2e runner yet (Playwright planned for M7).

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
- Every table uses the single TanStack `components/data-table/data-table.tsx`; column defs live only in `columns/<table>.column.ts`.
- Formatters (date, time, currency, bytes…) only in `lib/helper.ts`; all static arrays/numbers/JSON only in `lib/constant.ts`.
- Every route has a page-shaped skeleton `loading.tsx` (shadcn `Skeleton`), never a progress bar.
- Desktop/laptop only: below `lg` the app shows a block screen.

## Gotchas

- **This is a newer Next.js (16.x, React 19).** Middleware is now `proxy.ts`. Check `node_modules/next/dist/docs/` before using any API from memory; the docs are organized under `01-app/` (getting-started, guides, api-reference). The Range/streaming behavior of Route Handlers was not confirmed in the docs and must be verified early.
- **shadcn is configured with the `radix-mira` style** (`components.json`, alias `@/components`, `@/lib`, Tailwind v4 with CSS variables in `app/globals.css`). Add components with the shadcn CLI/skill rather than hand-writing them. `.claude/skills/` and `.agents/skills/` contain the shadcn skills, locked in `skills-lock.json`.
- **Real export quirks that will break naive parsers:** Chat `created_date` is a localized string whose AM/PM separator is U+202F; Chat DM folder names are opaque IDs (titles come from `group_info.json`); Photos sidecars are `X.jpg.json` with truncated names; only English folder names are supported.
- **Never put real export content in fixtures, tests, docs or logs.** The export contains live credentials (e.g. the Keep "Passwords" note) and other people's data.
