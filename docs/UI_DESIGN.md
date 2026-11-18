# Roamigo — UI/UX Research, Three Visual Directions & Design Tokens

**Product:** Roamigo (*Less Arguing, More Wandering.*)  
**Target Audience:** University students, friend groups, couples, and budget-conscious collaborative travellers.  
**Status:** Milestone 0 — Three Visual Directions Presented for Human Selection

---

## 1. Reference Inspection across All 6 Benchmarks

| # | Reference | URL | Inspection Method & Status | Key Extracted Design Patterns |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Wanderlog** | https://wanderlog.com/ | Live Chrome `HTTP 200` (`ref-1-wanderlog.png`) | Crisp white hero above an immediate 50/50 split product workspace: structured chronological logistics cards (`Undo/Redo`, `Share`, confirmation badges, exact prices) paired with a live map using colour-coded category pins and day filters. |
| **2** | **Traw Travel Companion** *(Taqwah)* | https://me.muz.li/taqwah/travel-guide-travel-companion-dashboard-design-2 | Live Chrome `HTTP 200` (`ref-b-muzli.png`) | Pill-segmented top nav, structured trip metadata pills (`Departure`, `Arrival`, `Vibe`), vertical daily spend bar chart with peak-day callout, clean chronological trip rows, `1px` subtle card borders. |
| **3** | **AI Travel Plan Dashboard** *(Pickolab Studio)* | https://dribbble.com/shots/27165361-AI-Travel-Plan-Dashboard-Itinerary-Suggestion | Live Chrome inspected (`ref-c-dribbble.png`) | Slim icon rail + left AI prompt column + centre scrollable numbered day timeline with square thumbnails + right interactive map with route polylines, photo callout cards, and collapsible chevron (`«`). |
| **4** | **Travel Planning Web App** *(Ronas IT)* | https://dribbble.com/shots/27117356-Travel-Planning-Web-App-with-Itinerary-Builder | Live Chrome inspected (`ref-d-dribbble.png`) | Warm soft-ivory canvas, high-contrast capsule navigation, expressive editorial display headings, photography-first destination cards with unit budget/duration metrics (`€1,200 / 7 days`, `7–10 days`). |
| **5** | **AI Travel Planner Chat Result** *(Pickolab Studio)* | https://dribbble.com/shots/26797812-AI-Travel-Planner-Chat-Result-Dashboard | Title verified + web design synthesis *(page embeds login reCAPTCHA script; passive policy respected)* | Pairs conversational travel refinement prompts with structured side-by-side itinerary result cards rather than unstructured text walls. |
| **6** | **Waypoint Travel Planning App** *(M. R. S. Alaratte)* | https://dribbble.com/shots/27826978-Waypoint-Travel-Planning-App-Web-UI | Title verified + web design synthesis *(passive anti-bot policy respected)* | Clean SaaS workspace hierarchy uniting trip progress milestones, budget trackers, and structured day schedules. |

---

## 2. Three Distinct Visual Directions for Approval

### Direction A — Premium Minimalist Travel SaaS
*(Inspired by Reference 2 Traw/Taqwah, Reference 6 Waypoint, and Linear-grade financial clarity)*

- **Colour Palette:** Primary Forest Teal `#103D3B`, Crisp White `#FFFFFF`, Cool Alabaster `#F8FAFC`, Slate Ink `#0F172A`, Muted `#64748B`, Hairline `#E2E8F0`, Emerald `#16A34A`, Amber `#D97706`, Crimson `#DC2626` (Dark: `#0B1514` canvas, `#12211F` cards, `#A7F3CF` primary action).
- **Typography:** `Inter` (`400–700`) for headings and dense UI + `JetBrains Mono` (`500`) for integer-accurate currency figures, splits, and vote tallies (`tabular-nums`).
- **Desktop & Mobile Layouts:** Persistent `240px` left navigation sidebar + `12-column` structured workspace grid on desktop; compact top header + slide-over navigation sheet + stacked KPI/activity cards on mobile.
- **Component & Dashboard Design:** `1px` crisp bordered cards (`10px` radius), restrained shadows, dense Recharts spending bars, clear RBAC badges (`Owner`, `Editor`), and spreadsheet-clean expense settlement tables.
- **Navigation Structure:** Sidebar-first SaaS hierarchy (`My Trips`, `Itinerary`, `Members`, `Voting`, `Budgets & Splits`, `Exports`, `Settings`).
- **Advantages:** Highest scannability for complex 10-step wizards, voting matrices, and penny-exact financial settlements; fastest accessibility compliance.
- **Trade-offs:** Can feel slightly utilitarian on the public marketing landing page unless paired with strong destination photography.

---

### Direction B — Map-First AI Travel Planning Workspace
*(Inspired by Reference 1 Wanderlog, Reference 3 & 5 Pickolab Studio)*

