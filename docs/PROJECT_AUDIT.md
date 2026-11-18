# Roamigo — Milestone 0 Repository & Infrastructure Audit

**Baseline Commit Audited:** `b506a9a` (`HEAD -> master`, matching `origin/main` on `git@github.com:yyhJohn/Roamigo.git`, preserved via tag `v0.1.0-hackathon`)  
**Audit Date:** 2026-11-18  
**Product Name:** Roamigo (*Less Arguing, More Wandering.*)

---

## 1. Historical Hackathon Baseline (Preserved Context)

The repository began as a focused single-page group travel consensus MVP governed by `AGENTS.md` (originally titled `# Project: TripConsensus`, branded in UI and `package.json` as `Roamigo`):
- **Original MVP Scope (AC1–AC5):**
  - **AC1:** Add/remove travellers with individual budgets, interests, and preferences on one page.
  - **AC2:** Inline Zod validation errors without clearing existing form inputs.
  - **AC3:** Day-by-day Gemini-generated itinerary with activities, `"est."` costs, and compromise explanations.
  - **AC4:** Per-traveller activity voting (`up` / `down` / toggle off) with immediate tally updates and duplicate-vote prevention.
  - **AC5:** Include/exclude activity toggles immediately recalculating per-person estimated cost and individual budget overage warnings.
- **Original MVP Constraints (`AGENTS.md`):** React + TypeScript strict mode (`no-explicit-any`), Vite, Tailwind CSS v4, Express, Gemini structured JSON validated with Zod, `localStorage` persistence (no database/auth in MVP), `< 200` lines per source file (excluding blanks/comments via ESLint `max-lines`), deterministic TypeScript math for budgets/votes, and server-side API credentials only.

---

## 2. Current Checkout Inventory & Verification

All 47 tracked files in `b506a9a` were inspected directly (not assumed from archives):

### 2.1 Baseline Quality Gates (Executed on Current Checkout)

| Check | Command | Exit Code | Observed Result |
| :--- | :--- | :--- | :--- |
| ESLint (`max-lines` + `no-explicit-any`) | `npm run lint` | `0` | **PASS** — zero warnings or errors across `src/` and `server/` |
| TypeScript Strict Check | `npm run typecheck` | `0` | **PASS** — `tsc --noEmit` (client) & `tsc -p tsconfig.server.json --noEmit` (server) |
| Unit & API Integration Suite | `npm run test` | `0` | **PASS** — `5` test files (`schemas`, `resilience`, `budget`, `voting`, `api/itinerary`), `25` tests passed in `2.34s` |
| Production Build | `npm run build` | `0` | **PASS** — Vite bundle (`227.87 kB` JS, `20.15 kB` CSS) + compiled server in `dist-server/` |
| Browser E2E Suite (Chrome) | `npm run test:e2e` | `0` | **PASS** — `4` Playwright specs passed in `7.0s` (AC1/AC2, corrupted `localStorage` recovery, AC3 `503` unconfigured credential state, AC3/AC4/AC5 fixture workflow) |

### 2.2 Specific Architectural & Configuration Findings

1. **Gemini Timeout & Request Lifecycle (`server/config.ts`, `server/services/gemini.ts`, `src/lib/api.ts`):**
   - `server/config.ts` sets `AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? '30000')` (`30,000 ms` default).
   - `server/services/gemini.ts` wires an `AbortController` timer (`setTimeout(() => controller.abort(), config.aiTimeoutMs)`) into `ai.models.generateContent({ config: { abortSignal: controller.signal } })`, normalizing `AbortError` into `UpstreamTimeoutError` (HTTP `504`).
   - **Gaps identified:** `AI_TIMEOUT_MS` is missing from `.env.example`; `src/lib/api.ts` lacks client-side `AbortSignal` cancellation and bounded retry/backoff; AI logic is coupled directly to `@google/genai` with no multi-provider interface.
2. **Credential Handling (`server/config.ts`, `.env.example`, `server/app.ts`):**
   - Server loads `.env` via `dotenv`. Supports `GEMINI_API_KEY` (`provider: 'gemini-api'`) or `GCP_PROJECT_ID` + `GCP_LOCATION` (`provider: 'vertex-ai'`), plus `GEMINI_MODEL`.
   - Zero secrets or `.env` files exist in Git history or working tree. In this environment, no `.env` is provisioned and ambient GCP ADC lacks `aiplatform.endpoints.predict` (`HTTP 403`), so `/api/health` accurately reports `{"ok":true,"aiConfigured":false,"provider":"unconfigured"}`.
3. **Currency Support & Financial Precision (`src/lib/schemas.ts`, `src/lib/budget.ts`):**
   - Supports `GBP` (`£`), `USD` (`$`), and `EUR` (`€`) via `CurrencySchema`.
   - **Gap identified:** Costs and budgets currently use IEEE-754 floating-point numbers (`Math.round(amount * 100) / 100`). Production expense splitting and settlements require **integer minor units** (pence/cents, e.g., `£12.50 -> 1250`) so splits reconcile to the exact cent with zero floating-point drift.
