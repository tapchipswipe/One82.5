# ONE82 — Master Document

> **This is the single source of truth for the product.**
> All other docs in `/docs` are reference/archive. When in doubt, read this first.
>
> Last updated: 2026-03-11
> Branch: one82-production
> Maintained by: Lucas Despot

---

## 1. What ONE82 Is

ONE82 is a B2B SaaS platform that helps ISOs (Independent Sales Organizations) and their merchants turn payment transaction data into fast, trustworthy decisions.

**The core value proposition:**
- ISOs get faster merchant onboarding, pricing, and portfolio risk visibility
- Merchants get AI-assisted interpretation of their transaction history, forecasting, and inventory insight
- Everything is trust-first: real data, labeled provenance, no fabricated values

**Who pays:** The ISO — not the merchant. Merchants get access through their ISO's plan.

**Business model:** Platform fee + per-rep pricing. Up to 3 plans. Annual contracts preferred. AI usage is subscription-tier based — no credit system.

**Go-to-market:** Sales-led only. No open signup. First target: 1–3 design-partner ISOs.

---

## 2. User Roles

| Role | What They Do |
|---|---|
| **ISO** | Manages reps, onboards merchants, monitors portfolio profitability and risk |
| **Rep** | Sees only their assigned merchants and deals — no full org access |
| **Merchant** | Views their own transaction data, AI insights, forecasts, and inventory |
| **Overseer** | Internal operator — monitors trust health, data quality, and release readiness across all orgs |

---

## 3. Non-Negotiable Rules

These never change regardless of sprint or pressure:

- **Auth mode = zero simulated data.** Every analytics surface in Auth/Trial mode must reflect real imported or integrated data only.
- **Provenance labels are required** on all major analytics surfaces. Source must be visible.
- **AI never fabricates values.** When required data is missing, AI blocks with a deterministic next-step CTA — not a guess.
- **Tenant isolation is backend-enforced.** RBAC is not UI-only.
- **No net-new features while a P0 trust bug is open.**
- **Every production deploy requires:** trust-change notes + rollback tag + manual signoff on auth/trust PRs.
- **Emergency AI kill switch exists** (env/feature flag) and must remain functional.

---

## 4. Current Phase — Phase 3

**Goal:** ISO user can sign in, connect one processor, and view persisted portfolio metrics after refresh and re-login.

This is not a feature — it is one complete end-to-end workflow that must work reliably before Phase 4 begins.

### Phase 3 Daily Questions (source: `planning/daily-questions.json`)

| ID | Area | Question | Status |
|---|---|---|---|
| P3-Q1 | Profitability | Deterministic rep-to-portfolio profitability rollups verified after refresh? | todo |
| P3-Q2 | Integrations | Stripe sync persisting normalized data with dedupe + audit logging? | todo |
| P3-Q3 | Ops | ISO user can connect one processor and see persisted metrics after refresh + re-login? | todo |
| P3-Q4 | Trust | Profitability and AI views preserve trusted-data behavior — no fabricated fallback in auth mode? | todo |
| P3-Q5 | Readiness | What is the single most important gap before Phase 4? | todo |

> Update question status via GitHub Actions: `Actions → Update Progress Log` or issue comment `.done P3-Q1 | note | next step | evidence`

---

## 5. What Is Done

### Confirmed built and functional (as of 2026-03-11)

**Auth + Access**
- Dual-role auth (ISO and Merchant) — functional in demo mode
- RBAC role assignment — functional
- Session restore and logout revocation — implemented
- First-login onboarding checklist modal — implemented

**UI Shell (demo mode)**
- ISO Dashboard (`ISODashboard.tsx` — 32KB)
- Merchant Dashboard (`Dashboard.tsx`)
- Profitability view (`Profitability.tsx` — 22KB)
- Team / Rep management (`Team.tsx` — 45KB)
- Integrations (`Integrations.tsx` — 56KB)
- Onboarding Hub (`OnboardingHub.tsx` — 52KB)
- Statement Reader (`StatementReader.tsx` — 25KB)
- Transactions, Customers, Forecast, Settings, Calendar, Inventory, AI Report
- Overseer Dashboard (`OverseerDashboard.tsx` — 35KB)
- Dark/light mode — functional

**Trust + Provenance**
- Provenance indicators component live (`ProvenanceIndicators.tsx`)
- Demo mode clearly labeled across surfaces
- AI hard-block behavior in auth mode — implemented
- Data freshness badge on Dashboard — implemented
- Stale-data indicators — implemented
- Emergency AI kill switch — implemented
- Permanent import audit log — implemented
- Failed import downloadable error report — implemented
- Retry sync cooldown — implemented

**ISO Ops (post-pilot tier — structure in place)**
- Centralized onboarding destination mapping and scoped rep controls — live
- Commission automation (deterministic, buy-rate-informed, persisted run outputs) — live
- Buy-rate visibility (merchant, rep, portfolio rollups including markup-floor guardrails) — live

**Infrastructure + Tooling**
- `CONTEXT.md` — AI session entry point
- `PROGRESS_LOG.md` — auto-generated from daily questions JSON
- `planning/daily-questions.json` + schema — source of truth for daily build questions
- `scripts/generate-log.mjs` — log generator
- `.github/workflows/update-progress-log.yml` — GitHub Actions automation

