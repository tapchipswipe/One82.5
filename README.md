<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# One82.5
### Intelligent Inventory & ISO Intelligence Platform
</div>

---

## 🌟 The Vision
**One82.5** is a dual-perspective platform designed to turn raw **customer transaction data** into a "Goldmine" of insights for both **Merchants** and **ISOs** (Independent Sales Organizations).

Instead of relying on static monthly statements, One82.5 captures a **live stream of customer transactions** and translates every swipe, sale, and pattern into real-time intelligence — the moment the data flows in.

---

## 🏗 Dual-POV Architecture

### 1. Merchant View (The Business Owner)
Empower business owners with data-driven operations.
- **Inventory Intelligence**: Real-time stock tracking and predictive reordering logic.
- **Performance Dashboard**: Interactive visualizations of revenue, transaction volume, and growth patterns (Day/Week/Year views).
- **Smart Operations**: Integrated To-Do lists and store-type personalization (Retail, Restaurant, Service).
- **Live Assistant**: AI-powered data chat to answer questions about business performance.

### 2. ISO View (The Aggregator/Processor)
Transform manual processing into a proactive portfolio management powerhouse.
- **Portfolio Intelligence**: Real-time tracking of total processed volume across all merchants.
- **Merchant Ledger**: An Excel-style detailed list to keep track of every merchant, their processing rates, and live volume.
- **The Goldmine**: Translates live customer transaction streams into merchant health scores, behavioral patterns, and revenue trend signals.
- **Churn Prediction**: AI-driven alerts when a merchant's customer frequency or spend declines.
- **Growth Engine**: Identifies up-sell opportunities based on transaction patterns, not just feature usage.
- **Statement Reader**: A secondary lead-acquisition tool that extracts fees from PDFs to generate savings proposals for new prospects.

---

## 🚀 Current Technical State
Built with a modern, high-performance stack:
- **Core**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Intelligence**: [Google Gemini Pro](https://deepmind.google/technologies/gemini/) (via Google AI Studio)
- **Styling**: Premium CSS with dark/light mode support and micro-animations.
- **Components**: Modular architecture including `LiveSituationRoom`, `InventoryManager`, `ISODashboard`, and more.

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

## 📈 Roadmap
- [x] **Phase 1**: Role-Based Architecture & Dashboard Framework.
- [/] **Phase 2**: Real-Time Portfolio Engine & Churn Detection.
- [ ] **Phase 3**: Automated Supplier Ordering UI.
- [ ] **Phase 4**: Advanced Predictive Analytics for Merchant Growth.

---

<div align="center">
Built with ❤️ for the next generation of commerce.
</div>
