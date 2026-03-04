# ONE82 Vision Blueprint (Draft from Submitted Docs)

Status: Draft synthesized from submitted inputs (includes assumptions where answers were partial)
Date: 2026-03-03
Owners: Lucas, Landon

## 1) Product Promise
ONE82 helps ISOs and their merchants turn transaction data into fast, trustworthy decisions for pricing, onboarding, forecasting, and portfolio management.

Non-negotiable value:
- Faster decision-making from real transaction data
- AI-assisted interpretation of statements and transaction trends
- Trust-first operation for high-value financial data

## 2) Primary User + GTM
Primary user: ISO
Secondary user: Merchant
Overseer: internal operator/owner role

Go-to-market focus:
- Sell to ISOs with existing merchant portfolios
- Expand value to merchants through ISO-sponsored access

Why they buy now:
- Faster merchant onboarding and pricing decisions
- Less manual statement review
- Better operational insight from live/imported transaction data

## 3) Role Outcomes (Business Outcomes, Not Features)
ISO outcomes:
- Price and onboard merchants faster with lower risk blind spots
- Detect merchant risk and trend changes earlier
- Improve portfolio decision quality with less manual analysis time

Merchant outcomes:
- Convert transaction history into inventory, demand, and revenue insight
- Use AI Q&A to answer business analytics questions quickly
- Improve forecasting confidence for pricing/stock decisions

Overseer outcomes:
- Monitor trust, data health, and operational quality across orgs
- Enforce standards for live-data quality and app readiness

## 4) Source-of-Truth + Mode Policy
Demo mode:
- Simulated data allowed for sales/demo storytelling
- Must be clearly labeled simulated everywhere relevant

Auth/Trial mode:
- No simulated data anywhere
- Data must come from imported CSVs and/or connected integrations
- Environment should represent deployment reality for a pilot cohort

Provenance requirement:
- Every major analytics surface must visibly indicate Live/Auth-Trial vs Simulated/Demo

## 5) Activation Path (First Login -> Daily Trust)
Required sequence:
1. Login with provisioned credentials (role pre-assigned by sales/admin)
2. First-login checklist modal appears
3. Import or integrate transactions (required)
4. If ISO: import/create rep team (required)
5. Confirm dashboard data visibility and provenance labels
6. Validate one actionable insight from imported/live data

Activation achieved when user can:
- See their own data reflected
- Trace where data came from
- Use at least one role-relevant insight to make a real decision

## 6) 90-Day Scope Boundary
Must perfect:
- UI consistency and trust-quality visual polish
- At least one production-grade payment integration
- CSV ingestion reliability + immediate dashboard propagation
- AI interpretation on real/imported data

Acceptable but not perfect:
- Secondary flows not required for first pilot conversion
- Non-core advanced analytics depth

Out of scope:
- Broad connector expansion before one connector is stable
- Cosmetic-only feature additions not tied to trust/activation

## 7) Team Operating Model (Current + Recommended)
Current reality from responses:
- Two-founder build model
- Lucas drives technical implementation
- Landon drives payments-domain requirements and market fit

Recommended weekly decision cadence:
- Weekly product review with fixed KPI check
- Prioritize by activation impact + trust impact + implementation effort
- Keep/change/remove rule:
  - Keep: directly improves activation or trust metrics
  - Change: used but underperforming metric target
  - Remove: low usage and no trust/activation contribution

## 8) KPIs (Draft Targets)
Explicit from docs:
- Import success target: 100%
- Weekly active teams: start at 1 and scale consistently
- Time to first value: as fast as possible without reducing insight quality

Recommended concrete pilot targets (to finalize):
- Time to first value: <= 15 minutes from first login
- Auth login success rate: >= 98%
- CSV validation pass rate: >= 95% first attempt
- Data provenance correctness: 100% on key dashboards

## 9) Visual + UX Direction
Design intent:
- Minimal, modern, financial luxury
- Premium modern over utility-heavy density
- Motion should be minimal and purposeful

Must-have UX quality:
- Consistent components and visual hierarchy
- Clear empty, loading, and error states
- Readable contrast in both themes
- Immediate post-import visibility where data is used

## 10) Open Items / Partial Answers to Finalize
These were incomplete or implied:
- Full onboarding-to-activation proof checklist copy
- Weekly release frequency and rollback rules
- Final numeric KPI thresholds for trust and retention
- Explicit out-of-scope list by feature area
- Accessibility bar completion criteria

## 11) Final Blueprint Assumptions Used
Because long survey question 3 was incomplete, this draft assumes:
- First-login checklist is mandatory
- Transaction import/integration is required for activation
- ISO team setup is required only for ISO role
- Trust equals provenance + visibility + data-source consistency

If these assumptions are correct, confirm and this draft can be promoted to final blueprint.
