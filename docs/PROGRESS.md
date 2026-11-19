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


---

## Milestone 4 — Trip Management, 10-Step Wizard, Invitations & MVP Importer

- **Objective:** Implement My Trips Dashboard, 10-step Create Trip Wizard with draft save/resume, tokenised Invitations & Member Role Management (including atomic ownership transfer), Demo Trip cloning, and validated `'roamigo:v1:trip'` LocalStorage import into integer minor units.
- **Completed Functionality:**
  - Pure integer minor-unit currency module (`src/lib/domain/money.ts`) and shared Zod/DTO contracts (`src/lib/contracts/{trip.schemas,tripDetail.types}.ts`).
  - Backend modules `server/modules/trips/*` (`trips.query.ts`, `trips.mapper.ts`, `trips.service.ts`, `importLocal.service.ts`, `cloneTrip.service.ts`, `trips.routes.ts`), `server/modules/invitations/*`, and `server/modules/members/members.routes.ts`.
  - Frontend **My Trips Dashboard** (`src/pages/TripsDashboardPage.tsx`, `TripCard.tsx`, `SandboxImportBanner.tsx`), **10-Step Create Trip Wizard** (`src/pages/CreateTripWizardPage.tsx`, `WizardStepEarly.tsx`, `WizardStepLate.tsx`, `wizardState.ts`), **Invitation Acceptance Page** (`src/pages/InviteAcceptPage.tsx`), **Members & Share Modal** (`TripMembersModal.tsx`), and `TripOverviewPage.tsx`.
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`9` test files, `34` tests including `tests/api/trips-invites.test.ts`)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`6` Playwright Chrome specs including `tests/e2e/trips-wizard.spec.ts`)
- **Screenshots & Browser Evidence:**
  - Verified desktop My Trips Dashboard (`m4-my-trips.png`) and 10-Step Create Trip Wizard (`m4-wizard.png`) in Chrome.
- **Next Milestone:** **Milestone 5 — Multi-Provider AI Engine & Staged Assistant Proposals**


---

## Milestone 5 — Multi-Provider AI Engine & Staged Assistant Proposals

- **Objective:** Implement a multi-provider AI itinerary & assistant abstraction (`gemini-api`, `vertex-ai`, `openai`, `openai-compatible`), PII minimisation, bounded retry, `AbortSignal` cancellation, `AIRequest` audit logging, and staged Before/After assistant proposals with deterministic minor-unit budget impact that never mutate saved plans or votes until explicitly confirmed.
- **Completed Functionality:**
  - Shared Zod AI schemas (`src/lib/contracts/ai.schemas.ts`) enforcing strict validation on upstream structured JSON outputs.
  - Multi-provider backend modules (`server/modules/ai/{ai.types,ai.prompts,ai.diff,ai.persistence,ai.audit,ai.service,ai.factory,ai.routes}.ts` and `server/modules/ai/providers/{geminiProvider,openaiProvider}.ts`) with zero raw member email leakage in prompts, `AIRequest` DB audit logging (`SUCCESS`/`FAILED`, `durationMs`, `errorCode`), and `stableKey` vote carryover across itinerary versions.
  - Workspace AI Assistant UI (`src/components/workspace/{AiAssistantPanel,AiProposalDiffCard,useAiAssistant}.ts(x)`) supporting full itinerary generation, quick prompts, `AbortController` request cancellation, retry banners, and staged Before/After diff previews.
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`10` test files, `36` tests including `tests/api/ai-engine.test.ts`)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`6` Playwright Chrome specs)
- **Next Milestone:** **Milestone 6 — Flagship 3-Panel Main Trip Workspace & Interactive MapLibre Map**


---

## Milestone 6 — Flagship 3-Panel Main Trip Workspace & Interactive MapLibre Map

