# Project: Roamigo (Production Collaborative Travel Platform)
Tagline: *Less Arguing, More Wandering.*

## Stack & Architecture (Approved Production Modular Monolith)
- **Frontend:** React 18, TypeScript (strict mode), Vite, Tailwind CSS v4, React Router, TanStack Query, Zustand, React Hook Form + Zod, accessible Radix/`shadcn/ui` primitives, Lucide React, Motion (reduced-motion safe), Recharts, and MapLibre GL JS.
- **Backend:** Node.js 22 and Express layered modular monolith (`routes -> controllers -> services -> repositories -> domain`), PostgreSQL 16 with Prisma ORM, Socket.IO authenticated room sync, and multi-provider AI abstraction (`gemini-api`, `vertex-ai`, `openai`, `openai-compatible`).
- **Historical Baseline Compatibility (`v0.1.0-hackathon`):** Original AC1–AC5 instant planner workflows and `'roamigo:v1:trip'` `localStorage` state remain supported with a validated PostgreSQL import path (`POST /api/trips/import-local`).

## Engineering Rules
- Keep UI components modular under `src/components/`, client/domain logic under `src/lib/`, backend modules/routes under `server/`, database schema/migrations under `prisma/`, and tests under `tests/`.
- Enable TypeScript strict mode everywhere. Never use `any` or suppress type errors (`@ts-ignore`, `@ts-expect-error`).
- Keep every source file in `src/` and `server/` under **200 lines** (excluding blank lines and comments); split larger modules by responsibility, enforced via ESLint `max-lines` and `.agents/hooks.json`.
- Validate all user inputs, URL params, LocalStorage imports, and upstream AI responses with Zod; display inline errors without losing user input.
- Never swallow `localStorage`, JSON parse, database, or network errors silently; log sanitised server diagnostics and surface actionable user recovery states.
- Keep all AI, session, OAuth, and database secrets server-side in environment variables. Never store auth tokens in `localStorage`, expose secrets to the browser, or commit `.env` files.
- Enforce authentication, CSRF protection on state-mutating cookie requests, and per-trip RBAC (`OWNER`, `EDITOR`, `MEMBER`, `VIEWER`) on the server to prevent IDOR.
- Store and compute all monetary values, budgets, expense splits, and settlements in **integer minor units** (`pence`/`cents`) using deterministic TypeScript functions—never floating-point settlement math or AI arithmetic. Keep estimated (`est.`) activity costs separate from actual expenses.
- Require user confirmation via Before/After previews before AI assistant proposals modify saved itineraries or votes.
- Never fabricate customer statistics, reviews, geographical coordinates, test results, screenshots, or commit hashes.
- Justify every newly added dependency in `docs/` and its corresponding Git commit.

## Definition of Done
- `npm run lint` and `npm run typecheck` pass with zero errors.
- `npm run test`, `npm run build`, and `npm run test:e2e` exit successfully (preserving original AC1–AC5 alongside expanded unit, DB integration, and multi-context browser suites).
- `npm run dev -- --host 0.0.0.0 --port 8080` serves the working application with HTTP 200 entry assets and zero unexpected `404`/`500` console errors in Chrome.
- Every completed milestone updates `docs/PROGRESS.md`, creates a clean Conventional Commit, and pushes verified code to GitHub (`origin/main`).
