# Roamigo — Independent Security & Engineering Audit

**Audit Date:** 2026-11-18  
**Target Release:** `v1.0.0-rc.1`

---

## 1. Automated Codebase & Rule Compliance Checks

| Control | Verification Method | Result |
|---|---|---|
| TypeScript `strict` (`noImplicitAny`, zero `any`) | `npm run typecheck` + regex scan across `src/` & `server/` | **PASS (`0` matches)** |
| Zero `@ts-ignore` / `@ts-expect-error` suppressions | Regex scan across `src/` & `server/` | **PASS (`0` matches)** |
| Modular file size (`<= 200` code lines per file) | ESLint `max-lines` + `.agents/scripts/check-line-limit.mjs` | **PASS (`0` violations)** |
| Zero `dangerouslySetInnerHTML` or raw SQL (`$queryRawUnsafe`) | Regex scan across `src/` & `server/` | **PASS (`0` matches)** |
| Zero secrets or auth tokens in `localStorage` or Git | E2E `auth.spec.ts` + `git ls-files` `.env` check | **PASS (`NO_TRACKED_DOTENV`)** |

---

## 2. OWASP & Application Security Controls

1. **Authentication & Session Hygiene (`server/modules/auth/`, `server/middleware/auth.ts`)**
   - Passwords hashed with Node `crypto.scrypt` (`N=16384, r=8, p=1`, random 16-byte salt) and verified via `crypto.timingSafeEqual`.
   - Opaque 256-bit session tokens stored only as `SHA-256` hashes in PostgreSQL (`Session.tokenHash`) and delivered via `HttpOnly; SameSite=Lax; Path=/` (`Secure` in production with `app.set('trust proxy', 1)`).
   - Password-reset and invitation tokens are single-use `SHA-256` hashed secrets with strict expiry timestamps.

2. **CSRF Defense (`server/middleware/auth.ts`, `src/lib/apiClient.ts`)**
   - Every state-mutating cookie-authenticated endpoint (`POST`, `PUT`, `PATCH`, `DELETE`) enforces `X-CSRF-Token` using `crypto.timingSafeEqual` against the session-bound CSRF token held only in browser memory.

3. **Broken Access Control / IDOR Prevention (`requireTripRole`, `socketServer.ts`)**
   - Every `/api/trips/:tripId/*` route (including activities, AI proposals, votes, budgets, expenses, settlements, and JSON/ICS/CSV exports) verifies `TripMember` membership and role (`OWNER`, `EDITOR`, `MEMBER`, `VIEWER`), returning `403 FORBIDDEN` to non-members without leaking existence or metadata.
   - Socket.IO handshakes validate the `roamigo_session` cookie and verify `TripMember` access before joining `trip:<tripId>` rooms (`tests/api/votes-realtime.test.ts`).

4. **Input Validation, Open Redirect & Injection Hardening**
   - All request bodies, route parameters, `localStorage` imports, and upstream AI JSON payloads are validated with Zod schemas; body sizes are capped (`100kb` default, `1mb` on itinerary/import endpoints).
   - **Audit Finding Remediated (`src/pages/AuthPage.tsx`):** Hardened `?next=` post-login redirect handling via `sanitizeInternalRedirect()`, blocking `https://`, `//`, and `/\` backslash open-redirect vectors (`tests/unit/security.test.ts`).
   - **CSV Formula Injection (`src/lib/domain/exports.ts`):** `sanitizeCsvCell()` prefixes leading `=`, `+`, `-`, `@`, `\t`, and `\r` strings with `'` and applies RFC 4180 quote escaping (`tests/unit/exports.test.ts`).

5. **Privacy & PII Minimisation**
   - Raw member email addresses are never sent in upstream AI prompts (`tests/api/ai-engine.test.ts`).
   - Non-owner collaborators cannot view or export another member's email unless `privacyShareEmail === true` (`tests/api/settings-exports.test.ts`).
   - `DELETE /api/users/me` revokes active sessions, deletes owned private trips, and anonymizes shared collaborator expense references (`Deleted Traveller`).

---

## 3. Dependency Vulnerability Review (`npm audit`)

`npm audit --omit=dev` was reviewed prior to `v1.0.0-rc.1`:
- **`react-router` (`GHSA-wrjc-x8rr-h8h6` / `GHSA-337j-9hxr-rhxg`):** Remediating via `npm audit fix --force` requires a breaking major upgrade to `react-router-dom@7`. Roamigo uses client-side SPA routing only (no SSR `deserializeErrors()` hydration) and explicitly sanitizes backslash/protocol redirects in `sanitizeInternalRedirect()`.
- **`zod` (`GHSA-mrhx-c7xc-m3w5`):** Upgrading to `zod@4` is a breaking major API change. Memory exhaustion from oversized collections is mitigated at the HTTP boundary by Express `100kb` JSON body limits and explicit `.max()` array bounds on all schemas.
- **`prisma` CLI (`GHSA-ggr8-5vv4-36mx` in `deepmerge-ts`):** Build/migration CLI dependency only (`prisma@7` is a breaking major upgrade); never exposed to untrusted runtime user input.
