# Trust Hardening Release Note — 2026-03-09

## Scope
This release closes key trust and governance gaps across API authorization, blocked-AI remediation UX, overseer visibility scope, and CI/CD governance enforcement.

## Delivered

### 1) API-layer RBAC hardening
- Added shared authorization guard in `api/_lib/backend.ts`:
  - `requireAuthorized(req, res, allowedRoles)`
  - `sendForbidden(res)`
- Migrated auth/data endpoints to centralized guard usage:
  - `api/auth/profile.ts`
  - `api/auth/session.ts`
  - `api/data/transactions.ts`
  - `api/data/metrics.ts`
  - `api/data/calendar.ts`
  - `api/data/notifications.ts`
  - `api/data/notifications/read.ts`
  - `api/data/ops.ts`
  - `api/data/imports.ts`
- Enforced elevated-role access where required:
  - `api/data/ops.ts` and `api/data/imports.ts` require `iso | overseer`.

### 2) Blocked-AI remediation deep links
- Added one-click remediation CTAs for blocked Auth-mode AI states:
  - `components/Dashboard.tsx`
  - `components/Forecast.tsx`
  - `components/DataChat.tsx`
  - `components/AIReport.tsx`
- Routed via app navigation wiring in `App.tsx`.

### 3) Settings-backed projection confidence control
- Added `showAiConfidenceInProjections` setting:
  - Type model: `types.ts`
  - Default + resilient settings merge: `services/storage.ts`
  - User toggle control: `components/Settings.tsx`
  - Consumption in forecast surface: `components/Forecast.tsx`

### 4) Overseer cross-tenant ops visibility
- Extended ops API to support overseer global scope:
  - `GET /api/data/ops?scope=all`
  - Tenant filtering bypass only for overseer in global mode
  - Response includes scope metadata: `scope`, `tenantCount`
- Updated Overseer UI to request and display global coverage:
  - `components/OverseerDashboard.tsx`

### 5) Governance automation (CI/CD)
- Added governance workflow: `.github/workflows/governance.yml`
- PR governance gates for trust-boundary changes:
  - Requires meaningful `## Trust Change Notes` section in PR body
  - Requires reviewer assignment or approval
- Direct push governance on `main` / `master`:
  - If trust-boundary files change and commit is not PR-associated, requires commit trailer:
    - `Trust-Note: <what changed + risk/rollback summary>` (minimum 20 chars)
- Production rollback tags:
  - After successful `Quality Checks` workflow runs on `main`/`master`, auto-creates rollback tag:
    - `rollback-<branch>-<runid>-<sha7>`

### 6) Governance documentation updates
- Added structured trust notes section to PR template:
  - `.github/pull_request_template.md`
- Documented governance automation and direct-push trust-note format:
  - `README.md`

### 7) Trust-surface consistency
- Added source + freshness indicators across major analytics surfaces:
  - `components/Transactions.tsx`
  - `components/Profitability.tsx`
  - `components/Forecast.tsx`
  - `components/Customers.tsx`
  - `components/CalendarPlanner.tsx`
  - `components/MerchantLedger.tsx`
  - `components/ISODashboard.tsx`
  - Existing trust surface retained in `components/OverseerDashboard.tsx` and `components/AIReport.tsx`
- Normalized freshness wording across views to consistent language.

## Validation Status
- Local quality gate passes:
  - `npm run check`
  - Includes: typecheck, lint, build
- Current state: zero lint errors, zero lint warnings after cleanup.

## Operational Notes
- PRs touching trust-boundary files now fail governance checks unless trust-note and reviewer requirements are met.
- Direct production pushes that bypass PR flow now require explicit trust-note commit trailers for trust-boundary changes.
- Rollback tags are automatically created after successful quality runs on production branches.

## Residual Follow-ups (Recommended)
- Consider branch protection rules to require Governance Gates and Quality Checks as required status checks before merge.
- Optionally add a small contributor guide snippet with commit examples for `Trust-Note:` trailer usage.
