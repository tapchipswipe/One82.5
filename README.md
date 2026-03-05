# ONE82
### Transaction Intelligence & ISO Portfolio Platform
</div>

---

## 🌟 The Vision
**ONE82** transforms raw **transaction data** into a "Goldmine" of actionable insights for **Merchants** and **ISOs** (Independent Sales Organizations).

By connecting to existing payment processors (Stripe, Square, Clover, TSYS, Fiserv, WorldPay), ONE82 turns transactional streams into real-time intelligence, profitability tracking, and AI-powered merchant statement analysis — empowering ISOs to manage portfolios and merchants to understand their business performance.

---

## 🏗 Dual-POV Architecture

### 1. Merchant View (The Business Owner)
Access transaction intelligence and business insights in real-time.
- **Transaction Analytics**: Revenue and transaction volume with Day/Week/Year toggles
- **Credit Card Volume**: Live tracking of total card processing volume
- **Performance Dashboard**: Interactive visualizations of growth patterns and trends
- **AI Inventory Intelligence** (Transaction-Derived):
  - Analyze purchase patterns from transaction data to identify stock trends
  - "You sold 500 apples this week. Based on patterns, you have 2 days of stock left."
  - Predict when to reorder based on transaction frequency and volume
  - Identify peak purchase times for inventory planning
- **Smart Tools**: Integrated To-Do lists and store-type personalization
- **Live Assistant**: AI-powered data chat to answer questions about business performance

### 2. ISO View (The Portfolio Manager)
Transform manual processing into proactive portfolio management.
- **Portfolio Intelligence**: Real-time tracking of total processed volume across all merchants
- **Merchant Ledger**: Excel-style spreadsheet to track:
  - Company name, volume, price point, processing rates
  - Live transaction volume per merchant
- **Per-Rep Profitability**: Track residual income per sales representative
- **AI Statement Reader**: Upload merchant statements for deep analysis including:
  - Processing volume (daily/monthly/yearly toggles)
  - Average ticket size & fee optimization (high ticket = low TXN fee, low ticket = high TXN fee)
  - Interchange rates analysis
  - Card brand breakdown (percentage of premium cards)
  - Processing method risk (swiped vs. hand-keyed)
  - Attrition rate tracking
  - MCC code analysis (merchant category risk levels)
  - Growth/shrink patterns over time
  - Transaction type analysis (debit vs. credit volume)
  - Per-account profitability (residual vs. support cost)
- **Lead Generation**: Extract fees from prospect statements to generate savings proposals

---

## 🔌 Integrations

**Payment Processors:**
- Stripe, Square, Clover
- TSYS, Global Payments
- Payrock, Fiserv
- WorldPay, Elevon

**Terminal APIs:**
- Integrated terminal data streams for transaction capture

---

