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
