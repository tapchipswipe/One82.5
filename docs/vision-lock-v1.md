# ONE82 Vision Lock v1

Date: 2026-03-04
Source: Founder yes/no decision set + clarifications

## 1) Locked Strategic Decisions

### Positioning
- Primary paid customer is the ISO (not merchant-direct).
- No B2C/small-merchant self-serve this year.
- Core value proposition: faster onboarding + pricing + risk visibility.
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
