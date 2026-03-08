# ONE82 File-by-File Build Order

Date: 2026-03-03
Source: docs/one82-app-changes-roadmap.md

## Execution Rules
- Keep Auth/Trial mode free of simulated data.
- Every import/integration change must produce immediate visible UI impact.
- Prioritize trust bugs before feature expansion.

## Sprint 1 (P0): Trust + Functional Defects

### Task 1 — Fix transaction search
Files:
- components/Transactions.tsx
- services/storage.ts (only if resolved fetch/load is needed)

Implementation:
- Add `searchQuery` state and memoized filtered list.
- Filter by id, customer, items, amount string, date string, category, and status.
- Render filtered list in desktop and mobile tables.

Acceptance:
- Search returns correct rows for customer/id/date/item/category.
- Works after manual add transaction and after CSV import.

Dependencies:
- None.

Risk:
- Low (UI-only if local list filtering).

---

### Task 2 — Fix real-time analysis rendering (showing only last word)
Files:
- components/Dashboard.tsx
- services/geminiService.ts

Implementation:
- In streaming callback, append chunks to prior state instead of replacing state per chunk.
- Reset text buffer before each new run/refresh.
- Ensure cache stores full final text, not partial token.

Acceptance:
- Full analysis sentence/paragraph appears after refresh.
- No one-word output in demo or auth mode.

Dependencies:
- Task 6 (settings cleanup) optional if AI style labels are adjusted.

Risk:
- Medium (streaming + cache interaction).

---

### Task 3 — Fix contrast/readability issues across merchant tabs
Files:
- components/Dashboard.tsx
- components/Forecast.tsx
- components/Transactions.tsx
- components/Customers.tsx
- components/DataChat.tsx
- components/InventoryIntelligence.tsx

Implementation:
- Normalize text/background class combinations for light/dark.
- Remove low-contrast opaque containers and weak text tokens.
- Verify active tab content title and body legibility.

Acceptance:
- No white-on-white or unreadable text in merchant surfaces.
- Critical headings and buttons are readable in both themes.

Dependencies:
- None.

Risk:
- Medium (broad visual pass).

---

### Task 4 — Fix Smart Tasks creation/persistence
Files:
- components/TodoList.tsx
- services/storage.ts
- types.ts (if a new task type is added)

Implementation:
- Persist task list to storage per role/user.
- Merge seeded starter tasks with user-created tasks once, then preserve edits.
- Ensure add/complete/delete survives reload and auth session restore.

Acceptance:
- User can add a task and still see it after refresh.
- Auto-generated tasks do not duplicate every mount.

Dependencies:
- None.

Risk:
- Medium (state initialization and merge rules).

## Sprint 2 (P1): IA + Role Experience

### Task 5 — Profitability IA split (rep analytics -> Team, merchant analytics -> Profitability)
Files:
- components/Profitability.tsx
- components/Team.tsx
- components/Layout.tsx
- App.tsx

Implementation:
- Move rep-centric summaries/charts from Profitability into Team.
- Rebuild Profitability as merchant-centric (margin, volume, trend by merchant).
- Keep nav labels aligned to actual content.

Acceptance:
- Team page is clearly rep-centric.
- Profitability page is clearly merchant-centric.

Dependencies:
- Task 1 (transaction search) and imported data quality improve merchant profitability quality.

Risk:
- High (information architecture + content rewrite).

---

### Task 6 — Role-aware settings cleanup
Files:
- components/Settings.tsx
- types.ts
- App.tsx (if role data needs additional propagation)

Implementation:
- Hide Business Type input when user role is ISO/Overseer.
- Remove or repurpose Monthly Revenue Goal for roles where irrelevant.
- Replace “Production Readiness Checklist” with plain trust/system status copy.

Acceptance:
- No role sees irrelevant settings fields.
- Settings language is clear and user-facing.

Dependencies:
- None.

Risk:
- Low.

---

### Task 7 — Profile interaction model (top + bottom profile entry points)
Files:
- components/Layout.tsx
- App.tsx
- components/MerchantProfile.tsx (or new shared profile page component)
- components/Settings.tsx (if profile edit remains partially here)

Implementation:
- Make header avatar and sidebar user card clickable.
- Route to dedicated profile view using `activeView` pattern.
- Support editing profile fields relevant to role.

Acceptance:
- Clicking profile entries always opens profile editor view.
- Edits persist and reflect in layout card/header.

Dependencies:
- Task 6.

Risk:
- Medium (new navigation/view state wiring).

---

### Task 8 — Add inventory item search
Files:
- components/InventoryManager.tsx

Implementation:
- Add search input for item name/SKU.
- Filter list/table rows in real time.
- Preserve existing reorder interaction.

Acceptance:
- User can find an item quickly by text query.

Dependencies:
- None.

Risk:
- Low.

## Sprint 3 (P1/P2): Integrations UX + Strategic Expansions

