<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

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

Supabase-backed persistence is automatically enabled when all of these are present in `.env.local`:

```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

If any variable is missing (or Supabase has a recoverable runtime error), local in-memory demo persistence is used as fallback.

To test end-to-end backend mode locally:
1. Start `npm run dev`
2. On Login, switch to **Backend Auth**
3. Sign in with any email (use an email containing `iso` to auto-map ISO role)

No separate backend process is required for this local dev flow.

### Backend Implementation Artifacts (Supabase)
- API contract: [docs/backend/API_CONTRACT.md](docs/backend/API_CONTRACT.md)
- Supabase migration: [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql)
- Setup guide: [docs/backend/SUPABASE_SETUP.md](docs/backend/SUPABASE_SETUP.md)

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
