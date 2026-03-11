# ONE82 — AI Coder Context File

> **AI INSTRUCTION:** When asked to "analyze and understand code, then give me my daily questions for the progress of the program," follow this exact sequence:
> 1. Read this file (`CONTEXT.md`) fully.
> 2. Read `VISION.md` for the roadmap and current phase status.
> 3. Read `PROGRESS_LOG.md` for what was last worked on.
> 4. Scan `/app`, `/api`, `/components`, and `/services` directories for recent file structure and implementation.
> 5. Output **5 targeted daily development questions** based on the current roadmap phase, what is built vs. missing, and any blockers noted in the progress log.
> 6. Questions should be actionable, specific to One82's architecture, and ordered by priority.

---

## What is ONE82?

ONE82 is a dual-POV fintech SaaS platform that turns raw payment transaction data into a "Goldmine" of intelligence for **Merchants** and **ISOs (Independent Sales Organizations)**. The primary paying customer is the ISO, not the merchant. ISOs pay $100/user/month to manage their merchant portfolio with real-time analytics, churn detection, and AI-powered statement reading.

The platform is built on **Next.js (App Router) + TypeScript + React**, with **Supabase** as the backend/auth layer and **Google Gemini Pro** as the AI engine. It is deployed on **Vercel**.

---

## Current Roadmap Phase

See `VISION.md` for the full roadmap. Summary of status as of March 2026:

| Phase | Name | Status |
|---|---|---|
| Phase 1 | Role-Based Auth & Dashboard Framework | ✅ Done |
| Phase 2 | Statement Reader with AI Analysis | ✅ Done |
| Phase 3 | Per-Rep Profitability Tracking | 🔄 In Progress |
| Phase 4 | Full Processor API Integrations (TSYS, Fiserv, WorldPay) | ⬜ Not Started |
| Phase 5 | Terminal API Integration | ⬜ Not Started |
| Phase 6 | Advanced Predictive Analytics & Churn Detection | ⬜ Not Started |

**Current Build Target:** ISO user can sign in, connect one processor, and view persisted portfolio metrics after refresh/re-login.

---

## Folder Map (What Each Directory Does)

```
one82.5/
├── CONTEXT.md              ← YOU ARE HERE — AI entry point
├── VISION.md               ← Full product vision + roadmap phases
├── README.md               ← Full technical setup, API routes, deploy flow
├── PROGRESS_LOG.md         ← Daily dev log — read this before generating questions
├── HIERARCHY_STRUCTURE.md  ← Role hierarchy source of truth (Overseer > ISO > Merchant)
├── USER_IDEA.md            ← Raw product idea notes
├── BRAND_TEMPLATE.md       ← Brand/design guidelines
│
├── app/                    ← Next.js App Router (pages, layouts, API route wrappers)
├── api/                    ← Core API route handlers (auth, data, health)
│   └── _lib/backend.ts     ← Main Supabase backend logic
├── components/             ← Shared React UI components
│   └── (ISODashboard, MerchantLedger, StatementReader, Profitability, etc.)
├── services/               ← External integrations (Stripe, Square, processor sync)
├── config/                 ← App-wide configuration
├── supabase/
│   └── migrations/         ← 5 Supabase SQL migration files (schema history)
├── scripts/                ← Ops/health check scripts
├── test-data/              ← CSV import templates for dev/testing
├── docs/                   ← Additional docs (vision-lock-v1.md lives here)
│
├── App.tsx                 ← Root app component (role routing + view switching)
├── types.ts                ← All TypeScript interfaces and types
├── constants.ts            ← App-wide constants
└── .env.example            ← Environment variable template
```

---

## Key Architecture Decisions (Do Not Override)

- **ISO-first GTM:** The ISO is the primary paid customer. Do not build merchant-direct self-serve production flows.
- **Auth/Data Trust:** Browser cache is convenience only — never source of truth. All persistent state goes through Supabase.
- **AI Safety:** Never fabricate values when inputs are incomplete. Hard-block AI in auth mode when required provenance is missing.
- **Demo Mode:** Must always work end-to-end without external services (all feature flags `false`).
- **AI Provider Abstraction:** Keep AI customization in Settings. No standalone AI config surface.
- **Onboarding:** Production tenants are sales-led (no open signup). ISO imports merchants; merchants get auto-invited.
- **Priority Order (90 days):** Integration reliability + statement reader accuracy > net-new AI surface area.

Full governance rules: `README.md` → Vision Lock v1 section and `docs/vision-lock-v1.md`.

---

## Active API Routes

```
POST   /api/auth/login
GET    /api/auth/session
POST   /api/auth/logout
GET    /api/data/transactions
PUT    /api/data/transactions
GET    /api/data/metrics
GET    /api/data/notifications
POST   /api/data/notifications/read
GET    /api/data/ops
GET    /api/health
```

---

## Environment Flags (Phase Profiles)

| Flag | Demo | Trial |
|---|---|---|
| VITE_ENABLE_BACKEND_AUTH | false | true |
| VITE_ENABLE_BACKEND_DATA | false | true |
| VITE_ENABLE_LIVE_INTEGRATIONS | false | true |
| VITE_ENABLE_EXPERIMENTAL | false | true |
| VITE_DISABLE_AI_UI | false | false |

---

## Pricing Model
- ISO Subscription: **$100/user/month**
- Example: 50 reps × $100 = **$5,000/month** ($60,000/year)

---

## How to Run Daily Questions (Copy-Paste Prompt)

Paste this at the start of any AI coding session:

> *"Read CONTEXT.md, VISION.md, and PROGRESS_LOG.md. Then scan the /app, /api, /components, and /services directories. Based on the current phase in the roadmap and what has or hasn't been built, give me 5 prioritized daily development questions to guide today's progress on One82."*
