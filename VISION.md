# One82: Intelligent Inventory & ISO Platform

## Core Mission
Turn transaction data into a "Goldmine" for both Merchants and ISOs (Independent Sales Organizations).
1.  **For Merchants (Inventory Intelligence):** Connect to live POS data (Square/Stripe/Clover). Automate inventory management. Know exactly when to reorder and order directly from the platform.
2.  **For ISOs (The "Goldmine"):** Analyze the *live stream* of all merchant transactions to find insights, churn risks, and up-sell opportunities. *Statements are just one input; the real value is the flow.*

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
*   **The "Goldmine" (Portfolio Intelligence):**
    *   *Churn Prediction:* "Merchant #12 (Joe's Pizza) volume dropped 40% vs last month. At risk."
    *   *Volume Analysis:* Live ticker of total processed volume.
    *   *Growth Opportunities:* "Merchant #5 is processing $50k/mo but isn't using our Inventory tool. Up-sell opportunity."
*   **Statement Tool (Secondary):** Upload a PDF merchant statement -> AI extracts rates, fees, and volume -> Generates a "Savings Proposal".

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
- [ ] **Inventory Engine:** Logic to calculate run-rates based on transaction history.
- [ ] **Direct Ordering UI:** Interface to place orders with suppliers.

### Phase 4: Polish
- [ ] Dark/Light/System Mode (Done).
- [ ] To-Do List Widget.
