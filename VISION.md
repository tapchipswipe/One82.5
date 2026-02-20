# One82: Intelligent Inventory & ISO Platform

## Core Mission
Turn transaction data into a "Goldmine" for both Merchants and ISOs (Independent Sales Organizations).
1.  **For Merchants (Inventory Intelligence):** Connect to live POS data (Square/Stripe/Clover). Automate inventory management. Know exactly when to reorder and order directly from the platform.
2.  **For ISOs (The "Goldmine"):** Translate the *live stream of customer transactions* into valuable insights — identifying churn risks, growth patterns, and up-sell opportunities the moment the data flows in. *The value is not in the statements — it's in the real-time data itself.*

---

## 🏗 Architecture: Dual-POV Platform

The platform handles two distinct user roles with separate interfaces:

### 1. Merchant View (The Business Owner)
*   **Data Source:** Live API Connection (Stripe, Square, Clover).
*   **Inventory Intelligence:**
    *   *Analysis:* "You sold 500 apples this week. You have 2 days of stock left."
    *   *Action:* "Order 500 more now" (One-click ordering).
*   **Performance Dashboard:**
    *   Toggle views: Day / Week / Year.
    *   Metrics: Revenue, Transaction Count, Credit Card Volume.
*   **Utilities:**
    *   Smart To-Do List.
    *   Store Type Personalization (Restaurant vs. Retail vs. Service).

### 2. ISO View (The Aggregator/Processor)
*   **Data Source:** Live Feed of all Merchants in Portfolio.
*   **The "Goldmine" (Transaction Intelligence):**
    *   *Real-time Data Translation:* Every customer swipe becomes a data point. The platform converts this live stream into merchant health scores, revenue trends, and behavioral patterns.
    *   *Churn Prediction:* "Merchant #12 (Joe's Pizza) customer frequency dropped 40% vs last month. At risk."
    *   *Volume Analysis:* Live ticker of total processed customer volume.
    *   *Growth Opportunities:* "Merchant #5 customers are spending 20% more per visit than their segment average. Up-sell premium tools."
*   **Statement Tool (Secondary Utility):** Upload a PDF merchant statement → AI extracts rates, fees, and volume → Generates a "Savings Proposal" for new lead acquisition only.

---

## 🚀 Roadmap

### Phase 1: Foundation & Roles (Done)
- [x] **Role-Based Auth (RBAC):** Login as `Merchant` or `ISO`.
- [x] **Onboarding Flow:** Select Store Type (e.g., "Coffee Shop", "Boutique").
- [x] **Dashboard Framework:** Reusable charts with Time-Range toggles (Day/Week/Year).

### Phase 2: The "Goldmine" (Real-Time ISO Intelligence)
- [ ] **Portfolio Engine:** Simulate a stream of transactions from multiple merchants.
- [ ] **ISO Dashboard 2.0:**
    *   Live Volume Ticker.
    *   **Merchant Ledger (Excel Style):** Full list tracking processing rates, volume, and contact info.
    *   "At Risk" Merchant List (Churn Detection).
    *   "Opportunity" Alerts (Up-sell features).
- [ ] **Statement Tool:** Keep as a utility tab for importing *new* leads.

### Phase 3: Inventory Intelligence (Merchant Side)
- [x] **Inventory Engine:** Logic to calculate run-rates based on transaction history.
- [x] **Direct Ordering UI:** Interface to place orders with suppliers — one-click reorder modal wired up.
- [x] **Merchant Integrations:** Merchants can now connect live POS data (Square, Stripe, Clover) via the Integrations page.

### Phase 4: Polish
- [ ] Dark/Light/System Mode (Done).
- [ ] To-Do List Widget.
