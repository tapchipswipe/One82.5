# One82 Analytics

**One82** is an intelligent financial analytics platform designed to empower small business owners with actionable insights, not just data.

<div align="center">
  <img width="1200" height="475" alt="One82 Dashboard" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🚀 Mission: The Autonomous CFO

We are evolving from a passive dashboard into an active financial agent. Our goal is to simulate business outcomes, autonomously repair financial leaks, and provide a "Voice-to-Visuals" situation room experience.

👉 **[Read our Strategic Vision & Roadmap](./VISION.md)**

## ✨ Key Features

*   **Real-time Dashboard:** Track revenue, expenses, and net profit with live updates.
*   **AI Anomaly Monitor:** Proactive background agent that flags unusual transactions and potential fraud.
*   **Forecasting:** AI-powered revenue predictions based on historical data.
*   **Natural Language Chat:** Ask questions about your data ("How much did I spend on marketing?") and get instant answers.
*   **Statement Reader:** Upload PDF bank statements for automatic parsing and analysis.
*   **Shadow Founder (In Development):** Run "What-If" simulations to test business decisions safely.

## 🛠 Tech Stack

*   **Frontend:** React 19, Vite, TypeScript
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **Charts:** Recharts
*   **AI:** Google Gemini API (`@google/genai`)
    *   *Models:* Gemini 1.5 Flash, Gemini 1.5 Pro
*   **Persistence:** Local Storage (moving to IndexedDB)

## ⚡️ Quick Start

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tapchipswipe/one82.1.git
    cd one82.1
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```

## 🤝 Contributing

We welcome contributions! Please check the [VISION.md](./VISION.md) for our roadmap and open issues.

---
*Built with ❤️ by One82 Team*
