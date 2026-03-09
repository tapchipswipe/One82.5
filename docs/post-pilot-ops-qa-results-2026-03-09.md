# Post-Pilot Ops QA Results — 2026-03-09

Tester: GitHub Copilot (GPT-5.3-Codex)
Date: 2026-03-09
Scope: Centralized Onboarding Hub, Commission Automation, Buy-Rate Tracking

## Automated Verification

### 1) Build/Type/Lint
- Command: `npm run check`
- Result: **PASS**
- Evidence: TypeScript, ESLint, and Vite build all completed successfully.

### 2) Premises/Environment Baseline
- Command: `npm run ops:premises`
- Result: **PASS**
- Evidence:
  - Required workspace/migration files present.
  - Required scripts configured.
  - Vercel runtime/security header policy present.
  - Supabase env keys present in templates.
  - GitHub + Vercel CLI auth detected.

### 3) Health Endpoint (production deployment)
- Command attempted: `npm run ops:health`
- Result: **FAIL** (expected under deployment protection)
- Cause: Script uses direct fetch and cannot pass Vercel deployment protection; response is HTML auth page.

- Verified with protected-channel command:
  - `vercel curl /api/health --deployment https://one82-5-qrqbebeqk-tapchipswipes-projects.vercel.app`
- Result: **PASS**
- Evidence payload:
  - `ok: true`
  - `service: one82-api`
  - `supabase.configured: true`
  - `supabase.connected: true`

## Feature QA Status (This Run)

### A) Centralized Onboarding Hub
Status: **PASS (code/path verification), Manual UI confirmation pending**

Verified in code:
- Processor destination package mapping is generated and persisted (`onboardingPackage.destinationSystem`).
- Scoped rep behavior is enforced when rep identity is inferred from imported team data.
- Deal visibility is filtered to scoped rep when applicable.
- Status transitions persist through resolved storage path.

Primary files:
- `components/OnboardingHub.tsx`
- `types.ts`
- `api/data/imports.ts`
- `api/_lib/backend.ts`

### B) Commission Automation
Status: **PASS (code/path verification), Manual UI confirmation pending**

Verified in code:
- Assignment is deterministic (imported merchant->rep mapping first, stable hash fallback second).
- Residual base uses buy-rate markup/service fee when available.
- Exception labeling is deterministic when buy-rate profile is missing.
- Commission runs persist via resolved storage and backend write path.
- Rep rollup table added for operational visibility.

Primary files:
- `components/Team.tsx`
- `services/storage.ts`
- `api/data/metrics.ts`

### C) Buy-Rate Tracking
Status: **PASS (code/path verification), Manual UI confirmation pending**

Verified in code:
- Merchant buy-rate edits persist through resolved storage/backend path.
- Portfolio rollup card block added (gross volume, processor cost, net margin).
- Rep margin rollup table added and computed from filtered rows.

Primary files:
- `components/Profitability.tsx`
- `services/storage.ts`
- `api/data/transactions.ts`

### D) Stripe-first Sync Hardening
Status: **PASS (code/path verification), Manual UI confirmation pending**

Verified in code:
- Explicit Stripe sync action in Integrations.
- Live fetch error handling and normalization in processor service.
- Sync import audit entries and user alerts added.
- Transaction dedupe + persisted landing path implemented.

Primary files:
- `components/Integrations.tsx`
- `services/processorService.ts`

## Checklist Gap: Manual Browser Validation Still Required

The following checklist items from `docs/post-pilot-ops-qa-checklist.md` require human browser interaction and were **not** executable in this non-interactive terminal run:

- End-to-end UI flows for creating/submitting onboarding deals in both demo/backend profiles.
- Visual verification of Team and Profitability interactions after refresh/re-login.
- Processor filter interaction and chart/table consistency checks by direct UI manipulation.
- Screenshot/video capture requirements from the checklist log template.

## Recommended Next Manual Pass

1. Follow `docs/post-pilot-ops-qa-checklist.md` scenarios in browser (Demo + Backend profiles).
2. Use the latest production deployment and local build for side-by-side validation.
3. Capture screenshot/video links per scenario ID and append them to this file.
