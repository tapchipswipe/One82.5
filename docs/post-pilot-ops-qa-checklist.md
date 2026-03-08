# Post-Pilot Ops QA Checklist

Date: 2026-03-08
Scope: Centralized Onboarding Hub, Commission Automation, Buy-Rate Tracking

## 1) Test Setup

### Profiles
- Demo mode profile
  - `VITE_ENABLE_BACKEND_AUTH=false`
  - `VITE_ENABLE_BACKEND_DATA=false`
- Backend mode profile
  - `VITE_ENABLE_BACKEND_AUTH=true`
  - `VITE_ENABLE_BACKEND_DATA=true`

### Baseline
- Use ISO role account for all three feature groups.
- Keep at least one merchant CSV and one team CSV available for import.
- Run `npm run check` before and after manual QA cycle.

## 2) Centralized Onboarding Hub

Location: ISO Dashboard

### Demo Mode
1. Login as ISO in demo mode.
2. Open Dashboard.
3. In Centralized Onboarding Hub, create deal with:
   - Merchant Name: `Test Coffee`
   - Merchant Email: `owner@testcoffee.com`
   - Rep Owner: any available rep
   - Processor: `Stripe`
4. Confirm row appears with status `ready-to-submit`.
5. Click `Submit`.
6. Refresh page.

Expected:
- Deal persists after refresh.
- Status remains `submitted`.
- Package summary remains visible.

### Backend Mode
1. Login as ISO in backend mode.
2. Import team CSV in Integrations (if rep dropdown is empty).
3. Create two onboarding deals:
   - One with valid email.
   - One with invalid/missing email.
4. Confirm status mapping:
   - Valid email -> `ready-to-submit`
   - Invalid/missing email -> `validation-required`
5. Change one row to `ready-to-submit`, then `submitted`.
6. Hard refresh and re-login.

Expected:
- All onboarding deal rows persist after re-login.
- Status transitions remain saved.
- No data loss after backend API roundtrip.

## 3) Commission Automation

Location: Team

### Demo Mode
1. Login as ISO in demo mode.
2. Open Team.
3. Set period to current month.
4. Set commission to `20%`.
5. Click `Save Draft Run`.
6. Click `Finalize Run`.
7. Refresh page.

Expected:
- Recent Commission Runs shows both draft and finalized entries.
- Draft totals are non-zero when merchants exist.
- Line items show rep, merchant, residual, payout.

### Backend Mode
1. Login as ISO in backend mode.
2. Import team and merchant/transaction data if needed.
3. Create one draft and one finalized commission run.
4. Refresh and re-login.

Expected:
- Runs persist across refresh/re-login.
- Total payout and line item counts stay unchanged.
- If missing data exists, exception text is visible for affected lines.

## 4) Buy-Rate Tracking

Location: Profitability

### Demo Mode
1. Login as ISO in demo mode.
2. Open Profitability.
3. For a merchant row, update:
   - Buy Rate BPS
   - Markup BPS
   - Service Fee
   - Processor target
4. Confirm totals update in summary cards.
5. Refresh page.

Expected:
- Edited profile values persist.
- Processor filter correctly narrows table rows.
- Processor cost and margin values update based on edited rates.

### Backend Mode
1. Login as ISO in backend mode.
2. Open Profitability and edit at least 2 merchants.
3. Switch processor filter between `All`, `Stripe`, and one non-Stripe option.
4. Refresh and re-login.

Expected:
- Buy-rate profile edits persist after backend roundtrip.
- Filter behavior remains correct after refresh.
- Summary cards match filtered row totals.

## 5) Cross-Feature Persistence Checks

Perform in backend mode:
1. Add onboarding deals.
2. Create a commission run.
3. Edit buy-rate profiles.
4. Refresh app and re-login.

Expected:
- All three datasets persist simultaneously.
- No dataset overwrites another during save operations.
- No console/server errors from `api/data/imports`, `api/data/metrics`, `api/data/transactions`.

## 6) Regression Checks

- ISO Dashboard still loads merchant portfolio and AI panel.
- Team page rep assignments still render.
- Profitability charts still render.
- Integrations imports still work for transactions/merchants/team.

## 7) Pass/Fail Log Template

Use this per run:

- Tester:
- Date:
- Mode: Demo / Backend
- Feature: Onboarding / Commission / Buy-Rate
- Scenario ID:
- Result: Pass / Fail
- Notes:
- Screenshot/Video Link:
