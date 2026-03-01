# Test 1 — Overseer Prototype Sandbox

This folder contains an isolated overseer prototype so you can evaluate ideas without changing the live app wiring.

## What is included
- `OverseerControlTower.tsx`: Enhanced overseer page with:
  - Global filters
  - KPI strip with period deltas
  - Alert triage actions (Acknowledge / Escalate / Resolve + owner + due date)
  - Next-best-action queue with expected retention and margin impact
  - Intervention effectiveness snapshot
  - Cross-tenant anomaly engine (simulated signals)
  - Policy automation rules with one-click execution
  - What-changed driver intelligence cards
  - Organization health map by tenant
  - Executive briefing mode + text export
  - Verifiable audit trail with deterministic signatures

## Notes
- This prototype is intentionally not wired into `App.tsx`.
- Removing this folder fully reverts the experiment.

## Standalone Preview
- Start dev server: `npm run dev`
- Open: `http://localhost:3000/test-1.html`

This page mounts the sandbox directly from `test 1/preview-main.tsx`.
