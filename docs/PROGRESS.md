# Roamigo — Engineering Progress Log

---

## Milestone 0 — Repository Audit and Planning

- **Objective:** Inspect the entire hackathon MVP repository (`b506a9a`), verify baseline quality gates and browser acceptance tests, audit security/timeouts/credentials/hooks/infrastructure, research all 6 UI benchmarks, present 3 distinct visual directions (`A`, `B`, `C`), and author the complete production specification, architecture, and 11-milestone roadmap before modifying any application code.
- **Completed Functionality & Documentation:**
  - Audited all 47 tracked files, Git history (`6` commits on `master`), SSH remote (`git@github.com:yyhJohn/Roamigo.git`), Gemini timeout (`30,000 ms` `AbortController`), currency handling (`GBP`/`USD`/`EUR`), `localStorage` schema (`roamigo:v1:trip`), `.agents/hooks.json` working directory resolution, and Docker Engine `29.1.3` host readiness.
  - Preserved hackathon baseline at tag `v0.1.0-hackathon` (`b506a9a`) and created development branch `develop`.
  - Authored `docs/PROJECT_AUDIT.md`, `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/UI_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, and `docs/PROGRESS.md`.
- **Files Changed:**
  - `docs/PROJECT_AUDIT.md` (new)
  - `docs/PRODUCT_SPEC.md` (new)
  - `docs/ARCHITECTURE.md` (new)
  - `docs/UI_DESIGN.md` (new)
  - `docs/IMPLEMENTATION_PLAN.md` (new)
  - `docs/PROGRESS.md` (new)
  - *(Zero changes to `src/`, `server/`, `tests/`, `package.json`, or `AGENTS.md` pending human approval.)*
- **Architectural Decisions Proposed (Pending Approval):**
  - Modular monolith (`React 18 + Vite + Tailwind + shadcn/Radix + TanStack Query + MapLibre + Recharts` + `Layered Express + Prisma + PostgreSQL 16 + Socket.IO`); omit Redis initially until multi-node horizontal scaling is needed.
  - Store all monetary amounts in integer minor units (`pence`/`cents`) with deterministic remainder distribution so splits reconcile to the exact cent.
  - Multi-provider AI adapter (`gemini-api`, `vertex-ai`, `openai`, `openai-compatible`) preserving the `30,000 ms` default timeout and requiring explicit user confirmation on Before/After diff proposals.
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS** (exit `0`)
  - `npm run typecheck` — **PASS** (exit `0`)
  - `npm run test` — **PASS** (`5` test files, `25` tests passed in `2.34s`)
  - `npm run build` — **PASS** (`vite build` + `tsc -p tsconfig.server.json` in `1.74s`)
  - `npm run test:e2e` — **PASS** (`4` Chrome Playwright specs passed in `7.0s`)
- **Screenshots & Research Evidence:**
  - Captured live Chrome reference screenshots for Wanderlog (`ref-1-wanderlog.png`), Traw/Taqwah on Muzli (`ref-b-muzli.png`), Pickolab AI Travel Plan (`ref-c-dribbble.png`), and Ronas IT Travel Builder (`ref-d-dribbble.png`), plus interactive concept renders (`concept-landing-desktop.png`, `concept-landing-mobile.png`, `concept-trips.png`, `concept-workspace-map.png`, `concept-workspace-ai.png`, `concept-budget.png`).
- **Remaining Gaps / Minor Findings to Fix in Milestone 1:**
  - `.gitignore` currently omits `test-results/`, `playwright-report/`, and `coverage/`.
  - `.env.example` omits `AI_TIMEOUT_MS` (and upcoming multi-provider variables).
  - `.agents/scripts/check-line-limit.mjs` counts physical lines rather than skipping blanks/comments like ESLint `max-lines`.
- **External Blockers:**
  - Live AI credentials (`.env` `GEMINI_API_KEY` / `OPENAI_API_KEY`) are not provisioned in the local sandbox (`aiConfigured: false`); mocked contract/E2E suites run deterministically while opt-in live AI checks remain clearly separated.
- **Git Baseline & Branch:** Tag `v0.1.0-hackathon` on `b506a9a`; Milestone 0 committed and pushed on branch `develop` (leaving `main` untouched).
- **Next Milestone:** **Milestone 1 — Design System and Frontend Foundation** (awaiting human approval of architecture, roadmap, and visual direction).

---

## Milestone 1 — Design System and Frontend Foundation

- **Objective:** Establish semantic Light/Dark Roamigo design tokens (`#103D3B`, `#A7F3CF`, `#F7F9F6`, `#FFFFFF`, `#17302D`), two-font typography (`Manrope` + `Plus Jakarta Sans`), preserved `R` monogram SVG, accessible Radix/`shadcn`-pattern primitives, responsive `AppShell` + `TopMarketingNav`, and re-themed AC1–AC5 instant planner while aligning `AGENTS.md`, `.gitignore`, and `.agents/scripts/check-line-limit.mjs`.
- **Completed Functionality:**
  - Updated `AGENTS.md` for the approved production modular monolith, added `test-results/`, `playwright-report/`, and `coverage/` to `.gitignore`, and updated `.agents/scripts/check-line-limit.mjs` to count non-blank, non-comment code lines matching ESLint `max-lines`.
  - Implemented `src/index.css` semantic Light/Dark tokens (`prefers-reduced-motion` and `@media print` included), `src/lib/theme.ts`, `src/lib/cn.ts`, `src/lib/destinations.ts`, `src/components/ui/*` (`RoamigoLogo`, `Button`, `Card`, `Badge`, `Skeleton`, `EmptyState`, `ModalDialog`, `ToastProvider`), `src/components/layout/*` (`ThemeToggle`, `TopMarketingNav`, `AppShell`), `src/components/landing/LandingHero.tsx`, `src/pages/HomePage.tsx`, and `src/pages/WorkspaceShellPage.tsx`.
  - Re-themed all existing planner components without breaking any `id`, `aria-label`, or `data-testid` selectors.
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`6` test files, `27` tests)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`4` Playwright Chrome AC1–AC5 & resilience specs)
- **Screenshots & Browser Evidence:**
  - Verified desktop Light (`m1-home-desktop.png`), desktop Dark (`m1-shell-desktop-dark.png`), and mobile `390×844` (`m1-shell-mobile-390.png`, horizontal overflow `false`) in Google Chrome.
- **Next Milestone:** **Milestone 2 — Database and Backend Foundation**


---

## Milestone 2 — Database and Backend Foundation

- **Objective:** Provision PostgreSQL 16 (`roamigo` & `roamigo_test`), define the 18-entity relational Prisma schema with initial migration and repeatable demo seed, and introduce the layered Express security, error-handling, structured logging, health, and OpenAPI 3.1 foundation.
- **Completed Functionality:**
  - Created `prisma/schema.prisma` with all 18 entities (`User`, `Session`, `Trip`, `TripMember`, `TripInvitation`, `TravellerPreference`, `Itinerary`, `ItineraryVersion`, `ItineraryDay`, `Activity`, `Vote`, `Budget`, `Expense`, `ExpenseSplit`, `Settlement`, `AIRequest`, `Notification`, `AuditLog`), integer minor-unit financial fields, `UNIQUE(tripId, userId)`, `UNIQUE(activityId, userId)`, `UNIQUE(expenseId, userId)`, and cascade/nullability rules.
  - Generated and applied initial migration `20261118195042_init` on both `roamigo` and `roamigo_test`.
  - Implemented `prisma/seedData.ts` & `prisma/seed.ts` (`npm run db:seed`) seeding demo accounts (`alice@roamigo.demo`, `james@roamigo.demo`, `sophie@roamigo.demo`) and the flagship **Barcelona Long Weekend (Demo Trip)** with curated coordinates, votes, minor-unit expenses, splits, and settlements.
  - Implemented `server/lib/{crypto,errors,logger,http}.ts`, `server/db/prisma.ts`, `server/middleware/security.ts` (`helmet`, CORS, `cookie-parser`, rate limiters), `server/modules/health/health.routes.ts`, and `server/modules/openapi/{openapi.spec,openapi.routes}.ts` (`GET /api/openapi.json`).
  - Added new dependencies with justification: `@prisma/client` & `prisma` (type-safe PostgreSQL ORM and migrations), `helmet` (HTTP security headers), `cookie-parser` & `@types/cookie-parser` (`HttpOnly` cookie session parsing), `express-rate-limit` (brute-force and AI endpoint throttling).
- **Tests Executed & Actual Results:**
  - `npm run db:seed` — **PASS**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`7` test files, `30` tests including live PostgreSQL `tests/api/health-db.test.ts`)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`4` Chrome Playwright specs)
- **Next Milestone:** **Milestone 3 — Authentication and Authorisation**


---

## Milestone 3 — Authentication and Authorisation

- **Objective:** Deliver `scrypt` password hashing, `HttpOnly; SameSite=Lax` cookie sessions, timing-safe `X-CSRF-Token` verification on mutating routes, registration/login/logout/email-verification/password-reset flows, accessible UI screens, and server-side RBAC (`OWNER`, `EDITOR`, `MEMBER`, `VIEWER`) preventing IDOR.
- **Completed Functionality:**
  - Shared Zod contracts in `src/lib/contracts/auth.schemas.ts`.
  - Backend session hydrator, CSRF enforcement, and `requireTripRole` RBAC middleware in `server/middleware/auth.ts`.
  - Auth & password-reset services and Express routes in `server/modules/auth/{auth.service,passwordReset.service,auth.routes}.ts` (`GET /api/auth/me`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/verify-email`, `GET /api/auth/google/status`).
  - Made `prisma/seed.ts` concurrency-safe using a PostgreSQL transaction + advisory lock (`pg_advisory_xact_lock`).
  - Frontend typed API client (`src/lib/apiClient.ts` keeping CSRF token strictly in memory, never in `localStorage`), TanStack Query session hooks & `<ProtectedRoute>` (`src/lib/useAuth.tsx`), and editorial `AuthPage` + subcomponents (`src/pages/AuthPage.tsx`, `src/components/auth/*`).
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`8` test files, `32` tests including `tests/api/auth-rbac.test.ts` verifying CSRF, password reset, and cross-user IDOR isolation)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`5` Playwright Chrome specs including `tests/e2e/auth.spec.ts`)
- **Screenshots & Browser Evidence:**
  - Captured desktop login screen (`m3-auth-login.png`) and verified Demo Account sign-in, route protection, `localStorage` secret-hygiene, and sign-out in Chrome.
- **Next Milestone:** **Milestone 4 — Trip Management, 10-Step Wizard, Invitations & MVP Importer**
