# Roamigo

**Plan Together, Travel Better.**

Roamigo is a group travel planning web application that helps friends resolve conflicting budgets, interests, and preferences without endless group chats.

## Features

- **Trip & Traveller Setup:** Configure candidate destinations, travel dates, group size, and currency (`GBP`, `USD`, `EUR`), then add or remove travellers with individual budgets, interests, and notes on a single page.
- **Inline Validation & Browser Persistence:** All trip and traveller inputs are validated with Zod, displaying inline field errors without clearing user inputs and persisting trip state in `localStorage` (`roamigo:v1:trip`) with explicit recovery warnings if storage fails.
- **Structured AI Itinerary Generation:** The Express backend (`POST /api/itinerary/generate`) invokes Gemini with a structured JSON schema and validates the response with Zod before rendering a day-by-day itinerary with compromise explanations.
- **Immediate Activity Voting:** Switch between travellers in the same browser session to upvote or downvote activities with duplicate-vote prevention and immediate score updates.
- **Deterministic Budget Calculations:** Estimated per-person totals and individual over-budget warnings are computed deterministically in TypeScript (`src/lib/budget.ts`) whenever activities are included/excluded or budgets change. All displayed prices are estimates (`est.`), not live booking quotes.

## Technology Stack

- **Frontend:** React 18, TypeScript (strict mode), Vite, Tailwind CSS v4
- **Backend:** Node.js, Express, `@google/genai` (Gemini Developer API or Vertex AI ADC)
- **Validation & Persistence:** Zod schemas (`src/lib/schemas.ts`) and browser `localStorage` (`roamigo:v1:trip`)
- **Testing & Quality:** ESLint (with `max-lines` 200-line enforcement), TypeScript compiler checks, Vitest, Supertest, and Playwright (Chrome)

## Prerequisites

- Node.js `v22+` and `npm`

## Environment Configuration (Server-Side Only)

Copy `.env.example` to `.env` and configure your server-side Gemini credentials before generating live AI itineraries:

```bash
cp .env.example .env
```

Set one of:
- **Option A (Gemini Developer API):** `GEMINI_API_KEY` and `GEMINI_MODEL`
- **Option B (Vertex AI ADC):** `GCP_PROJECT_ID`, `GCP_LOCATION`, and `GEMINI_MODEL` (requires `aiplatform.endpoints.predict` / `roles/aiplatform.user` permission)

Never commit `.env` or expose API credentials to the browser.

## Run From a Clean Checkout

Run a single command from the repository root to install dependencies and launch both the Vite frontend (`:8080`) and Express API server (`:3001`):

```bash
npm install && npm run dev -- --host 0.0.0.0 --port 8080
```

Then open `http://localhost:8080` in your browser.

## Verification & Quality Scripts

- `npm run lint` — ESLint checks (including the 200-line `max-lines` limit on `src/` and `server/`)
- `npm run typecheck` — Strict TypeScript checks for frontend and server
- `npm run test` — Vitest unit and API integration tests (`tests/unit/`, `tests/api/`)
- `npm run build` — Production Vite + TypeScript server build (`dist/`, `dist-server/`)
- `npm run test:e2e` — Playwright acceptance tests in Chrome (`tests/e2e/acceptance.spec.ts`)
- `npm run start` — Serve the production build via Express (`NODE_ENV=production`)

## Project Structure

- `src/components/` — React UI components (`TripSetupForm`, `TravellerForm`, `TravellerList`, `BudgetSummaryBar`, `ItineraryPanel`, `ActivityCard`, `FormField`)
- `src/lib/` — Zod schemas, deterministic budget/voting logic, `localStorage` persistence, and API client
- `server/routes/` & `server/services/` — Express API routes and Gemini structured-output client
- `tests/` — Unit, API integration, and Playwright browser acceptance tests

## Known Limitations

- **Server-Side AI Credentials Required:** Live itinerary generation (`POST /api/itinerary/generate`) requires either a valid `GEMINI_API_KEY` or a Google Cloud service account/ADC with `aiplatform.endpoints.predict` (`roles/aiplatform.user`) and `GEMINI_MODEL` configured in `.env`. Without credentials, `/api/health` reports `aiConfigured: false` and live generation returns `503`.
- **Single-Browser Persistence:** Trip state, votes, and included/excluded activity selections are stored locally in the browser (`localStorage`). There is no backend database, user authentication, or real-time multi-device sync.
- **Estimated Pricing Only:** Activity costs and per-traveller budget warnings are deterministic estimates (`est.`) derived from the generated plan, not live booking quotes or external pricing APIs.
