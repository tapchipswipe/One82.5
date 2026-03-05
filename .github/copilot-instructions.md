# Copilot Instructions for ONE82

## 1) Architecture at a glance
- App type: single-page React + TypeScript + Vite app with role-driven rendering (not route-driven rendering).
- Main entry: `App.tsx` orchestrates auth bootstrap, data mode, marketing/login/onboarding gating, and role view fallback.
- Shell/navigation: `components/Layout.tsx` owns global nav and role-specific view switching via `activeView` + `onNavigate`.

## 2) Core boundaries (respect these)
- `services/authService.ts`: source of truth for auth mode (`demo` or `backend`) and session bootstrap/login/logout behavior.
- `services/storage.ts`: primary data boundary; prefer `*Resolved` helpers for backend+demo fallback behavior.
- `services/simulationService.ts`: canonical demo data generator (portfolio, reps, customers, etc.).
- `services/geminiService.ts`: must remain fallback-first (simulate behavior when API key/network is unavailable).
- `services/integrationsConfig.ts`: source of truth for live integration capability and key gating.

## 3) Modes, flags, and resilience
- Feature flags are env-driven: `VITE_ENABLE_BACKEND_AUTH`, `VITE_ENABLE_BACKEND_DATA`, `VITE_ENABLE_LIVE_INTEGRATIONS`, `VITE_ENABLE_EXPERIMENTAL`.
- Demo mode must work end-to-end without external services.
- Never introduce hard failures when APIs/keys are missing; degrade gracefully with clear UX state.
- Where relevant, show provenance using `components/ProvenanceIndicators.tsx` (`Live`, `Simulated (Demo)`, `AI-Generated`).

## 4) Role model and access rules
- Valid roles are exactly `'merchant' | 'iso' | 'overseer'` (see `types.ts`).
- Keep role logic consistent with `HIERARCHY_STRUCTURE.md`.
- If role behavior changes, update both implementation and `HIERARCHY_STRUCTURE.md` in the same change.
- Demo auth convention: emails containing `iso` map to ISO; `VITE_OVERSEER_EMAIL` maps to overseer.

## 5) UI/state conventions
- Use existing inline Tailwind utility style; do not introduce a parallel styling system.
- Prefer existing components/patterns over new infrastructure.
- Keep defensive fallback behavior in `App.tsx` when unknown/invalid views are requested.
- Many features sync via browser events and storage helpers; preserve existing event-driven patterns.

## 6) Implementation rules for changes
- Prefer editing existing files/services before creating new modules.
- Reuse domain types from `types.ts`; avoid duplicate type definitions.
- Keep components UI-focused; use services for persistence, auth, and integrations.
- For data mutations, persist through `StorageService` first, then optional backend sync (existing resolved pattern).
- Keep changes minimal, surgical, and consistent with current naming/style.

## 7) Local development workflow
- Install deps: `npm install`
- Run dev server: `npm run dev`
- Type-check: `npm run typecheck`
- Lint: `npm run lint`
- Full validation: `npm run check`
- Production build: `npm run build`
- Preview build: `npm run preview`

## 8) Definition of done for non-trivial work
- App compiles and passes `npm run check`.
- New behavior works in demo mode (no required external keys).
- Any role-affecting changes are reflected in `HIERARCHY_STRUCTURE.md`.
- User-facing data source/provenance is explicit where needed.

## 9) Vision lock alignment (required)
- Treat `docs/vision-lock-v1.md` as a product constraint document for implementation decisions.
- Favor ISO-first product decisions (onboarding flows, pricing presentation, activation paths); avoid merchant-direct self-serve assumptions.
- Honor Day 1 lock priorities: focus pilot execution around 1–3 design-partner ISOs and Stripe as the first full production integration path.
- Follow the locked onboarding direction: ISO import + auto-invite is the primary merchant onboarding path, with invite-link fallback.
- In auth/backend mode, never rely on browser cache as source of truth; preserve backend-enforced tenant isolation, API-layer RBAC, and full logout/session revocation.
- Keep provenance/trust behavior strict: in auth mode, hard-block AI when required provenance is missing/unknown, avoid fabricated AI outputs when inputs are incomplete, and do not emit simulated AI outputs as auth-mode substitutes.
- Prioritize integration reliability, statement reader accuracy, sync failure visibility, and freshness indicators over net-new AI surface area.
- Keep AI provider abstraction and settings-based AI customization patterns; avoid introducing dedicated standalone AI config surfaces unless explicitly requested.
- AI report expansion is in-scope: one-page AI report experience can be implemented, but only from trusted available data with explicit source/timestamp context.