### Task 9 — Integrations UX upgrade (speed, security cues, first-run guidance)
Files:
- components/Integrations.tsx
- services/storage.ts
- services/integrationsConfig.ts
- App.tsx (for first-login checklist modal trigger)
- api/data/imports.ts (if additional import feedback payloads are needed)

Implementation:
- Improve first-run checklist prompts by role (ISO vs Merchant).
- Improve import validation feedback and “where data landed” confirmations.
- Strengthen trust copy around key handling and data provenance.

Acceptance:
- New users know exactly what to do first.
- Import success/failure messaging is explicit and immediate.

Dependencies:
- Tasks 1, 5, 6.

Risk:
- Medium.

---

### Task 10 — Calendar concept spike (optional)
Files:
- components/Forecast.tsx (or new component)
- components/Layout.tsx

Implementation:
- Design spike only; define data model + UX proposal.

Acceptance:
- RFC/prototype ready, not production commitment.

Dependencies:
- None.

Risk:
- Low (if kept as spike).

---

### Task 11 — AI credits model review vs subscription gating
Files:
- components/Settings.tsx
- components/Dashboard.tsx
- components/Transactions.tsx
- services/storage.ts
- services/authService.ts (if entitlement source changes)

Implementation:
- Decision doc first, then gate behavior updates.
- Remove confusing credit UX if subscription-tier gating replaces it.

Acceptance:
- Single, clear AI entitlement model across all AI actions.

Dependencies:
- Product decision required.

Risk:
- High (cross-cutting behavior changes).

## Sprint 4 (Post-Pilot Ops): ISO Operations Core

### Task 12 — Centralized onboarding hub (single deal intake + processor package routing)
Files:
- types.ts
- services/storage.ts
- components/Onboarding.tsx
- components/ISODashboard.tsx
- api/data/imports.ts

Implementation:
- Data model
	- Add `OnboardingDeal` type with fields for merchant profile, owner rep, processor target, package status, and timestamps.
	- Add `OnboardingPackage` type for destination payload metadata, validation status, and submission history.
- Service/storage
	- Add scoped storage helpers for create/update/list of onboarding deals.
	- Keep backend-aware `*Resolved` behavior: local persistence first with backend sync attempt where enabled.
- API
	- Extend onboarding/import endpoint contract to accept normalized deal intake payload and return field-level validation results.
	- Return destination summary (processor target, required missing fields, package readiness status).
- UI
	- Add one ISO-facing intake flow that captures a deal once and produces destination-ready package status.
	- Add role-limited rep visibility so reps only see assigned deals/merchants.
	- Surface explicit status states: draft, validation-required, ready-to-submit, submitted.

Acceptance:
- ISO can create a deal in one workflow and see processor package readiness in the same workspace.
- Assigned rep cannot view unassigned deals.
- Validation errors are field-specific and actionable before package generation.

Dependencies:
- Existing merchant import and invite flow in `components/Onboarding.tsx`.
- Existing import audit patterns in `services/storage.ts`.

Risk:
- High (new domain objects + role-bound workflow changes).

Execution Checklist (Owner + Estimate):
- [ ] Finalize intake field contract and status model (`OnboardingDeal`, `OnboardingPackage`) — **Owner:** Backend/Data — **Estimate:** 1 day
- [ ] Implement typed storage + resolved sync helpers for deals/packages — **Owner:** Backend — **Estimate:** 1 day
- [ ] Extend `api/data/imports.ts` for deal validation + destination summary response — **Owner:** Backend — **Estimate:** 1-2 days
- [ ] Build ISO onboarding hub UI in `components/Onboarding.tsx` with status pipeline — **Owner:** Frontend — **Estimate:** 2 days
- [ ] Add rep-scoped visibility controls in `components/ISODashboard.tsx` and shared selectors — **Owner:** Frontend — **Estimate:** 1 day
- [ ] Add QA matrix for role access + validation error states + backend mode behavior — **Owner:** QA/Full-stack — **Estimate:** 1 day

Total Effort (Task 12): 7-8 engineering days

---

### Task 13 — Commission automation (monthly agent payouts + exceptions)
Files:
- types.ts
- services/storage.ts
- services/processorService.ts
- components/Team.tsx
- components/ISODashboard.tsx
- api/data/metrics.ts

Implementation:
- Data model
	- Add `CommissionPlan`, `CommissionRun`, and `CommissionLineItem` types with versioning and run status.
	- Store attribution keys (repId, merchantId, processorAccountId, period).
- Service/calculation
	- Add deterministic commission calculator service that computes payouts from trusted residual/volume inputs.
	- Add exception flags for missing attribution, stale input windows, or negative-margin merchants.
- API
	- Add commission run endpoint to persist run metadata and results for audit/replay.
	- Expose run summary endpoint for totals, exception counts, and completion timestamp.
- UI
	- Add ISO run controls: period select, preview run, finalize run.
	- Add rep-facing payout summary and ISO-facing exceptions queue with drill-down.

Acceptance:
- ISO can generate a monthly run with reproducible totals for the same input snapshot.
- Each payout line item is traceable to source merchant/rep inputs.
- Exceptions are visible and exportable before finalization.

