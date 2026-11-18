# Roamigo — Production Implementation Plan (`Milestones 0–11`)

---

## 1. Scope & `AGENTS.md` Governance Changes Requiring Approval

Before modifying any application code (`src/`, `server/`, `package.json`, or `AGENTS.md`), please review and approve these intentional production evolutions from the original hackathon MVP:

| Area | Original Hackathon MVP (`v0.1.0-hackathon`) | Proposed Production Platform (`v1.0`) |
| :--- | :--- | :--- |
| **Persistence & Auth** | Single-trip `localStorage` only; no database or auth | PostgreSQL 16 + Prisma ORM + secure `HttpOnly` cookie sessions, RBAC (`Owner`/`Editor`/`Member`/`Viewer`), plus `roamigo:v1:trip` importer |
| **Financial Arithmetic** | Floating-point JS numbers (`Math.round(x * 100) / 100`) | Integer minor units (`pence`/`cents`) across DB, API, budgets, splits & settlements |
| **AI Architecture** | Direct `@google/genai` call (`30s` timeout) | Multi-provider adapter (`Gemini API`, `Vertex AI`, `OpenAI`, `OpenAI-compatible`), `30s` default timeout preserved, staged Before/After AI diff proposals |
| **Frontend Surface** | Single-page 2-column form + itinerary card list | 11-area responsive SPA (Landing, Auth, My Trips, 10-Step Wizard, 3-Panel Workspace + MapLibre + AI Assistant, Voting, Budgets/Expenses, Settings & Exports) |
| **Preserved Rules** | Strict TS (`no-explicit-any`), `< 200` lines (`max-lines`), Zod boundary validation, deterministic math, server-only secrets, AC1–AC5 | **100% Preserved & Enforced** (including aligning `.agents/scripts/check-line-limit.mjs` with ESLint `max-lines`) |

### New Dependencies & Written Justification (to record in `AGENTS.md` & commits)
- **Frontend:** `react-router-dom` (SPA routing), `@tanstack/react-query` (server state, caching, cancellation & refetch), `zustand` (lightweight UI panel/selection state), `react-hook-form` + `@hookform/resolvers` (10-step wizard & accessible forms), `@radix-ui/*` + `class-variance-authority` + `clsx` + `tailwind-merge` (`shadcn/ui` accessible primitives), `lucide-react` (icons), `motion` (restrained reduced-motion-safe transitions), `recharts` (budget/expense visualisations), `maplibre-gl` (verified interactive maps).
- **Backend & Realtime:** `prisma` + `@prisma/client` (PostgreSQL ORM & migrations), `cookie-parser` + `helmet` + `express-rate-limit` (session cookies, HTTP security headers & rate limiting), `socket.io` + `socket.io-client` (authenticated real-time room sync).

---

## 2. External Credentials, Infrastructure Complexity & Risk Matrix

| Dependency / Service | Status in Current Environment | Production Handling & Fallback Strategy |
| :--- | :--- | :--- |
| **PostgreSQL 16** | Docker Engine `29.1.3` & `/usr/bin/psql` verified active on host | Run `postgres:16-alpine` container locally for dev, integration & Playwright tests; ship `docker-compose.yml` for 1-command startup. |
| **AI Credentials (`GEMINI_API_KEY` / `OPENAI_API_KEY` / Vertex)** | Unconfigured in `.env`; ambient Vertex ADC returns `403` | Multi-provider config in `.env.example`; `/api/health` reports `aiConfigured` & `provider`; mocked unit/integration/E2E suites separated cleanly from opt-in live AI tests; existing trip state preserved on `503`/`504`. |
| **Map Tiles & Geocoding** | OpenFreeMap / OSM raster-vector tiles accessible over HTTPS | Configurable `GEOCODING_PROVIDER` + curated verified coordinates for major destinations; never fabricate coordinates when offline/unconfigured. |
| **SMTP Email / Google OAuth** | Not provisioned in local sandbox | Optional env-driven integrations (`SMTP_HOST`, `GOOGLE_CLIENT_ID`); password reset & invite links work deterministically via signed token URLs in dev/test mode without external mail relays. |

---

## 3. Milestone-by-Milestone Execution Roadmap

All development happens on branch **`develop`** (preserving `main` at tag `v0.1.0-hackathon` until explicit release merge approval in Milestone 11). Every source file remains `< 200` non-blank/non-comment lines.

### Milestone 0 — Repository Audit & Planning *(Current Checkpoint — Complete)*
- Audit repo, hooks, timeouts, credentials, baseline gates, and Docker/host readiness.
- Author `PROJECT_AUDIT.md`, `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `UI_DESIGN.md`, `IMPLEMENTATION_PLAN.md`, and `PROGRESS.md`.
- Tag `b506a9a` as `v0.1.0-hackathon`, commit Milestone 0 docs to `develop`, push to `origin/develop`, and pause for human approval.

### Milestone 1 — Design System, Tokens & Responsive App Shell
- Update `AGENTS.md` and `.gitignore` (`test-results/`, `playwright-report/`, `coverage/`) per approved plan; align `.agents/scripts/check-line-limit.mjs`.
- Establish semantic Light/Dark CSS tokens (`#103D3B`, `#A7F3CF`, `#F7F9F6`, `#FFFFFF`, `#17302D`, `#64748B`, `#D97706`, `#DC2626`), typography (`Manrope` + `Plus Jakarta Sans`), preserved `R` SVG logo, `shadcn/ui` primitives, `React Router`, responsive `AppShell` (desktop sidebar + mobile bottom bar), and keep legacy MVP workflow working seamlessly during migration.
- **Gate:** `lint`, `typecheck`, `test`, `build`, Chrome desktop + mobile screenshots, commit `feat(ui): establish Roamigo design system and responsive shell` & push.