- **Colour Palette:** Deep Lagoon `#0E3A38`, Electric Mint `#A7F3CF`, Mist Canvas `#F2F7F6`, Pure White `#FFFFFF` floating sheets, Charcoal `#17302D`, Secondary `#5B6E6B`, Route Teal `#0D9488`, Warning `#D97706`, Error `#DC2626` (Dark: `#091413` map chrome, `#102321` floating panels).
- **Typography:** `Plus Jakarta Sans` (`400–700`) across all headings, map popovers, timeline pills, and AI diff cards.
- **Desktop & Mobile Layouts:** Full-viewport (`100vh`) spatial canvas on desktop—slim `56px` left icon rail, `440px` centre scrollable day timeline, and fluid `MapLibre GL JS` right canvas with collapsible staged AI diff drawer; on mobile (`375px`/`390px`), independent `List | Map | AI` view switcher + bottom snap drawer.
- **Component & Dashboard Design:** Numbered map-pin badges synced 1:1 with timeline cards, compact horizontal time-slot strips (`09:30–11:30`), inline Before/After AI diff banners showing `est.` cost deltas, and floating day filter pills.
- **Navigation Structure:** Slim workspace icon rail + contextual top trip bar (`Trip Switcher`, `Day 1..N`, `Share`, `Active Consensus %`).
- **Advantages:** Unmatched geographical intuition; makes itinerary editing, route sequencing, and AI adjustments feel alive and immediate.
- **Trade-offs:** Heavy map emphasis is less suited to non-spatial screens (Settings, Expense Splitting tables, Authentication).

---

### Direction C — Visual, Youthful, Destination-Focused Experience
*(Inspired by Reference 4 Ronas IT Wandrly & modern student/group travel platforms)*

- **Colour Palette:** Warm Soft Ivory `#F7F9F6`, Botanical Teal `#103D3B`, Sunlit Mint `#A7F3CF`, Warm Sand `#EDEFE9`, Forest Ink `#17302D`, Slate `#64748B`, Terracotta Warning `#D97706`, Coral Error `#DC2626` (Dark: `#0D1917` warm pine, `#152724` cards).
- **Typography:** `Manrope` (`700–800`) for expressive editorial headlines & destination titles + `Plus Jakarta Sans` (`400–600`) for approachable forms, wizard cards, and voting chips.
- **Desktop & Mobile Layouts:** Top capsule navigation bar, wide editorial hero grids, photography-led trip cards (`16px` radius), visual card-based 10-step Create Trip Wizard on desktop; thumb-friendly bottom 5-tab bar and swipeable day tabs on mobile.
- **Component & Dashboard Design:** Aspect-ratio destination cover banners, stacked friend avatar clusters, visual vibe/interest pills (`🍜 Street Food`, `🏛️ Architecture`, `🥾 Outdoors`), and celebratory consensus meters.
- **Navigation Structure:** Top segmented capsule (`Explore`, `My Trips`, `Create Trip`) transitioning into tab-driven trip hubs on mobile.
- **Advantages:** Strongest emotional hook for university students, couples, and friend groups; effortless onboarding and landing-page conversion.
- **Trade-offs:** Larger photography headers reduce vertical data density inside power-user expense/voting tables if applied uniformly everywhere.

---

## 3. Recommended Cohesive Roamigo Direction & Design Tokens

> **Recommendation (Awaiting Approval):** Adopt a **purpose-matched Roamigo Design System** anchored in the shared Forest Teal (`#103D3B`) + Fresh Mint (`#A7F3CF`) + Soft Ivory (`#F7F9F6`) brand palette—using **Direction C**'s warm editorial energy on the *Public Landing Page & 10-Step Create Trip Wizard*, **Direction B**'s spatial 3-panel map + staged AI diff canvas on the *Main Trip Workspace*, and **Direction A**'s minimalist SaaS precision on *My Trips, Voting, Budgets/Settlements, Auth & Settings*.

### Canonical Semantic Tokens (`src/styles/tokens.css`)

| Semantic Token | Light Mode | Dark Mode (`.dark`) | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F7F9F6` | `#0B1716` | Page background (`Soft Ivory` / `Deep Pine`) |
| `--bg-surface` | `#FFFFFF` | `#112220` | Elevated cards, panels, modals, tables |
| `--bg-muted` | `#EEF3EE` | `#172E2B` | Subtle chips, hover fills, secondary rails |
| `--brand-primary` | `#103D3B` | `#A7F3CF` | Primary buttons, active navigation, selected day |
| `--brand-on-primary` | `#FFFFFF` | `#0B2220` | High-contrast CTA foreground (`> 10:1` WCAG AAA) |
| `--brand-accent` | `#A7F3CF` | `#1E4E4A` | Consensus highlights, AI diff badges, map callouts |
| `--text-primary` | `#17302D` | `#ECF5F2` | Headings, body copy, monetary amounts (`> 12:1`) |
| `--text-secondary` | `#64748B` | `#94A3B8` | Metadata, helper copy, timestamps (`>= 4.6:1`) |
| `--border-default` | `#E2E8E4` | `#223936` | `1px` structural card and panel borders |
| `--status-success` | `#16A34A` | `#4ADE80` | Within budget, unanimous vote, reconciled split |
| `--status-warning` | `#D97706` | `#FBBF24` | Budget threshold alert, contested majority vote |
| `--status-error` | `#DC2626` | `#F87171` | Over-budget conflict, inline validation error |

- **Preserved Logo:** Retains the original `public/favicon.svg` geometric `R` mark re-coloured to `#103D3B` + `#FFFFFF` + `#A7F3CF`.
- **Accessibility & Motion:** Visible `2px` focus rings (`outline-offset: 2px`), skeleton loaders, actionable empty states, toast notifications, and `@media (prefers-reduced-motion: reduce)` instant transitions.