Dependencies:
- Processor residual data normalization in `services/processorService.ts`.
- Team IA split direction (rep-centric surface in `components/Team.tsx`).

Risk:
- High (financial calculations + audit expectations).

Execution Checklist (Owner + Estimate):
- [ ] Define commission data contract (`CommissionPlan`, `CommissionRun`, `CommissionLineItem`) + attribution keys — **Owner:** Backend/Data — **Estimate:** 1 day
- [ ] Implement deterministic calculator service in `services/processorService.ts` (or sibling commission module) — **Owner:** Backend/Data — **Estimate:** 2 days
- [ ] Add run persistence + summary endpoints in `api/data/metrics.ts` — **Owner:** Backend — **Estimate:** 1-2 days
- [ ] Build ISO run controls (period, preview, finalize) in `components/ISODashboard.tsx` — **Owner:** Frontend — **Estimate:** 1 day
- [ ] Build rep payout + exception UX in `components/Team.tsx` — **Owner:** Frontend — **Estimate:** 1 day
- [ ] Add reproducibility + traceability QA checks (same snapshot => same totals) — **Owner:** QA/Full-stack — **Estimate:** 1 day

Total Effort (Task 13): 7-8 engineering days

---

### Task 14 — Buy-rate tracking and margin visibility
Files:
- types.ts
- services/storage.ts
- services/processorService.ts
- components/Profitability.tsx
- components/ISODashboard.tsx
- api/data/transactions.ts

Implementation:
- Data model
	- Add `BuyRateProfile` and `MarginSnapshot` types keyed by merchant and processor account.
	- Track effective processor cost, service fee, markup, and gross-to-net margin fields.
- Service/analytics
	- Normalize processor fee inputs into a comparable per-account monthly cost view.
	- Compute account-level and portfolio-level margin rollups by period.
- API
	- Add persistence/read endpoints for buy-rate profile updates and generated margin snapshots.
	- Include freshness timestamps and source status metadata for trust visibility.
- UI
	- Add ISO profitability views for account, rep, and portfolio margin rollups.
	- Add filters for processor, rep, and margin exception state.
	- Show explicit stale/fresh indicators on all buy-rate-driven cards.

Acceptance:
- ISO can compare processor cost vs service-fee/markup at account and portfolio level.
- Margin views clearly identify stale data and last successful refresh.
- Calculations remain available in demo mode with simulated provenance labels and in backend mode with trusted-source gating.

Dependencies:
- Data freshness indicator pattern and trust-state conventions.
- Integration reliability work for processor sync completeness.

Risk:
- Medium-High (depends on fee normalization quality across processors).

Execution Checklist (Owner + Estimate):
- [ ] Define buy-rate and margin types (`BuyRateProfile`, `MarginSnapshot`) and freshness metadata — **Owner:** Backend/Data — **Estimate:** 1 day
- [ ] Normalize processor fee inputs into unified monthly cost model in `services/processorService.ts` — **Owner:** Data/Backend — **Estimate:** 2 days
- [ ] Add buy-rate profile + margin snapshot persistence/read APIs in `api/data/transactions.ts` — **Owner:** Backend — **Estimate:** 1-2 days
- [ ] Build ISO rollup views/filters in `components/Profitability.tsx` and `components/ISODashboard.tsx` — **Owner:** Frontend — **Estimate:** 2 days
- [ ] Add stale/fresh indicators and provenance handling on all margin cards — **Owner:** Frontend — **Estimate:** 1 day
- [ ] Add QA checks for demo provenance labels vs backend trust gating — **Owner:** QA/Full-stack — **Estimate:** 1 day

Total Effort (Task 14): 8-9 engineering days

Combined Post-Pilot Ops Effort (Tasks 12-14): 22-25 engineering days

## Current Week: Do First / Do Next

### Do First (high confidence, fast wins)
1. components/Transactions.tsx — implement working search.
2. components/Dashboard.tsx + services/geminiService.ts — fix chunk rendering.
3. components/TodoList.tsx + services/storage.ts — persist tasks.
4. Merchant contrast pass on Dashboard/Forecast/DataChat/Customers/Transactions.

### Do Next (after P0 merged)
5. components/Settings.tsx — role-aware settings cleanup.
6. components/Layout.tsx + App.tsx + profile component — clickable profile flow.
7. components/InventoryManager.tsx — item search.
8. Profitability/Team IA split.

## Dependency & Risk Summary
- Highest-risk refactor: profitability/team IA split.
- Highest trust impact: transaction search + real-time analysis rendering + settings cleanup.
- Highest regression risk: changing shared profile/navigation behavior.
- Keep each task in a separate PR-sized change for safer rollout.

## Ready-to-Run Work Package Order
1. Transaction search
2. Real-time analysis stream fix
3. Smart task persistence
4. Contrast pass
5. Settings role cleanup
6. Profile click-through page
7. Inventory item search
8. Profitability/team split
9. Integrations UX upgrade
