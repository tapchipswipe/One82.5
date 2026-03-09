# ONE82 Vision Lock v1

Date: 2026-03-04
Source: Founder yes/no decision set + clarifications

## 1) Locked Strategic Decisions

### Positioning
- Primary paid customer is the ISO (not merchant-direct).
- No B2C/small-merchant self-serve this year.
- Core value proposition: faster onboarding + pricing + risk visibility.
- Core operational value includes centralized rep onboarding, commission automation, and buy-rate visibility.
- Competitive framing is not "beating Salesforce" directly.
- Premium modern trust UX is strategic.

### Business Model
- Platform fee + per-rep pricing model.
- Merchant seats bundled by default under ISO plans.
- Annual contracts prioritized in early sales.
- AI usage is subscription-tier based (no credits).
- Overage billing can exist in v1 if needed.
- Pricing should stay simple (<= 3 plans) through pilot.
- Free trial is replaced by guided auth onboarding.

### GTM / Onboarding
- Sales-led onboarding required for every production tenant.
- No open signup for production tenants.
- Kickoff/import session required before go-live.
- First case studies should be ISO-centric.
- First customer flow: ISO credentials -> business questionnaire -> import/integration flow -> dashboard.
- Integrations should be available in trial phase (not locked/blocked).
- Centralized onboarding hub is the target operating model: one deal intake flow that routes application packages to downstream processor onboarding paths.
- Rep access for onboarding should be role-limited to assigned merchant/deal scope (no full-database access requirement).

### Trust + Data Policy
- Auth mode remains 100% non-simulated.
- Source labels shown by default on major analytics surfaces.
- In Auth mode, source labels are not mandatory on every single chart/card.
- AI insights should be blocked when provenance is missing/unknown.
- Tenant isolation must be backend-enforced.
- Browser cache is convenience only, never source of truth.

### Security / Compliance
- SOC2-readiness is a near-term objective.
- Immutable audit logs for critical actions.
- SSO/SAML stays out of initial pilot (future feature).
- PII minimization from day one.
- Customer does integration ownership; platform should support secure integration flow.
- API-layer RBAC required (not UI-only).
- Session revocation on logout required everywhere.

### Product Priorities (90 days)
- Integration reliability > new AI feature expansion.
- Statement reader accuracy is launch-critical.
- Team/Profitability IA split remains as-is for now.
- Overseer remains operational/admin, not customer-branded.
- Dark mode polish is low-medium priority (3-4/10).

### Integration Strategy
- Long-term priority is API-first; CSV remains optional fallback.
- Failed syncs must surface visible in-app alerts.
- Data freshness indicators required on integration-driven views.
- Import preview + validation + destination summary required.

### AI Rules
- AI never fabricates values when inputs are missing.
- AI outputs include rationale + data references.
- Portfolio recommendations require confidence thresholds.
- Autopilot actions require explicit human approval.
- Provider abstraction should be preserved for model swap flexibility.
- AI experience customization belongs in Settings (no dedicated AI config button).
- AI backbone integration should be actively developed now.

### UX Rules
- Profile/settings consistency by role is not frozen; can be improved.
- Dark/light parity is not a release blocker.
- Motion can go beyond minimal when product value justifies it.

### Activation Metrics
- Time-to-first-value target <= 15 minutes.
- Import success target for valid files is effectively 100%.
- Track "first insight generated" as activation event.
- No unresolved P0 trust bugs before net-new feature work.

## 2) Open Decisions To Resolve Next
- Pilot logo strategy: confirm whether to prioritize 1-3 design partners first.
- Scope freeze meaning: define if "no major modules" after current roadmap or not.
- Calendar scope: keep as concept only vs narrow production scope.
- CSV contract policy: if not public docs, define internal contract/versioning standard.
- "Golden path" integration: confirm first processor target and why.
- Auth-mode AI fallback behavior: deterministic fallback vs strict block when missing required data.
- Empty state CTA standard: define exact UX requirement by page type.
- Mobile target: functional minimum vs parity target in pilot.
- Critical toasts policy: define where success/failure must be surfaced.
- Weekly active teams metric replacement: define primary usage KPI for small ISO orgs.
- Tenant-isolation launch gate: define exact verification checklist.
- Processor package routing policy for centralized onboarding: define canonical field contract and destination mappings per processor.
- Buy-rate semantics lock: confirm whether "buy-rate tracking" includes markup floor controls in v1 or analytics-only first.

## 3) Founder Clarifications Captured
- Merchant onboarding model needs decision:
  - ISO-invited link self-setup vs
  - ISO-created merchant profile via CSV + auto-email invites.
- Trial phase should unlock integrations.
- AI should be embedded by default (not user-provided key as core model).
- AI personalization settings should include style, vocabulary, presentation, memory/history behavior.
- Potential future tab: AI-generated one-page business report.

## 4) Daily Question Workflow (for async progress)
- Run one short founder check-in daily ask as many questions as needed:
  -  product questions
  -  UX/trust questions
  -  go/no-go implementation decision
- Use answer format: Y/N/Short text.
- Convert each day into:
  - locked decision update,
  - immediate coding tasks,
  - deferred backlog item.

## 5) Day 1 Decision Lock (2026-03-04)
Answers received: `1Y 2C 3Y 4A 5N 6Y`

- Pilot focus: prioritize 1-3 design-partner ISOs.
- Merchant onboarding: hybrid model (ISO import + auto-invite is primary; invite link fallback).
- Integration strategy: one full production "golden path" first (Stripe).
- Auth-mode AI fallback: hard block when required provenance/data is missing, with explicit next-step guidance.
- Launch gate: tenant isolation checklist is recommended but not a hard release blocker right now.
- Product expansion: include one-page AI Report tab in current 90-day roadmap.

## 6) Immediate Build Tasks from Day 1
1. Onboarding flow implementation
  - Add merchant invite strategy toggle to ISO setup.
  - Implement auto-invite path from imported merchant rows when email is present.
  - Keep invite-link fallback available from ISO dashboard.

2. Stripe-first integration hardening
  - Make Stripe the primary integration path in onboarding/import UX.
  - Add explicit "recommended path" guidance and success criteria around Stripe connect/sync.
  - Ensure failed syncs surface visible in-app alerts with remediation actions.

3. Auth-mode AI trust enforcement
  - Standardize hard-block behavior for AI features when provenance is missing/unknown.
  - Show deterministic, non-fabricated guidance text with required actions (import/connect).
  - Ensure no simulated AI output appears in Auth mode.

4. AI Report tab (one-page)
  - Add report destination in merchant navigation.
  - Generate concise AI report based on trusted available data only.
  - Include source/provenance and timestamp in report header.

5. Soft launch governance
  - Keep tenant isolation verification checklist in release process.
  - Track checklist status but do not block release automatically yet.

## 7) Day 2 Decision Lock (2026-03-04)
Answers received: `1N 2Y 3Y 4Y 5N 6(Overseer only) 7(Hybrid) 8Y 9Y 10(NO CREDITS) 11Y 12N/A`

- CSV contract lock now: **No** (defer strict v1 contract enforcement for now).
- Mobile target: **Functional minimum** (not parity) in pilot.
- Critical sync failures: **Yes** surface in both Integrations and Dashboard.
- Toast/empty-state policy: **Yes** standardize globally.
- KPI replacement: **No** (do not replace current KPI with first trusted insight yet).
- Tenant isolation checklist ownership: **Overseer-only** tracking each release.
- Roadmap focus: **Hybrid** (reliability/accuracy first, selective AI improvements allowed).
- Blocked AI UX: **Yes** deterministic next-step CTA required everywhere.
- Statement analysis in auth mode: **Yes** upload-required only.
- Credits policy: **No credits consumed** when AI path is blocked.
- Data freshness: **Yes** add dashboard freshness badge(s).
- Tomorrow scope lock: **N/A** (no hard freeze flag set).

## 8) Tomorrow Execution Board

### Must Ship
1. Global blocked-AI CTA consistency
  - Standardize exact blocked copy + next-step action labels across all AI entry points.
  - Ensure every auth-mode block points to import/connect action.

