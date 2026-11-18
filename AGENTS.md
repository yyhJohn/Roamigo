# Project: TripConsensus
An AI-powered group travel planning web app. Follow the product brief and its acceptance criteria.

## Stack
- React, TypeScript, Vite and Tailwind CSS for the frontend.
- Node.js and Express for the backend; Gemini API for itinerary generation.
- LocalStorage for trip persistence. No database or authentication.

## Engineering Rules
- Keep UI components in `src/components/`, business logic in `src/lib/`, API routes in `server/routes/`, and tests in `tests/`.
- Enable TypeScript strict mode. Do not use `any` or suppress type errors.
- Keep source files under 200 lines (excluding blank lines and comments); split larger modules by responsibility, and enforce this limit automatically via ESLint `max-lines`.
- Validate traveller inputs and AI responses with Zod; display inline errors without losing user input.
- Never swallow `localStorage` or JSON parse errors silently; log or surface recovery warnings, and verify entry assets load with HTTP 200 and zero `404`/`500` console errors in headless Chrome.
- Keep API credentials server-side in environment variables. Never expose secrets to the browser or commit them.
- Require structured JSON from Gemini; validate it before rendering.
- Calculate costs, budget warnings and vote totals using deterministic TypeScript functions, not AI.
- Display all prices as estimates, with a consistent currency.
- Add loading, success and error states for every AI request.
- Test budget calculations, voting, input validation and malformed AI responses.
- Do not add features outside the brief or dependencies without written justification.

## Definition of Done
- `npm run lint` and `npm run typecheck` pass without errors.
- `npm run test` and `npm run build` exit successfully.
- `npm run dev -- --host 0.0.0.0 --port 8080` serves the working app.
- Verify every acceptance criterion in the browser before declaring completion; configure all required npm scripts and report any failed checks.