### Milestone 2 — PostgreSQL Schema, Prisma Migrations & Backend Foundation
- Start local `postgres:16-alpine` container; define 18-entity `prisma/schema.prisma`, initial migration, and deterministic seed script (`npm run db:seed`).
- Implement standard API envelope, typed `AppError` hierarchy, structured logger, `helmet`, rate limiters, `/api/health` (DB + AI readiness), and `/api/openapi.json`.
- **Gate:** Prisma migration + repository/API integration tests against live PostgreSQL, commit `feat(database): introduce PostgreSQL schema, migrations and layered API core` & push.

### Milestone 3 — Authentication, Sessions, CSRF & RBAC Middleware
- Implement `scrypt` password hashing, `HttpOnly` session cookies, `X-CSRF-Token` verification, register/login/logout/forgot-password/reset-password routes & accessible UI pages, plus optional Google OAuth / email verification adapters.
- Enforce `requireAuth` and `requireTripRole(minRole)` middleware with cross-user IDOR integration tests.
- **Gate:** Auth unit + Supertest integration + Chrome login/register flow verification, commit `feat(auth): implement secure cookie sessions, CSRF protection and RBAC` & push.

### Milestone 4 — Persistent Trips, 10-Step Wizard, Invitations & MVP Importer
- Build Trip CRUD, **My Trips Dashboard** (Upcoming/Drafts/Past/Shared + labelled Barcelona Demo Trip), **10-Step Create Trip Wizard** with draft save/resume, tokenised **Invitations & Member Role Management**, and **`POST /api/trips/import-local`** for `roamigo:v1:trip`.
- **Gate:** Integration + Chrome wizard/invite/import screenshots & E2E checks, commit `feat(trips): implement dashboard, 10-step wizard, invitations and MVP import` & push.

### Milestone 5 — Multi-Provider AI Engine & Staged Assistant Proposals
- Implement `TravelAIProvider` (`gemini-api`, `vertex-ai`, `openai`, `openai-compatible`), structured itinerary generation creating immutable `ItineraryVersion` records, and contextual **AI Travel Assistant** returning staged Before/After diffs with deterministic budget impact, `AbortSignal` cancellation, bounded retry, and `AIRequest` logging.
- **Gate:** Contract/malformed-JSON/timeout/rate-limit tests + UI diff preview verification, commit `feat(ai): add multi-provider itinerary engine and staged assistant proposals` & push.

### Milestone 6 — Flagship 3-Panel Trip Workspace & Interactive MapLibre Map
- Deliver the 3-panel desktop / drawer-based mobile **Main Trip Workspace**: day-by-day timeline, manual activity CRUD, drag-and-drop + keyboard Move Up/Down reordering, categories, start/end times, and **`MapLibre GL JS`** map with day filters, bidirectional marker-card sync, `fitBounds`, attribution, and configurable geocoder fallback.
- **Gate:** Chrome desktop (`1440px`, `1280px`) & mobile (`390px`, `375px`) screenshots + tests, commit `feat(workspace): build 3-panel itinerary workspace and interactive MapLibre map` & push.

### Milestone 7 — Server-Authoritative Voting & Real-Time Socket.IO Sync
- Implement PostgreSQL-constrained (`UNIQUE(activityId, userId)`) voting, consensus/conflict indicators, organiser finalisation status, and authenticated **Socket.IO** room sync (`trip:<id>`) with version-checked state reconciliation across concurrent browser contexts.
- **Gate:** Two-context Playwright real-time collaboration test + unit/API voting tests, commit `feat(voting): add server-authoritative consensus and Socket.IO real-time sync` & push.

### Milestone 8 — Integer Minor-Unit Budgets, Expense Splitting & Settlements
- Implement pure minor-unit domain modules (`money.ts`, `splits.ts`, `settlements.ts`), **Budget & Expense Dashboard** (`Recharts` category & daily planned-vs-actual charts), equal/custom/percentage splits with exact cent reconciliation, and minimum-transfer settlement suggestions.
- **Gate:** Property/edge-case financial regression tests + Chrome verification, commit `feat(expenses): implement integer minor-unit budgets, splits and settlements` & push.

### Milestone 9 — Public Landing Page, User Settings, Privacy & Exports
- Complete marketing **Landing Page** (honest positioning, live interactive preview, FAQ), **Settings** (profile, currency, language, theme, account/data deletion), and member-scoped **Exports** (`JSON`, print-ready `PDF` view, `ICS` calendar, formula-safe `CSV` expenses).
- **Gate:** Export format unit/API tests + Light/Dark desktop & mobile Chrome verification, commit `feat(product): complete landing page, settings, privacy deletion and exports` & push.

### Milestone 10 — Adversarial Security Review, Full E2E Suite, Docker & CI
- Conduct full security/code audit (IDOR, CSRF, XSS, CSV injection, rate limits, file length, dead code); update `.agents/skills/verify-roamigo/SKILL.md` for full-stack verification.
- Author multi-stage `Dockerfile`, `docker-compose.yml`, `deploy/nginx/roamigo.conf`, VPS HTTPS guide, and `.github/workflows/ci.yml`. Run full unit, integration, AC1–AC5, and expanded Playwright suites.
- **Gate:** All quality gates + Docker build/run verification, commit `ci(deploy): add Docker production stack, Nginx config and GitHub Actions CI` & push.

### Milestone 11 — Release Readiness & Clean-Checkout Verification
- Verify clean-checkout startup and seed workflow, review all original + expanded acceptance criteria, document any remaining external credential limitations honestly, prepare release notes (`v1.0.0-rc.1`), and await explicit human approval before merging `develop` into `main`.
