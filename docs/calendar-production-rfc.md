# ONE82 Calendar — Production Specification

Date: 2026-03-04
Status: Implemented
Owner: Product + Engineering

## Objective
Promote Calendar from concept spike to production merchant workflow that:
1. Captures operational events,
2. Persists them per user/account,
3. Surfaces them in Forecast as explicit planning signals.

## Scope Delivered
- New merchant navigation destination: `Calendar`
- Dedicated calendar workspace with month view and day-level event management
- Event CRUD (create, edit, delete)
- Persistent storage in `StorageService` scoped by user + role
- Backend API sync in auth/backend mode via `/api/data/calendar`
- Forecast model integration for near-term event impact
- Event signal visibility inside Forecast UI

## Data Model
Implemented in `types.ts`:
- `CalendarEvent`
  - `id`
  - `title`
  - `date` (YYYY-MM-DD)
  - `note`
  - `impactDirection` (`up` | `down` | `neutral`)
  - `impactPercent` (0–50)
  - `createdAt`, `updatedAt`

## Storage + Ownership
Implemented in `services/storage.ts`:
- `getCalendarEvents(role)`
- `saveCalendarEvents(role, events)`
- `getCalendarEventsResolved(role)`
- `saveCalendarEventsResolved(role, events)`

Behavior:
- Events are scoped with user identity + role keying.
- Saves emit `one82_calendar_events_update` for reactive UI updates.
- In backend mode, calendar events round-trip to the tenant backend state via `/api/data/calendar`.
- Works in demo and auth/trial modes without introducing simulated records.

## Forecast Integration
Implemented in `components/Forecast.tsx`:
- Reads merchant calendar events.
- Applies near-term event impact to 7-day projected values.
- Displays “Upcoming Calendar Signals” list for visibility and trust.

## UX Notes
Implemented in `components/CalendarPlanner.tsx`:
- Month grid with per-day event chips
- Day detail panel with event list + edit/delete controls
- Event editor modal with direction and impact percentage
- 30-day signal summary card for planning context

## Production Guardrails
- No external dependency required.
- No synthetic/hidden event generation in auth/trial mode.
- All event impact is user-authored and visible in UI.
- Feature integrated via existing `activeView` app architecture.

## Follow-Up Enhancements (Optional)
- Add backend API for calendar event sync in strict backend data mode
- Add recurrence templates
- Add role-specific visibility (ISO/merchant shared calendar lanes)
- Include calendar events as structured context for AI chat prompts