- **Objective:** Deliver the flagship 3-panel desktop / single-column mobile Trip Workspace (`/trips/:tripId`) combining day-by-day collaborative itinerary editing, manual day & activity CRUD, drag-and-drop plus accessible Move Up/Down reordering, honest landmark coordinate resolution, and an interactive MapLibre GL JS destination map.
- **Completed Functionality:**
  - Shared Zod activity & day contracts (`src/lib/contracts/activity.schemas.ts`) and backend manual itinerary modules (`server/modules/activities/{days.service,activities.service,activities.reorder,activities.routes}.ts`) enforcing `OWNER`/`EDITOR` RBAC and protecting the shared Demo Trip from direct mutation.
  - Honest landmark gazetteer & optional Nominatim search (`server/modules/maps/{landmarks.data,landmarks,maps.routes}.ts`): attaches `coordSource: 'curated'` when matched or `'nominatim'` when configured, and preserves `lat: null, lng: null, coordSource: 'unverified'` when unmatched—never fabricating coordinates.
  - Modular 3-panel workspace (`src/pages/TripWorkspacePage.tsx` + `src/components/workspace/{WorkspaceLeftRail,WorkspaceTimeline,WorkspaceActivityCard,ActivityFormModal,ActivityFormFields,TripMapPanel,useMapLibreRoute,WorkspaceBudgetQuickCard,WorkspaceMobileNav}.ts(x)`).
  - Added dependency with justification: `maplibre-gl` (open-source WebGL vector map engine supporting free OpenFreeMap/OpenStreetMap vector tiles with zero mandatory proprietary API keys).
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`11` test files, `37` tests including `tests/api/activities-maps.test.ts`)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`7` Playwright Chrome specs including `tests/e2e/workspace-map.spec.ts`)
- **Screenshots & Browser Evidence:**
  - Captured desktop `1440×920` (`m6-workspace-desktop.png`) and mobile `390×844` (`m6-workspace-mobile.png`, verified `mobileOverflow390: false`, `mobileOverflow375: false`, `pageErrors: []`).
- **Next Milestone:** **Milestone 7 — Server-Authoritative Voting & Real-Time Socket.IO Sync**


---

## Milestone 7 — Server-Authoritative Voting & Real-Time Socket.IO Sync

- **Objective:** Implement server-authoritative 1-vote-per-user-per-activity voting (`UNIQUE(activityId, userId)`), deterministic consensus & conflict status badges, organiser `LOCKED_IN`/`EXCLUDED` decision finalisation, and cookie-authenticated Socket.IO room synchronization (`trip:<tripId>`) verified across two simultaneous browser contexts.
- **Completed Functionality:**
  - Pure consensus domain logic (`src/lib/domain/consensus.ts`) classifying `LOCKED_IN`, `EXCLUDED`, `UNANIMOUS`, `MAJORITY_DISAGREEMENT`, `CONTESTED`, `IN_PROGRESS`, and `PENDING`, plus trip-level consensus percentage.
  - Shared Zod vote/decision schemas (`src/lib/contracts/vote.schemas.ts`) and backend voting module (`server/modules/votes/{votes.service,votes.routes}.ts`) enforcing `OWNER`/`EDITOR`/`MEMBER` voter RBAC (`403` for `VIEWER`) and incrementing `trip.version`.
  - Authenticated Socket.IO hub (`server/realtime/socketServer.ts`) validating the `HttpOnly` `roamigo_session` cookie on handshake, checking `TripMember` access before joining `trip:<tripId>` (preventing WebSocket IDOR), broadcasting `presence:update` and `trip:changed`, and wired into `server/index.ts` and `vite.config.ts`.
  - Frontend live sync hook (`src/lib/useTripRealtimeSync.ts`), vote mutations (`src/lib/useWorkspaceVotes.ts`), and interactive `<ActivityVotingBar />` (`src/components/workspace/ActivityVotingBar.tsx`).
  - Added dependencies with justification: `socket.io` and `socket.io-client` (authenticated WebSocket + fallback room synchronization for multi-member live voting, presence, and itinerary updates).
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`13` test files, `40` tests including `tests/unit/consensus.test.ts` and `tests/api/votes-realtime.test.ts`)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`8` Playwright Chrome specs including two-browser-context `tests/e2e/realtime-voting.spec.ts`)
- **Next Milestone:** **Milestone 8 — Integer Minor-Unit Budgets, Expense Splitting & Settlements**


