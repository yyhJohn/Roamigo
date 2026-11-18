# Roamigo — Production Product Specification

**Product Name:** Roamigo  
**Tagline:** *Less Arguing, More Wandering.*  
**Target Audience:** University students, groups of friends, couples, and budget-conscious collaborative travellers.

---

## 1. Product Vision & Core Principles

Group trips stall in fragmented chats because companions have different budgets, travel paces, and wishlists. Roamigo turns group travel planning into a transparent, consensus-driven workflow:
1. **Honest Group Consensus:** Surface disagreements and personal budget caps early instead of hiding behind majority votes.
2. **AI Proposes, Humans & Deterministic Math Decide:** AI generates structured itineraries and staged modification previews; deterministic TypeScript/PostgreSQL code enforces permissions, vote counts, budgets, splits, and settlements.
3. **Zero Fabricated Claims or Geography:** Never display fake user counts, invented reviews, or hallucinated coordinates/routes.

---

## 2. User Roles & Permission Matrix (Backend-Enforced)

Every trip enforces explicit membership roles on all REST and WebSocket operations:

| Action | `OWNER` | `EDITOR` | `MEMBER` | `VIEWER` |
| :--- | :---: | :---: | :---: | :---: |
| View trip, itinerary, map, votes, budget & exports | Yes | Yes | Yes | Yes |
| Submit/update own preferences, personal budget & cast votes | Yes | Yes | Yes | No |
| Log shared expenses & view settlements | Yes | Yes | Yes | Read-only |
| Create/edit/reorder/toggle activities, run AI generation & apply AI diffs | Yes | Yes | No *(can suggest)* | No |
| Finalise contested activity decisions | Yes | Yes | No | No |
| Invite/remove members & change roles (`Editor`/`Member`/`Viewer`) | Yes | No | No | No |
| Archive/delete trip or transfer trip ownership | Yes | No | No | No |

---

## 3. Functional Specification by Surface

### 3.1 Public Landing Page (`/`)
- Authentic Roamigo branding, travel-editorial hero, interactive live consensus/budget preview widget, feature walkthrough (AI itinerary synthesis, per-member voting, integer-accurate expense splitting), 3-step *How It Works*, honest FAQ, and **Get Started** / **Sign In** / **Try Demo Trip** CTAs.
- Zero fabricated customer numbers, partner logos, or fake testimonials.

