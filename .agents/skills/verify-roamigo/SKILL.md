---
name: verify-roamigo
description: Repeatable acceptance verification workflow for Roamigo. Activate when verifying itinerary generation, traveller preferences, voting, budget calculations, AC1-AC5 browser behavior, or release readiness.
---

# Verify Roamigo (Full-Stack Production & Historical AC1–AC5 Workflow)

Run this workflow to verify Roamigo's full-stack collaborative travel platform and historical AC1–AC5 guarantees using evidence-based CLI, API, database, and Chrome checks.

## 1. Automated Quality Gates

Execute all required static, unit, integration, and build checks from the repository root:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

All five gates must exit `0` (`max-lines <= 200` on `src/` and `server/`, zero `any` or `@ts-ignore`, strict Zod validation, and integer minor-unit financial math).

## 2. Live Server, PostgreSQL & AI Readiness

1. Ensure PostgreSQL 16 is running and seeded (`npm run db:deploy && npm run db:seed`).
2. Start the full-stack dev server: `npm run dev -- --host 0.0.0.0 --port 8080`.
3. Probe `GET http://127.0.0.1:8080/api/health` and `GET http://127.0.0.1:8080/api/health/ready`:
   - Confirm `ok: true` and `database: "connected"`.
   - Inspect `aiConfigured` and `provider` (`gemini-api`, `vertex-ai`, `openai`, `openai-compatible`, or `unconfigured`). If `aiConfigured: false`, report live upstream AI calls as `BLOCKED` (unconfigured credentials) while verifying deterministic provider/UI flows via test fixtures.

## 3. Browser-Observable Acceptance Checks

1. **Historical Instant Sandbox (`/`, AC1–AC5):**
   - Add/remove travellers with inline validation preserving inputs, generate day-by-day plans with `est.` costs, cast duplicate-safe per-traveller votes, and toggle activities to verify deterministic budget warnings.
2. **Authentication, CSRF & Zero-Secret Storage (`/auth/login`, `/auth/register`):**
   - Sign in or register; verify `roamigo_session` is `HttpOnly` and `window.localStorage` contains zero session tokens or API keys.
3. **3-Panel Trip Workspace, MapLibre & Real-Time Voting (`/trips/:tripId`):**
   - Clone the Barcelona Demo Trip, verify MapLibre pins (`curated` vs `unverified` coordinates), cast votes across two browser contexts, and confirm live `Socket.IO` updates without reload.
4. **Integer Minor-Unit Budgets, Splits & Settlements (`Budgets & Splits` tab):**
   - Log shared expenses (`EQUAL`, `CUSTOM`, `PERCENTAGE`), confirm penny-exact remainder allocation and minimum-transfer settlements, and verify `est.` itinerary totals stay separate from actual logged expenses.
5. **Settings, Privacy & Exports (`/settings`, `/trips/:tripId/print`):**
   - Verify Light/Dark theme switching, `.ics` / formula-safe `.csv` / `.json` downloads, printable PDF view, and responsive layouts (`375px`–`1440px`) with zero console/page errors.

## 4. Reporting Format

Report observed evidence only (never fabricate outputs, coordinates, or commit hashes):
- Gate summary (`lint`, `typecheck`, `test`, `build`, `test:e2e`, `docker build`).
- `/api/health` + `/api/health/ready` payload summary.
- Browser & multi-context collaboration results with explicit note of any unprovisioned external credentials.
