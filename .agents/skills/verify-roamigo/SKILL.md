---
name: verify-roamigo
description: Repeatable acceptance verification workflow for Roamigo. Activate when verifying itinerary generation, traveller preferences, voting, budget calculations, AC1-AC5 browser behavior, or release readiness.
---

# Verify Roamigo (Acceptance & Release Workflow)

Run this workflow to verify Roamigo against AC1–AC5 using evidence-based browser and API checks.

## 1. Prerequisites

Ensure the static, unit, API, and build gates defined in `AGENTS.md` (Definition of Done) pass before browser testing.

## 2. Live Server & Credential Readiness

1. Start the app: `npm run dev -- --host 0.0.0.0 --port 8080`.
2. Probe `GET http://127.0.0.1:8080/api/health` to confirm Express + Vite proxy connectivity (`aiConfigured`, `provider`).
3. If `aiConfigured` is `false` or live Gemini/Vertex credentials fail (`403` / `503`), mark live AC3 generation as `BLOCKED` and report route-fixture UI checks separately.

## 3. Browser-Observable Acceptance Verification (AC1–AC5)

Open `http://127.0.0.1:8080` in headless Chrome (Playwright or DevTools) and verify directly in the DOM:

- **AC1 (Traveller Management):** Add at least two travellers with distinct budgets, interests, and preferences; verify all render on the same page; remove one and verify immediate removal.
- **AC2 (Inline Validation Preserving Inputs):** Submit missing fields or a negative budget; verify inline errors render while existing input values stay populated.
- **AC3 (AI Itinerary Generation):** Click `"Generate Itinerary"`; verify loading state transitions to a day-by-day itinerary with activities, `"est."` costs in a consistent currency, and group compromise explanations.
- **AC4 (Immediate Per-Traveller Voting):** Switch `"Voting as"` between travellers, upvote/downvote an activity, and verify vote counts update immediately without refresh; verify switching/re-clicking does not double-count.
- **AC5 (Immediate Cost & Budget Conflict Updates):** Toggle an activity between included and excluded; verify `"Estimated Cost / Person"` updates immediately and exceeded individual budgets highlight (and clear when excluded).

## 4. Reporting Format

Report results with observed evidence only:
- `/api/health` status + `AGENTS.md` check summary (`PASS` / `FAIL`).
- AC1–AC5 browser status (`PASS` / `FAIL` / `BLOCKED`) with DOM/console evidence.
- Explicit blockers (unprovisioned credentials, missing UI, or failing checks).