4. **Persistence Schema (`src/lib/storage.ts`, `src/lib/schemas.ts`):**
   - Uses browser `localStorage` key `'roamigo:v1:trip'` validated via `PersistedTripStateSchema` (`{ trip, travellers, itinerary, votes }`) with explicit `StorageLoadResult` / `StorageWriteResult` warnings.
   - **Gap identified:** Single-trip, single-browser storage with no user accounts, relational persistence, RBAC, multi-version itineraries, or cross-device sync. Requires a validated `roamigo:v1:trip` import endpoint into PostgreSQL.
5. **Agent Customisations & Hook Execution Paths (`.agents/`):**
   - `.agents/skills/verify-roamigo/SKILL.md`: Well-structured AC1–AC5 release workflow.
   - `.agents/hooks.json`: Configures `PostToolUse` (`write_file|edit_file`) with `"command": "node ./scripts/check-line-limit.mjs"`. Per Antigravity's hook specification, hooks execute with `cwd` set to the directory containing `hooks.json` (`.agents/`), so `./scripts/check-line-limit.mjs` resolves accurately to `/home/hacksday/projects/my-app/.agents/scripts/check-line-limit.mjs`.
   - **Subtle discrepancy identified:** `check-line-limit.mjs` counts raw physical lines (`split('\n').length > 200`), whereas `eslint.config.js` configures `max-lines: 200` with `skipBlankLines: true, skipComments: true`. Keeping source files `<= 200` physical lines satisfies both gates simultaneously; we will also align the hook script with ESLint's non-blank/non-comment rule once approved.
6. **Minor Repository Hygiene Note:**
   - `.gitignore` currently lists `node_modules`, `dist`, `dist-server`, `.env`, `.env.*` (`!.env.example`), and `*.log`, **but omits `test-results/`, `playwright-report/`, and `coverage/`**—Playwright runs leave an untracked `test-results/` folder unless manually removed.

---

## 3. Implemented vs. Missing Production Capabilities

| Capability Area | Current MVP Status | Production Target Status |
| :--- | :--- | :--- |
| Trip & Traveller Preferences + Zod Validation | **Implemented** (single trip, 5 fields) | Expand to 10-step Create Trip Wizard + draft save/resume |
| Deterministic Activity Voting & Budget Warnings | **Implemented** (client-side state) | Upgrade to PostgreSQL unique constraints, integer minor units & Socket.IO sync |
| Gemini Structured Itinerary Generation | **Implemented** (`@google/genai` only) | Multi-provider abstraction (`Gemini API`, `Vertex AI`, `OpenAI`, `OpenAI-compatible`) + AI before/after diff assistant |
| User Accounts, Sessions & RBAC (`Owner`/`Editor`/`Member`/`Viewer`) | **Missing** (prohibited in MVP `AGENTS.md`) | Full cookie-session auth, password reset, invitations & server-enforced RBAC |
| PostgreSQL + Prisma Relational Storage | **Missing** (`localStorage` only) | 18-entity relational schema, migrations, seed data & MVP `localStorage` importer |
| Public Landing Page, My Trips Dashboard & Exports | **Missing** | Marketing landing page, multi-trip dashboard, JSON/PDF-print/ICS/CSV exports & account deletion |
| Interactive Map (`MapLibre GL JS`) | **Missing** | Real coordinates, day filters, marker-card sync, tile attribution & graceful geocoder fallback |
| Expense Ledger, Splitting & Settlements | **Missing** (estimated activity costs only) | Planned vs. actual expenses, equal/custom/percentage splits & exact minor-unit settlements |
| Docker, Nginx & GitHub Actions CI | **Missing** | Multi-stage `Dockerfile`, `docker-compose.yml`, `nginx.conf` & `.github/workflows/ci.yml` |

---

## 4. Host Infrastructure & Operational Readiness Audit

Inspected directly on the development machine (`linux`, Node `v22.22.1`, npm `9.2.0`):
- **Available out-of-the-box:** Docker Engine `29.1.3` (`docker` CLI connected to active daemon), PostgreSQL client `/usr/bin/psql`, Google Chrome (headless & viewport testing), `sqlite3`, Git + authorised SSH deploy key to `git@github.com:yyhJohn/Roamigo.git`.
- **Not pre-installed on host:** `docker compose` CLI plugin (`docker-compose`), native host `postgres` daemon, `redis-server`, `nginx` binary.
- **Practical DevOps Strategy:**
  - Run **PostgreSQL 16** locally in Docker (`postgres:16-alpine` on `127.0.0.1:5432`) during development and integration/E2E testing—zero external paid cloud database required.
  - Provide complete, standards-compliant `Dockerfile`, `docker-compose.yml`, and `deploy/nginx/roamigo.conf` for production/VPS deployment.
  - **Skip Redis initially** (per Section 5 guidance): single-instance Socket.IO rooms + PostgreSQL transactional state + in-memory rate-limiting cleanly satisfy all functional requirements without unnecessary infrastructure complexity.