### 3.2 Authentication & Account Lifecycle (`/auth/*`)
- Email + password registration & login (`scrypt` password hashing, `HttpOnly` secure session cookie), logout, forgot-password token generation, password reset, optional email verification hook (active when SMTP env vars are configured; clearly surfaced in dev log/status otherwise), and optional Google OAuth (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` feature-flagged).
- Never store session tokens or secrets in `localStorage`.

### 3.3 My Trips Dashboard (`/trips`)
- Filterable views: **Upcoming**, **Drafts**, **Past**, **Shared With Me**, plus clearly badged **Demo Trip** (`Barcelona Spring Break`) and a **One-Click Import Local MVP Trip** banner whenever `'roamigo:v1:trip'` data is detected in browser `localStorage`.
- Cards display licensed destination cover photography, dates, member avatars, consensus progress (`% activities resolved`), and personal/group budget status.

### 3.4 10-Step Create Trip Wizard (`/trips/new` & `/trips/:id/setup`)
1. Destination or candidate destinations  
2. Departure city/origin  
3. Travel start & end dates  
4. Target group size  
5. Trip currency (`GBP`, `USD`, `EUR`) & shared/personal baseline budget  
6. Accommodation style (hostel, boutique hotel, apartment, mixed)  
7. Transportation preferences (public transit, rail, walkable, rental car)  
8. Personal interests tags  
9. Travel pace (`relaxed`, `balanced`, `packed`) & accessibility needs  
10. Summary review, save draft, or generate initial AI itinerary  
- Supports saving unfinished drafts at any step, stepping backward/forward without losing inputs, and inline Zod field validation.

### 3.5 Main Trip Workspace (`/trips/:id`)
- **Desktop 3-Panel Layout:**
  - *Left Sidebar:* Trip switcher, section links (`Itinerary`, `Members`, `Voting`, `Budget & Expenses`, `Exports & Settings`), member list, and consensus summary.
  - *Centre Workspace:* Day-by-day tabs & chronological timeline, manual add/edit activity modal, drag-and-drop reordering **plus** accessible keyboard Move Up / Move Down buttons, category badges, start/end times, `"est."` prices, inclusion toggles, member preference tags, compromise explanations, and save/regenerate actions.
  - *Right Contextual Panel (switchable tabs, collapsible):* **Interactive Map**, **Live Budget Summary**, or **Contextual AI Assistant**.
- **Mobile Layout (`375px`–`767px`):** Sticky trip header, responsive timeline cards, bottom navigation bar (`Itinerary`, `Map`, `AI`, `Vote`, `Budget`), and accessible slide-up drawers.

### 3.6 Interactive Map (`MapLibre GL JS`)
- Plots only activities with verified coordinates (curated city landmarks or server-geocoded locations).
- Bidirectional selection: clicking an activity card centres/highlights its map marker; clicking a marker opens its activity popover.
- Day filter pills (`All Days`, `Day 1..N`), automatic `fitBounds`, optional polyline route rendering when provider/verified geometry exists, required OpenStreetMap/OpenFreeMap tile attribution, and clear non-blocking notices when an activity lacks verified coordinates.

### 3.7 Contextual AI Travel Assistant
- Scoped strictly to the authenticated user's authorised trip and member preferences.
- Quick-prompt chips (*"Make this trip cheaper"*, *"Make Day 2 less busy"*, *"Add affordable local food"*, *"Adjust for rainy weather"*) + custom prompt input.
- Returns structured **Proposed Itinerary Diff**: lists added, replaced, or removed activities alongside deterministic **Before vs. After per-person budget impact**.
- Requires explicit **Confirm & Apply** (creating a new `ItineraryVersion` while preserving unaffected activity votes) or **Discard**.

### 3.8 Members, Invitations & Real-Time Voting
- Tokenised, expiring invitation links (`/invites/:token`) with accept/decline flow.
- Server-enforced single vote per `(activity_id, user_id)` (`UP` or `DOWN`, toggleable/changeable).
- Displays upvote/downvote counts, participation count (`e.g. 3 of 4 voted`), consensus state (`Unanimous`, `Majority — Conflict Flagged`, `Contested`, `Pending`), and organiser finalisation lock (`Approved` / `Excluded`).
- Real-time synchronisation across browser sessions via authenticated Socket.IO rooms with optimistic version checks and authoritative refetch fallback.

### 3.9 Deterministic Budget & Expense Management
- **Separate Ledgers:** Estimated itinerary costs (`est.`) remain strictly separate from logged actual expenses.
- **Integer Minor-Unit Precision:** All values stored and computed as integer minor units (`pence` / `cents`). Zero floating-point division in splits: remainder pennies (`amountMinor % k`) are distributed deterministically by sorted participant ID so `sum(splits) === expense.amountMinor` always holds.
- **Supported Split Modes:** `EQUAL`, `CUSTOM_EXACT`, and `PERCENTAGE` (validated to `10000` basis points = `100.00%`), across any subset of trip members, with a designated payer.
- **Minimum-Transfer Settlement Engine:** Deterministic greedy net-balance solver producing minimal settlement suggestions (`Alice pays Sophie £42.00`), strictly within the trip's single currency (`GBP`, `USD`, or `EUR`).

### 3.10 Settings, Privacy & Exports (`/settings`, `/trips/:id/export`)
- User profile, preferred currency, language (`en-GB` / `en-US`), Light/Dark/System theme, and privacy controls.
- Scoped exports (accessible only to authorised trip members, stripping other users' private account emails/metadata):
  - **JSON** (portable trip + itinerary + budget snapshot)
  - **Print / PDF-ready Itinerary View** (clean `@media print` stylesheet + trigger)
  - **ICS Calendar** (`RFC 5545` `.ics` download of included timed activities)
  - **CSV Expense & Settlement Ledger** (escaped RFC 4180 CSV preventing spreadsheet formula injection)
- Full **Account & Personal Data Deletion** with cascade/anonymisation guarantees.

---

## 4. Preserved Compatibility Guarantees
- All original **AC1–AC5** user journeys remain verifiable and covered by automated tests.
- Existing `roamigo:v1:trip` `localStorage` data can be validated and imported directly into a user's PostgreSQL account without data loss.