---

## Milestone 8 — Integer Minor-Unit Budgets, Expense Splitting & Settlements

- **Objective:** Implement deterministic integer minor-unit (`pence`/`cents`) group budgets, shared expense splitting (`EQUAL`, `CUSTOM`, `PERCENTAGE`), single-currency enforcement, minimum-transfer debt simplification, `MARKED_PAID` settlement reconciliation, and visual spend analytics while keeping estimated (`est.`) activity costs strictly separate from actual logged expenses.
- **Completed Functionality:**
  - Pure integer minor-unit financial domain modules (`src/lib/domain/splits.ts` and `src/lib/domain/settlements.ts`): deterministic lexicographical penny-remainder distribution for `EQUAL` splits (`£100.00 / 3 -> [3334, 3333, 3333]`), exact minor-unit sum verification for `CUSTOM` splits, `BigInt` Hamilton/Largest Remainder allocation across `10000` basis points for `PERCENTAGE` splits, single-currency trip ledger assertion, and greedy creditor-debtor minimal transfer generation (`computeMinimalSettlements`).
  - Shared Zod expense/budget contracts (`src/lib/contracts/expense.schemas.ts`) and backend expense/settlement module (`server/modules/expenses/{expenses.service,settlements.service,expenses.routes}.ts`) enforcing `OWNER`/`EDITOR` budget caps, `OWNER`/`EDITOR`/`MEMBER` expense logging, payer-or-organiser delete permissions, and automatic `SUGGESTED` settlement regeneration inside Prisma transactions with live `onTripChanged` broadcasts.
  - Interactive Budgets & Splits workspace (`src/components/expenses/{TripBudgetDashboard,BudgetAnalyticsCharts,AddExpenseCard,ExpenseSplitInputs,ExpensesAndSettlementsList}.tsx`, `src/components/workspace/{WorkspaceHeaderActions,WorkspaceBudgetQuickCard}.tsx`, `src/lib/useExpenses.ts`).
  - Added dependency with justification: `recharts` (declarative, responsive SVG React charting library for category spend breakdowns and daily planned-vs-actual group spend comparisons).
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`15` test files, `46` tests including `tests/unit/money-splits.test.ts` and `tests/api/expenses.test.ts`)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`9` Playwright Chrome specs including two-browser-context `tests/e2e/expenses.spec.ts`)
- **Screenshots & Browser Evidence:**
  - Captured desktop `1440×960` (`m8-budgets-expenses.png`) and verified `mobileOverflow390: false` and `pageErrors: []` in Chrome.
- **Next Milestone:** **Milestone 9 — Public Landing Polish, User Settings, Privacy Deletion & Exports**


---

## Milestone 9 — Public Landing Polish, User Settings, Privacy Deletion & Exports

