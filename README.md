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
    Create a `.env.local` file in the root and add your Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

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

---

<div align="center">
Built with ❤️ for the next generation of payment intelligence.
</div>
