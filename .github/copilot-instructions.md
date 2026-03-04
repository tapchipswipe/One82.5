# Copilot Instructions for ONE82

## Big-picture architecture
- This is a single-page React + TypeScript + Vite app (`App.tsx`, `index.tsx`) with role-driven rendering, not route-driven rendering.
- `App.tsx` is the orchestration layer: bootstraps auth (`AuthService.bootstrap()`), sets data mode (`StorageService.setDataMode()`), gates merchant/ISO/overseer surfaces, and decides marketing vs login vs onboarding.
- `components/Layout.tsx` owns global shell/nav and role-specific nav items; new app views should integrate through `activeView` + `onNavigate` patterns.

## Service boundaries and data flow
- `services/authService.ts` handles auth mode (`demo` vs `backend`) and overseer email behavior (`VITE_OVERSEER_EMAIL`); when backend auth is enabled, login/session persistence is server-side via Supabase-backed API routes.
- `services/storage.ts` is the primary app data boundary; it abstracts localStorage and backend fallbacks via `*Resolved` methods (for transactions/metrics/notifications).
- Keep feature components mostly UI-focused; call `StorageService` / `AuthService` from components instead of raw localStorage/fetch where equivalent helpers exist.
- `services/geminiService.ts` always supports offline behavior (simulated responses when `GEMINI_API_KEY` is absent). Preserve this fallback-first behavior.
- `services/simulationService.ts` provides canonical seeded/demo datasets for portfolio, customers, and reps.

## Mode and provenance conventions
- Feature flags are env-driven (`VITE_ENABLE_BACKEND_AUTH`, `VITE_ENABLE_BACKEND_DATA`, `VITE_ENABLE_LIVE_INTEGRATIONS`, `VITE_ENABLE_EXPERIMENTAL`).
- Demo mode is expected to work end-to-end without external dependencies; avoid introducing hard failures when APIs/keys are missing.
- Show explicit source/provenance when relevant using `components/ProvenanceIndicators.tsx` (`Live` vs `Simulated (Demo)` and optional `AI-Generated`).
- For integrations, use `services/integrationsConfig.ts` as the source of truth; keys are stored locally and gated by `LIVE_INTEGRATIONS_ENABLED`.

## Role and access model
- Valid app roles are `'merchant' | 'iso' | 'overseer'` (`types.ts`). Keep role checks aligned with `HIERARCHY_STRUCTURE.md`.
- If role behavior changes, update both implementation and `HIERARCHY_STRUCTURE.md` in the same change.
- Existing login behavior: emails containing `iso` map to ISO in demo mode; `VITE_OVERSEER_EMAIL` maps to overseer.

## UI and state patterns used here
- Tailwind utility classes are used inline throughout components; follow existing class composition style instead of introducing a new styling system.
- Many components read/write browser state directly through services and react to `window` events (example: `user-update` in `Layout.tsx` and `StorageService.updateCredits`).
- `App.tsx` performs role-based view fallback (e.g., unknown ISO view -> `ISODashboard`); keep equivalent defensive fallbacks when adding views.

## Local workflows
- Install: `npm install`
- Dev server: `npm run dev` (Vite, default port 3000 from `vite.config.ts`)
- Production build: `npm run build`
- Preview build: `npm run preview`
- No formal test/lint scripts are currently defined in `package.json`; validate by running `npm run build` after non-trivial changes.

## Practical implementation tips for agents
- Prefer editing existing services/components over creating new infrastructure.
- Reuse existing domain types from `types.ts` before introducing new ones.
- For AI features, include graceful no-key behavior and avoid blocking UX on model/network failures.
- For data mutations, persist through `StorageService` first, then optional backend sync (same pattern as `saveTransactionsResolved` / `markNotificationsReadResolved`).
