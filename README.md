# Roamigo

**Less Arguing, More Wandering.**

Roamigo is a production-ready, AI-powered collaborative travel planning platform built for groups of friends, students, couples, and budget-conscious travellers. It combines a no-signup **Instant Group Consensus Sandbox** with persistent **multi-member workspaces**, **Before/After staged AI itinerary diffs**, **interactive MapLibre GL JS destination maps**, **real-time Socket.IO voting**, **penny-exact integer minor-unit expense splitting**, and **portable exports (`.ics`, `.csv`, `.json`, printable PDF)**.

---

## Core Capabilities

- **Persistent Accounts, CSRF & Role-Based Access Control:** `scrypt` password hashing, `HttpOnly; SameSite=Lax` cookie sessions, timing-safe `X-CSRF-Token` validation, zero secrets in `localStorage`, and server-enforced `OWNER` / `EDITOR` / `MEMBER` / `VIEWER` permissions.
- **10-Step Create Trip Wizard & MVP Importer:** Draft-saving wizard (`POST /api/trips`), read-only seeded **Barcelona Long Weekend Demo Trip** with 1-click cloning, secure collaborator invite links (`/invites/:token`), and seamless import of legacy `'roamigo:v1:trip'` `localStorage` plans (`POST /api/trips/import-local`).
- **Multi-Provider AI Engine & Staged Diffs:** Pluggable server-side provider abstraction (`gemini-api`, `vertex-ai`, `openai`, `openai-compatible`), strict Zod output validation, PII-redacted prompts, `AIRequest` audit logging, and staged Before/After assistant previews that never overwrite saved plans or votes without explicit confirmation.
- **Flagship 3-Panel Trip Workspace & MapLibre Map:** Editable day-by-day timeline, drag/button reordering, and interactive MapLibre GL JS pins backed by curated & optional Nominatim geocoding (`coordSource: 'curated' | 'nominatim' | 'manual' | 'unverified'`—never fabricating coordinates).
- **Real-Time Collaborative Voting:** Server-authoritative `UNIQUE(activityId, userId)` voting, deterministic consensus badges (`LOCKED_IN`, `UNANIMOUS`, `MAJORITY_DISAGREEMENT`, `CONTESTED`), and live Socket.IO room presence (`trip:<tripId>`).
- **Integer Minor-Unit Budgets, Splits & Settlements:** All monetary amounts are stored and calculated in integer minor units (`pence`/`cents`) supporting `EQUAL`, `CUSTOM`, and `BigInt` Hamilton `PERCENTAGE` (`10000` bp) splits, minimum-transfer debt simplification, and Recharts analytics while keeping `est.` itinerary costs separate from actual expenses.
- **Settings, Privacy Deletion & Exports:** Light/Dark themes (`#103D3B` Forest Teal & `#A7F3CF` Fresh Mint), collaborator email-visibility controls, permanent/anonymizing account deletion (`DELETE /api/users/me`), RFC 5545 `.ics` calendar export, formula-injection-safe `.csv` ledger export, `.json` backup, and `@media print` PDF view.

---

## Architecture & Tech Stack

- **Frontend:** React 18, TypeScript (`strict`), Vite 6, Tailwind CSS v4, React Router, TanStack Query, Zustand, Radix UI primitives, Lucide React, Recharts, MapLibre GL JS
- **Backend:** Node.js 22, Express layered modular monolith (`server/modules/*`), Socket.IO, Helmet CSP, `express-rate-limit`
- **Database:** PostgreSQL 16 + Prisma ORM (`prisma/schema.prisma`, 18 entities)
- **Verification:** ESLint (`max-lines <= 200`), TypeScript `tsc`, Vitest + Supertest, Playwright (Google Chrome)

Detailed engineering documentation lives in [`docs/`](./docs):
- [`docs/PROJECT_AUDIT.md`](./docs/PROJECT_AUDIT.md) — Baseline MVP audit
- [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) — Product requirements & user journeys
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System architecture & data model
- [`docs/UI_DESIGN.md`](./docs/UI_DESIGN.md) — Approved hybrid design system & tokens
- [`docs/SECURITY_AUDIT.md`](./docs/SECURITY_AUDIT.md) — OWASP & dependency security audit
- [`docs/PROGRESS.md`](./docs/PROGRESS.md) — Milestone-by-milestone verification log

---

## Quick Start (Local Development)

### Prerequisites
- Node.js `v22+` and `npm`
- PostgreSQL `16+` (local service or Docker)

### 1. Configure Environment
```bash
cp .env.example .env
```
Configure `DATABASE_URL` and `SESSION_SECRET` (`openssl rand -hex 32`). Optionally set `GEMINI_API_KEY` + `GEMINI_MODEL` (or `OPENAI_API_KEY` / `GCP_PROJECT_ID`) to enable live AI generation. Never commit `.env`.

### 2. Migrate & Seed PostgreSQL
```bash
npm install
npx prisma migrate deploy
npm run db:seed
```
Demo account seeded automatically:
- **Email:** `alice@roamigo.demo`
- **Password:** `RoamigoDemo2026!`

### 3. Launch Full-Stack Dev Server
```bash
npm run dev -- --host 0.0.0.0 --port 8080
```
Open `http://localhost:8080` (Vite SPA on `:8080` proxying `/api` and `/socket.io` to Express on `:3001`).

---

## Production Deployment

### Option A: Single-Command Docker Compose Stack
```bash
cp .env.example .env
# Edit SESSION_SECRET, POSTGRES_PASSWORD, APP_ORIGIN, and optional AI keys in .env
docker compose up --build -d
```
`roamigo-app` waits for healthy `postgres:16-alpine`, runs `prisma migrate deploy`, seeds idempotent demo data (`SEED_DEMO_DATA=true`), and serves both the SPA and API/WebSockets on `http://localhost:8080` with `/api/health/ready` healthchecks.

### Option B: Ubuntu VPS + Nginx + Let's Encrypt HTTPS
1. Provision an Ubuntu 22.04/24.04 LTS host with Docker Engine, Docker Compose plugin, Nginx, and Certbot (`apt install nginx certbot python3-certbot-nginx`).
2. Clone the repository to `/opt/roamigo`, create `/opt/roamigo/.env` with `NODE_ENV=production`, `APP_ORIGIN=https://roamigo.example.com`, a 32-byte `SESSION_SECRET`, strong `POSTGRES_PASSWORD`, and server-side AI credentials.
3. Start the container stack bound to localhost (`127.0.0.1:8080:3001`):
   ```bash
   docker compose up --build -d
   ```
4. Copy [`deploy/nginx/roamigo.conf`](./deploy/nginx/roamigo.conf) to `/etc/nginx/sites-available/roamigo.conf`, replace `roamigo.example.com` with your domain, obtain Let's Encrypt certificates (`certbot --nginx -d roamigo.example.com`), and reload Nginx (`nginx -t && systemctl reload nginx`).

---

## Verification & Quality Scripts

```bash
npm run lint        # ESLint strict rules + 200-line max-lines check
npm run typecheck   # Strict TypeScript check (frontend + server)
npm run test        # Vitest unit + PostgreSQL API integration tests
npm run build       # Production Vite SPA + compiled Express server
npm run test:e2e    # Multi-context Playwright Chrome acceptance suite
```