## 🚀 Current Technical State
Built with a modern, high-performance stack:
- **Core**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Intelligence**: [Google Gemini Pro](https://deepmind.google/technologies/gemini/) (via Google AI Studio)
- **Styling**: Clean white theme with dark/light mode support
- **Components**: Modular architecture including `ISODashboard`, `MerchantLedger`, `StatementReader`, `Profitability`, and more

### Capability Status (February 2026)

| Capability | Status | Notes |
|---|---|---|
| Role-based app shell, dashboards, and navigation | **Live** | Available in current front-end experience |
| Statement upload + AI-assisted analysis UX | **Live (AI-Assisted)** | Analysis quality depends on model response and input quality |
| Portfolio/merchant metrics in demo mode | **Simulated** | Seeded/generated data for product walkthroughs |
| Processor integrations (Stripe/Square/Clover/TSYS/Fiserv/etc.) | **Roadmap** | UI scaffolds exist; full live ingestion path is in progress |
| Per-rep profitability from live processor data | **Roadmap** | End-to-end live source-of-truth still being implemented |
| Churn detection and health scoring on live portfolio streams | **Roadmap** | Current alerts are demo/simulation-driven |
| Merchant inventory intelligence from live POS data | **Roadmap** | Current experience is prototype intelligence UX |

### First Production Workflow (Current Build Target)
**ISO user can sign in, connect one processor, and view persisted portfolio metrics after refresh/re-login.**

This is the primary implementation focus before expanding additional feature surfaces.

### Vision Lock v1 (Contributor Constraints)
Implementation and roadmap decisions must align with [docs/vision-lock-v1.md](docs/vision-lock-v1.md).

- **ISO-first GTM:** primary paid customer is the ISO; avoid merchant-direct self-serve assumptions for production flows.
- **Pilot execution lock:** prioritize 1-3 design-partner ISOs and Stripe as the first full production integration path.
- **Auth/data trust model:** in auth/backend mode, browser cache is convenience only (never source of truth); enforce backend tenant isolation, API-layer RBAC, and full session revocation on logout.
- **Provenance + AI safety:** show source context on major analytics surfaces, hard-block AI in auth mode when required provenance is missing/unknown, never fabricate values when inputs are incomplete, and do not substitute simulated AI output in auth mode.
- **Priority order (90 days):** integration reliability and statement reader accuracy outrank net-new AI surface area.
- **Integration UX requirements:** surface failed sync alerts in-app and include freshness indicators on integration-driven views.
- **AI architecture:** preserve provider abstraction and keep AI customization in Settings (no separate standalone AI config surface unless explicitly requested).
- **Onboarding model:** production tenants are sales-led (no open signup); kickoff/import session is required before go-live; merchant onboarding defaults to ISO import + auto-invite with invite-link fallback.
- **AI report scope:** one-page AI Report tab is in-scope when generated from trusted data and labeled with provenance + timestamp.

### PR Checklist (Vision Lock Gate)
Use this checklist before requesting review:

- [ ] Change preserves ISO-first product assumptions and avoids merchant-direct production self-serve.
- [ ] Demo mode still works end-to-end without required external services.
- [ ] Backend/auth-mode behavior does not treat browser cache as source of truth.
- [ ] Tenant isolation and API-layer RBAC assumptions are preserved (not UI-only guards).
- [ ] Logout/session flows preserve full session revocation behavior.
- [ ] AI features are provenance-gated where required and avoid fabricated outputs on missing inputs.
- [ ] Integration-driven views surface sync failures and freshness signals where relevant.
- [ ] Stripe-first onboarding/integration path remains explicit as the recommended production path.
- [ ] Change does not prioritize net-new AI surface over integration reliability or statement-reader accuracy.
- [ ] AI customization changes (if any) stay in Settings-based patterns.
- [ ] Auth-mode AI flows hard-block (with clear next actions) when required provenance/data is missing.
- [ ] Any AI Report tab output is trusted-data-only and includes source/timestamp context.
- [ ] Role changes are reflected in [HIERARCHY_STRUCTURE.md](HIERARCHY_STRUCTURE.md) in the same PR.
- [ ] `npm run check` passes locally.

---

## 🛠 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Google AI Studio API Key](https://aistudio.google.com/)

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/tapchipswipe/One82.5.git
    cd One82.5
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
  Copy `.env.example` to `.env.local` and configure values:
    ```env
  VITE_GEMINI_API_KEY=your_api_key_here
  VITE_ENABLE_BACKEND_AUTH=false
  VITE_ENABLE_BACKEND_DATA=false
  VITE_ENABLE_LIVE_INTEGRATIONS=false
  VITE_ENABLE_EXPERIMENTAL=false
  VITE_OVERSEER_EMAIL=owner@one82.io
  VITE_AUTH_API_BASE=http://localhost:3000
  VITE_DATA_API_BASE=http://localhost:3000
    ```
  Demo Phase defaults should remain `false` for all three feature flags.
  Set `VITE_ENABLE_EXPERIMENTAL=true` to expose the Experimental tab for merchant/ISO users.
  `VITE_OVERSEER_EMAIL` is reserved for owner-only Overseer login access.

  ### Phase Flag Profiles

  | Profile | Flag Values |
  |---|---|
  | Demo | `VITE_ENABLE_BACKEND_AUTH=false`, `VITE_ENABLE_BACKEND_DATA=false`, `VITE_ENABLE_LIVE_INTEGRATIONS=false`, `VITE_ENABLE_EXPERIMENTAL=false` |
  | Trial | `VITE_ENABLE_BACKEND_AUTH=true`, `VITE_ENABLE_BACKEND_DATA=true`, `VITE_ENABLE_LIVE_INTEGRATIONS=true`, `VITE_ENABLE_EXPERIMENTAL=true` |

  Trial should use staging credentials and tenant-isolated data.
  For trial phase bootstrap, you can copy `.env.trial.example` to `.env.local` and fill the Supabase values.
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

### Local Backend Mode (Dev)
The dev server now includes in-memory API routes for backend mode:
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET/PUT /api/data/transactions`
- `GET /api/data/metrics`
- `GET /api/data/notifications`
- `POST /api/data/notifications/read`
- `GET /api/data/ops`
- `GET /api/health`

Supabase-backed persistence is automatically enabled when all of these are present in `.env.local`:

```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

If auth env vars are missing, backend auth login will fail fast so login data is not silently stored outside Supabase.

To test end-to-end backend mode locally:
1. Start `npm run dev`
2. On Login, choose **Auth Login** or **Demo Login** (both persist login records in Supabase when backend auth is enabled)
3. Sign in with any email (use an email containing `iso` to auto-map ISO role)

No separate backend process is required for this local dev flow.

### Backend Implementation Artifacts (Supabase)
- Supabase migration: [supabase/migrations/0001_one82_state.sql](supabase/migrations/0001_one82_state.sql)
- Supabase migration: [supabase/migrations/0002_one82_auth.sql](supabase/migrations/0002_one82_auth.sql)
- Supabase migration: [supabase/migrations/0003_one82_performance.sql](supabase/migrations/0003_one82_performance.sql)
- Supabase migration: [supabase/migrations/0004_one82_domain_foundation.sql](supabase/migrations/0004_one82_domain_foundation.sql)
- Supabase migration: [supabase/migrations/0005_one82_operational_hardening.sql](supabase/migrations/0005_one82_operational_hardening.sql)
- Runtime API implementation: [api/_lib/backend.ts](api/_lib/backend.ts)

### Ops Hardening (Vercel + Supabase)
Use these commands before production deploys:

```bash
npm run typecheck
npm run lint
npm run ops:env
npm run ops:premises
npm run build
npm run ops:health
```

- `typecheck` validates TypeScript compile safety.
- `lint` enforces source quality and hook correctness.
- `ops:env` validates required backend auth/data env vars are present.
- `ops:premises` validates area baselines for local, GitHub, Vercel, and Supabase.

Optional live area probe:

```bash
ONE82_HEALTH_URL=https://one82-5.vercel.app npm run ops:premises
```

When `ONE82_HEALTH_URL` is set, `ops:premises` also checks live `/api/health` Supabase connectivity.
- `ops:health` checks `/api/health` and fails fast if API/Supabase connectivity is unhealthy.
- In-app nav timing samples are stored at localStorage key `one82_navigation_perf_samples` (rolling window, includes role/view/prefetch metadata) to track real navigation latency trends over time.
- `supabase/migrations/0003_one82_performance.sql` adds query indexes and a session-pruning function for long-running auth performance.
- `supabase/migrations/0004_one82_domain_foundation.sql` creates normalized domain tables (tenants, merchants, team members, processor transactions, import jobs, rep assignments, residual snapshots) for the trial/production data model.
- `supabase/migrations/0005_one82_operational_hardening.sql` adds operational tables (processor connections, sync runs, events), consistency triggers, `updated_at` automation, analytics views, and backfill from existing tenant state.

When backend data mode is enabled, transaction writes and CSV import writes now sync to normalized domain tables in addition to tenant state payload storage:
- `one82_processor_transactions`
- `one82_merchants`
- `one82_team_members`
- `one82_import_jobs`

For hosted checks, point health probe to Vercel:

```bash
ONE82_HEALTH_URL=https://<your-deployment-domain> npm run ops:health
```

### Vercel + Supabase Test Flow (Current)
You can test backend auth/data on Vercel using the included serverless routes under `api/`:

- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET/PUT /api/data/transactions`
- `GET /api/data/metrics`
- `GET /api/data/notifications`
- `POST /api/data/notifications/read`
- `GET /api/data/ops`

`GET /api/data/ops` returns both raw streams (`syncRuns`, `events`) and a `summary` object for quick operations status cards (latest sync status/time, failed/running sync counts, events in the last 24 hours, latest event details).

1. Create a Supabase project.
2. Run SQL from both `supabase/migrations/0001_one82_state.sql` and `supabase/migrations/0002_one82_auth.sql` in Supabase SQL Editor.
3. In Vercel → Project Settings → Environment Variables, set:
  - `VITE_ENABLE_BACKEND_AUTH=true`
  - `VITE_ENABLE_BACKEND_DATA=true`
  - `VITE_AUTH_API_BASE=` (empty)
  - `VITE_DATA_API_BASE=` (empty)
  - `VITE_OVERSEER_EMAIL=owner@one82.io` (or your owner email)
  - `SUPABASE_URL=<your-project-url>`
  - `SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>`
  - `ONE82_SUPABASE_STATE_TABLE=one82_state`
  - `ONE82_SUPABASE_LOGIN_USERS_TABLE=one82_login_users`
  - `ONE82_SUPABASE_LOGIN_SESSIONS_TABLE=one82_login_sessions`
  - `ONE82_SUPABASE_SYNC_RUNS_TABLE=one82_sync_runs` (optional)
  - `ONE82_SUPABASE_EVENTS_TABLE=one82_events` (optional)
4. Deploy to Vercel.
5. In app login, select **Auth Login** or **Demo Login** and sign in.
6. Add/edit transactions, refresh, and re-login to confirm data persists.
7. Visit `/api/health` to verify API runtime and Supabase connectivity status.

Data routes can still use in-memory fallback for state if Supabase is temporarily unavailable, but login/session persistence requires Supabase.

### Switch To Trial Phase (One-Step Profile)
Use `.env.trial.example` as the source of truth for trial mode:

1. Copy `.env.trial.example` to `.env.local` (local) or mirror the same keys in Vercel env vars.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Keep `VITE_AUTH_API_BASE` and `VITE_DATA_API_BASE` empty on Vercel to use same-origin `/api/*`.
4. Redeploy (or restart local dev server).

With this profile, backend auth/data and live integrations are enabled by default.

### Role Hierarchy Source of Truth
- Role hierarchy and permissions: [HIERARCHY_STRUCTURE.md](HIERARCHY_STRUCTURE.md)
- Future role-related development must align with this file.

---

## 💰 Pricing Model
**ISO Subscription Tier:**
- $100 per sales representative/user
- Example: 50 sales reps × $100 = **$5,000/month** ($60,000/year)

---

## 📈 Roadmap
- [x] **Phase 1**: Role-Based Architecture & Dashboard Framework
- [x] **Phase 2**: Statement Reader with AI Analysis
- [/] **Phase 3**: Per-Rep Profitability Tracking
- [ ] **Phase 4**: Full Processor API Integrations (TSYS, Fiserv, WorldPay)
- [ ] **Phase 5**: Terminal API Integration
- [ ] **Phase 6**: Advanced Predictive Analytics & Churn Detection

### Simulation Mode Policy
- Simulation mode is used for demo/onboarding and product walkthroughs.
- Core portfolio metrics must not silently fall back to simulated values in live workflows.
- Any simulated or AI-generated output should be explicitly labeled in the UI.

---

<div align="center">
Built with ❤️ for the next generation of payment intelligence.
</div>
