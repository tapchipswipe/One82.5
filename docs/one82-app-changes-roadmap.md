# ONE82 App Changes Roadmap (From Owner Change Sheet)

Date: 2026-03-03
Input source: docs/One82 Information Base-changes.txt

## Priority Legend
- P0 = must fix before pilot trust
- P1 = high-value UX and workflow improvements
- P2 = strategic enhancements

## P0 — Trust + Functional Defects

1) Transaction search does not work
- Area: merchant transaction history
- Required outcome: search reliably filters by known transaction fields
- Acceptance: searching by customer/item/date/id returns expected matches

2) Real-time analysis rendering issue
- Symptom: only final word appears after refresh
- Required outcome: complete analysis text displays consistently
- Acceptance: full output is visible after each analysis refresh

3) Tab contrast/readability failures
- Symptom: white-on-white / opaque text containers in multiple merchant tabs
- Required outcome: readable text and controls in all theme states
- Acceptance: no low-contrast critical content in dashboard/forecast/AI sections

4) Smart task creation not working
- Required outcome: user can create and persist tasks from main dashboard
- Acceptance: create/edit/complete task works and survives refresh

## P1 — Workflow + IA Improvements

5) Profitability information architecture change
- Requested direction: rep-based profitability should move under Team; Profitability tab should focus on merchant profitability analytics
- Required outcome: navigation and data semantics align with this split

6) Settings cleanup by role
- ISO should not be asked for merchant-specific business type
- Remove or repurpose monthly revenue goal in merchant settings
- Clarify/replace "Production Readiness Checklist" copy

7) Profile interaction model
- Make profile surfaces clickable (top settings profile + bottom-left avatar)
- Add dedicated profile page for editable account details

8) Integrations experience upgrade
- Improve speed, clarity, and security cues for connection/import workflows
- Keep first-run guidance explicit for both ISO and merchant roles

9) Inventory usability
- Add item search in merchant inventory to avoid manual scanning

## P2 — Product Expansion Ideas

10) Embedded calendar in merchant experience
- Purpose: annotate events to improve forecast context and AI recommendations
- Start as optional module after core trust/activation items

11) AI credits model review
- Evaluate removing credits system and tying AI usage to subscription tier instead

## Cross-Cutting UX Rules (Must apply to all work)
- No simulated data in Auth/Trial mode
- Every imported/integrated dataset must show immediate visible impact where relevant
- Empty states must explain exactly what action unlocks data (import/connect)
- Theme quality must match premium modern standard in both light and dark modes

## Suggested Delivery Order
Sprint 1:
- Transaction search
- Real-time analysis rendering
- Contrast/readability fixes
- Smart tasks fix

Sprint 2:
- Profitability/Team IA split
- Role-aware settings cleanup
- Profile page interactions
- Inventory search

Sprint 3:
- Integrations UX upgrade
- Calendar concept spike
- AI credits vs subscription decision

## Definition of Done for this roadmap
- Each P0 item has reproducible bug case + validated fix
- P1 IA changes are reflected in navigation and labels
- Role-specific settings do not show irrelevant fields
- Auth/Trial trust policy remains intact after each release