**Bug fixes shipped 2026-03-11**
- Transaction search implemented
- Dark mode headings contrast fixed globally
- AI Outlook box full opacity
- Layout dark mode sidebar + main area
- Business type sort order fixed
- Smart Task creation — StrictMode guard, prepend, flash, empty state
- Forecast projections anchored to seed value (±1% variance)
- Sparkline tooltip z-index fixed
- Login/Onboarding copy updated (Demo mode labeling)

---

## 6. What Is NOT Done (Honest)

| Area | Reality |
|---|---|
| Live processor data persistence | Not verified end-to-end — the Phase 3 goal |
| Stripe sync dedupe + audit log | Partial — unverified under real load |
| Real churn detection engine | Simulated alerts only — no real ML/signal engine |
| Inventory intelligence | Prototype UX only — no real engine |
| TSYS, Fiserv, other processors | Roadmap only — Stripe is the one golden path |
| Mobile | Near-desktop parity targeted — not fully verified |
| SOC2 readiness | Near-term objective — not started |
| Tenant isolation full verification | Checklist required per release — not yet independently audited |
| Open signup / self-serve | Out of scope this year by design |

---

## 7. The Path Forward

### Phase 3 Exit Criteria (must all be true before Phase 4)
- [ ] ISO user signs in → connects Stripe → views portfolio metrics → refreshes → re-logins → metrics still correct
- [ ] Stripe sync writes normalized transaction rows with dedupe and audit log
- [ ] Profitability rollups are deterministic (same input = same output on repeat runs)
- [ ] No P0 trust bugs open
- [ ] Tenant isolation verified for pilot cohort

### Phase 4 — Processor Expansion + ISO Ops Hardening
*Begins only after Phase 3 exit criteria are fully met.*

1. **Second processor onboarding** — ISO-choice-first (not Stripe-forced), based on pilot partner preference
2. **Commission automation pilot** — run one real monthly commission cycle with an ISO design partner
3. **Buy-rate tracking live data** — connect fee normalization to real processor output
4. **Onboarding hub live test** — run one full merchant deal intake through a real ISO rep workflow
5. **Statement reader accuracy audit** — test against real uploaded statements, fix edge cases
6. **Mobile baseline QA** — validate near-desktop parity on key ISO + Merchant workflows

### Phase 5 — Pilot Conversion
- Sales-led onboarding with 1–3 design-partner ISOs
- Activation KPI: first AI insight + first merchant onboarded + first sync + dashboard viewed ≤ 15 minutes
- SOC2 readiness preparation begins
- SAML/SSO evaluation for enterprise ISOs

### Phase 6 — Scale
- Broader processor connector library
- Churn detection real engine (signal-based, not simulated)
- Inventory intelligence real engine
- Billing system integration (platform fee + per-rep metering)

---

## 8. Activation Path (First Login → Daily Trust)

Required sequence for every production tenant:
1. Login with provisioned credentials (role pre-assigned by sales/admin)
2. First-login checklist modal appears
3. Import or connect transactions (required before dashboard activates)
4. If ISO: import or create rep team (required)
5. Confirm dashboard data visibility and provenance labels
6. Validate one actionable insight from imported/live data

**Activation achieved when:**
- User can see their own data
- User can trace where data came from
- User uses at least one role-relevant insight to make a real decision
- Time-to-first-value target: ≤ 15 minutes

---

## 9. KPIs

| Metric | Target |
|---|---|
| Time to first value | ≤ 15 minutes from first login |
| Auth login success rate | ≥ 98% |
| CSV validation pass rate | ≥ 95% on first attempt |
| Import success (valid files) | 100% |
| Data provenance correctness | 100% on key dashboards |
| Activation bundle (small ISO pilot) | First AI insight + first merchant onboarded + first sync + dashboard viewed |

---

## 10. Open Decisions (Still Unresolved)

These must be answered before they become build blockers:

- [ ] Calendar: keep as concept spike only, or narrow production scope for pilot?
- [ ] Empty state CTA standard: define exact UX requirement by page type
- [ ] Weekly active teams KPI: define primary usage KPI for small ISO orgs (current placeholder)
- [ ] Auth-mode AI fallback for partial data: hard block vs deterministic fallback with partial output?
- [ ] Final onboarding-to-activation proof checklist copy
- [ ] Mobile: confirm near-desktop parity scope for pilot vs post-pilot
- [ ] Processor package routing field contract: canonical field map per processor

---

## 11. Reference Docs (Archive)

These are source material — do not use for current state:

| File | Purpose |
|---|---|
| `docs/vision-lock-v1.md` | Full locked decision log with daily Q&A history |
| `docs/one82-vision-blueprint-draft.md` | Original vision synthesis (still draft) |
| `docs/one82-file-by-file-build-order.md` | Sprint task breakdown with file-level detail |
| `docs/one82-app-changes-roadmap.md` | App changes roadmap (partially executed) |
| `docs/one82-long-survey.txt` | Founder survey inputs |
| `docs/post-pilot-ops-qa-results-2026-03-09.md` | QA results from 2026-03-09 |
| `docs/trust-hardening-release-note-2026-03-09.md` | Trust hardening release notes |
| `PROGRESS_LOG.md` | Auto-generated daily progress log (do not edit manually) |
| `CONTEXT.md` | AI session entry point — read this at the start of every AI coding session |