2. No-credit-on-block enforcement audit
  - Verify all blocked AI paths do not call credit deduction first.
  - Add guardrails where missing.

3. Critical sync alert parity
  - Ensure sync failure visibility appears in both Integrations and Dashboard surfaces.

4. Statement auth-mode strictness
  - Keep statement analysis upload-required in auth mode and remove any residual demo fallback text.

### Should Ship
1. Data freshness indicators
  - Add compact freshness badge(s) to Dashboard cards driven by imported/integration data.

2. Global toast/error/empty policy alignment
  - Normalize success/error/info behavior and wording across major operational pages.

### Nice to Have
1. Overseer release checklist panel
  - Add lightweight overseer-facing checklist visibility for tenant isolation verification status.

2. Pilot mobile baseline review
  - Validate functional minimum behavior for critical actions on mobile breakpoints.

## 9) Day 3 Decision Lock (2026-03-08)
Answers received: `1N 2Y 3N 4Y 5N 6Y 7N 8Y 9(Settings option) 10Y 11Y 12Y 13Y 14N 15Y 16N 17Y 18Y 19Y 20N`

- Alert ownership requirement before clear: **No**.
- Dashboard stale-data indicator: **Yes**.
- Role-specific stale-data thresholds: **No** (single rule for all roles).
- Permanent import log (who/when/file/errors): **Yes**.
- Strict statement file validation block messaging: **No** (defer hard block expansion).
- Blocked AI CTA should deep-link to fix page: **Yes**.
- Blocked AI button labels limited to two fixed labels: **No**.
- AI sections should show last run timestamp: **Yes**.
- AI confidence visibility: **User setting toggle** for projection responses.
- Retry sync cooldown: **Yes**.
- Trust/auth changes require manual reviewer signoff: **Yes**.
- Major trust bug pauses net-new features: **Yes**.
- Overseer trust health page: **Yes**.
- CSV column mapping step for non-standard imports: **No**.
- Failed imports downloadable error report: **Yes**.
- Trust warnings strict plain-language only: **No**.
- Production deploy trust notes required: **Yes**.
- Automatic rollback tag per production deploy: **Yes**.
- Emergency AI UI kill switch: **Yes**.
- Decision sequencing split (1-10 first): **No** (all decisions active now).

## 10) Updated Execution Priority (Post Day 3)

### Must Ship Next
1. Dashboard stale-data indicator with a single global threshold.
2. AI last-run timestamp across key AI surfaces.
3. Retry sync cooldown and anti-spam UX.
4. Failed import downloadable error report.
5. Emergency AI UI kill switch (env/feature flag controlled).

### Should Ship Next
1. Permanent import audit log (who/when/file/errors).
2. Overseer trust health page for failures/stale data/blocked AI.
3. Deep-link CTA routing for blocked AI states.
4. Settings toggle for AI confidence display in projections.

### Post-Pilot ISO Ops Expansion
1. Centralized Onboarding Hub
  - Add one central deal intake workspace for ISO/rep teams.
  - Auto-generate destination-ready onboarding packages for supported processors.
  - Enforce role-limited rep permissions so onboarding does not require full org data access.

2. Commission Automation
  - Calculate monthly agent commissions from trusted imported/integrated processor and platform data.
  - Replace manual spreadsheet-style monthly commission workflows with auditable system outputs.
  - Surface commission run status, totals, and exception flags for ISO operators.

3. Buy-Rate Tracking
  - Track per-account processor costs (buy rates/fees) alongside ONE82 service fee behavior.
  - Show gross-to-net margin visibility by account, rep, and ISO portfolio rollup.
  - Keep this analytics capability non-blocking to Stripe-first Day 1 production path.

Implementation update (2026-03-09):
- Centralized onboarding destination mapping and scoped rep onboarding controls are live.
- Commission automation is deterministic and buy-rate-informed, with persisted run outputs.
- Buy-rate visibility now includes merchant, rep, and portfolio rollups.

### Process / Governance
1. Manual reviewer signoff required for trust/auth PRs.
2. Pause net-new feature work when P0 trust bug exists.
3. Add trust-change notes to every production deployment.
4. Create rollback tag automatically at production deploy time.