- **Objective:** Complete the consumer public landing page (`/`), traveller profile & privacy settings (`/settings`), permanent/anonymizing GDPR-style account deletion (`DELETE /api/users/me`), member-scoped portable exports (`JSON`, `RFC 5545 .ics`, formula-safe `.csv`), and print-ready PDF itinerary view (`/trips/:tripId/print`).
- **Completed Functionality:**
  - Public Landing completion (`src/components/landing/LandingFeaturesFaq.tsx`, `src/pages/HomePage.tsx`): added 6-pillar full-stack capability overview, honest FAQ section, and navigation footer with zero fabricated statistics or reviews while preserving all AC1–AC5 Instant Sandbox selectors.
  - Account & Privacy Settings (`src/lib/contracts/user.schemas.ts`, `server/modules/users/{users.service,users.routes}.ts`, `src/lib/useUserSettings.ts`, `src/pages/SettingsPage.tsx`, `src/components/settings/DeleteAccountCard.tsx`): `PATCH /api/users/me` (`displayName`, `avatarColor`, `preferredCurrency`, `preferredLanguage`, `themePreference`, `privacyShareEmail`) and `DELETE /api/users/me` (revokes sessions, deletes owned private trips/votes/invitations, and either deletes the `User` row or anonymizes collaborator expense references so friend ledgers remain intact without retaining PII).
  - Portable Exports & Print/PDF (`src/lib/domain/exports.ts`, `server/modules/exports/exports.routes.ts`, `src/components/workspace/WorkspaceExportMenu.tsx`, `src/pages/TripPrintPage.tsx`): `GET /api/trips/:tripId/export/{json,ics,csv}` enforcing `TripMember` RBAC (`403` IDOR block), redacting private collaborator emails for non-owners, neutralizing spreadsheet formula prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`), emitting RFC 5545 CRLF `.ics` calendars, and rendering a `@media print` printable itinerary booklet.
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`17` test files, `49` tests including `tests/unit/exports.test.ts` and `tests/api/settings-exports.test.ts`)
  - `npm run build` — **PASS**
  - `npm run test:e2e` — **PASS** (`10` Playwright Chrome specs including `tests/e2e/settings-exports.spec.ts`)
- **Screenshots & Browser Evidence:**
  - Captured Dark Mode Settings (`m9-settings-dark.png`) and Print/PDF Itinerary View (`m9-print-view.png`), and verified zero horizontal overflow across `375px`, `390px`, `768px`, `1280px`, and `1440px` (`pageErrors: []`, `consoleErrors: []`).
- **Next Milestone:** **Milestone 10 — Independent Security Audit, Skill Update, Docker Stack & GitHub Actions CI**


---

## Milestone 10 — Independent Security Audit, Skill Update, Docker Stack & GitHub Actions CI

- **Objective:** Perform an independent OWASP & codebase rule security audit, remediate any discovered edge cases, upgrade `.agents/skills/verify-roamigo/SKILL.md` for full-stack production verification, and author verified Docker, Docker Compose, Nginx TLS reverse-proxy, and GitHub Actions CI configurations.
- **Completed Functionality:**
  - Independent Security Audit (`docs/SECURITY_AUDIT.md`): verified zero `any`, `@ts-ignore`, `@ts-expect-error`, `dangerouslySetInnerHTML`, or raw SQL across `src/` and `server/`; remediated open-redirect edge case on `?next=` query params via `sanitizeInternalRedirect()` (`src/pages/AuthPage.tsx`, `tests/unit/security.test.ts`); added `app.set('trust proxy', 1)` in production (`server/middleware/security.ts`); documented `npm audit` major-version advisory dispositions.
  - Updated agent verification skill (`.agents/skills/verify-roamigo/SKILL.md`) covering PostgreSQL readiness, Auth/RBAC, 3-panel MapLibre workspace, multi-context Socket.IO voting, integer minor-unit splits, exports, and AC1–AC5 preservation.
  - Production container & deployment stack (`Dockerfile`, `.dockerignore`, `docker/entrypoint.sh`, `docker-compose.yml`, `deploy/nginx/roamigo.conf`, `.github/workflows/ci.yml`, `.env.example`, `README.md`).
- **Tests Executed & Actual Results:**
  - `npm run lint` — **PASS**
  - `npm run typecheck` — **PASS**
  - `npm run test` — **PASS** (`18` test files, `50` tests including `tests/unit/security.test.ts`)
  - `docker build -t roamigo:rc1 .` — **PASS** (`node:22-bookworm-slim` multi-stage build, non-root `node` runtime, `/api/health/ready` `HEALTHCHECK`)
- **Next Milestone:** **Milestone 11 — Final Release Verification, Tagging (`v1.0.0-rc.1`) & Engineering Report**
