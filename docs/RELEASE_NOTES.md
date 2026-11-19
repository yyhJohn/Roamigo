# Roamigo `v1.0.0-rc.1` — Production Release Candidate Notes

**Tagline:** *Less Arguing, More Wandering.*  
**Baseline Tag:** `v0.1.0-hackathon` (`b506a9a`)  
**Release Tag:** `v1.0.0-rc.1`

---

## 1. Release Summary

Roamigo `v1.0.0-rc.1` elevates the original single-browser hackathon prototype into a full-stack, PostgreSQL-backed, real-time collaborative group travel platform while preserving 100% compatibility with the historical AC1–AC5 Instant Group Consensus Sandbox and `'roamigo:v1:trip'` `localStorage` plans.

---

## 2. Major Capabilities Delivered (Milestones 0–11)

- **Cohesive Hybrid Design System (`#103D3B` Forest Teal + `#A7F3CF` Fresh Mint):** Semantic Light & Dark CSS tokens (`Manrope` + `Plus Jakarta Sans`), preserved original `R` monogram SVG, accessible Radix UI primitives, collapsible desktop shell, and mobile navigation verified across `375px`–`1440px`.
- **PostgreSQL 16 + 18-Entity Prisma Schema:** Versioned migrations (`prisma/migrations/20261118195042_init`), concurrency-safe idempotent demo seeding (`Barcelona Long Weekend`), `/api/health`, `/api/health/ready`, and `/api/openapi.json`.
- **Cookie-Session Auth, CSRF & Per-Trip RBAC:** `scrypt` password hashing, `HttpOnly; SameSite=Lax` sessions, timing-safe `X-CSRF-Token` validation, zero secrets in `localStorage`, and strict server-side `OWNER` / `EDITOR` / `MEMBER` / `VIEWER` role enforcement.
- **My Trips Dashboard, 10-Step Wizard & Invitations:** Draft-saving wizard, 1-click Demo Trip cloning, tokenised collaborator invitations (`/invites/:token`), ownership transfer, and `'roamigo:v1:trip'` `localStorage` importer (`POST /api/trips/import-local`).
- **Multi-Provider AI Engine & Staged Diffs:** Pluggable `gemini-api`, `vertex-ai`, `openai`, and `openai-compatible` providers, PII-redacted prompts, `AIRequest` audit logging, `AbortController` cancellation, and staged Before/After assistant proposals with deterministic minor-unit budget deltas.
- **3-Panel Workspace & Honest MapLibre GL JS Map:** Manual day/activity CRUD, drag-and-drop + accessible reordering, and interactive MapLibre route pins (`coordSource: 'curated' | 'nominatim' | 'manual' | 'unverified'`—never fabricating coordinates).
- **Real-Time Collaborative Voting (`Socket.IO`):** `UNIQUE(activityId, userId)` server-authoritative votes, consensus classification (`LOCKED_IN`, `UNANIMOUS`, `MAJORITY_DISAGREEMENT`, `CONTESTED`), and cookie-authenticated `trip:<tripId>` live broadcasts.
- **Integer Minor-Unit Budgets, Splits & Settlements:** Deterministic `pence`/`cents` math for `EQUAL`, `CUSTOM`, and `BigInt` Hamilton `PERCENTAGE` (`10000` bp) splits, minimum-transfer debt simplification, `MARKED_PAID` reconciliation, and Recharts spend analytics (`est.` kept strictly separate from actual expenses).
- **Settings, Privacy Deletion & Exports:** Profile/currency/theme/email-privacy controls (`PATCH /api/users/me`), permanent/anonymizing account deletion (`DELETE /api/users/me`), RFC 5545 `.ics` calendar export, formula-safe `.csv` ledger export, `.json` backup, and printable PDF itinerary view.
- **Production DevOps & Security Hardening:** Multi-stage non-root `Dockerfile`, `docker-compose.yml`, `deploy/nginx/roamigo.conf`, `.github/workflows/ci.yml`, updated `verify-roamigo` skill, and independent OWASP audit (`docs/SECURITY_AUDIT.md`).

---

## 3. Verified Production Dependencies Added Since `v0.1.0-hackathon`

| Package(s) | Purpose & Engineering Justification |
|---|---|
| `prisma`, `@prisma/client` | Type-safe PostgreSQL 16 schema, migrations, and transactional queries |
| `helmet`, `cookie-parser`, `express-rate-limit` | CSP/security headers, `HttpOnly` cookie parsing, and endpoint rate limiting |
| `react-router-dom`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers` | Client routing, server-state cache synchronization, theme store, and Zod-validated forms |
| `@radix-ui/react-*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `motion` | Accessible WAI-ARIA dialogs/tabs/menus/tooltips, token variants, icons, and reduced-motion-safe transitions |
| `maplibre-gl` | Open-source WebGL destination maps using OpenFreeMap/OSM vector tiles without mandatory proprietary keys |
| `socket.io`, `socket.io-client` | Cookie-authenticated real-time room presence and live collaboration updates |
| `recharts` | Responsive SVG charts for category spend and planned-vs-actual daily comparisons |

---

## 4. Known Operational Notes

- **External AI Provider Credentials:** Live AI generation (`POST /api/itinerary/generate`, `POST /api/trips/:tripId/itinerary/generate`, `POST /api/trips/:tripId/ai/propose`) requires server-side credentials (`GEMINI_API_KEY`, `GCP_PROJECT_ID` with Vertex AI IAM, or `OPENAI_API_KEY`) in `.env`. When unconfigured, `/api/health` transparently reports `aiConfigured: false` and UI error banners guide the operator without crashing.
- **Estimated Activity Costs:** Itinerary prices are always labelled `est.` and never mixed with actual logged group receipts.
