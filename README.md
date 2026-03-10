# Macromind: Macro-Economic Signal Intelligence

Macromind is a high-fidelity dashboard for real-time global macro-economic signal analysis. It performs multi-agent causal reasoning and visualizes complex global interdependencies through interactive maps and graphs, powered exclusively by the Groq Llama-3 ecosystem.



## 🌟 Core Features

- **Plausible Signal Generation**: High-fidelity macro-economic signal generation using Llama-3.3-70B to simulate realistic global headlines and impacts.
- **Global Disruption Map**: Interactive D3.js visualization of regional impact correlations and "heat" zones.
- **Domino Causal Graph**: AI-generated directed graphs showing how events ripple through asset classes (FX, Equities, Commodities).
- **Multi-Agent Debate Room**: Synthetic "round-table" analysis between specialized AI agents (Geopolitical Strategist, Macro Economist, Risk Analyst) powered by Groq.
- **Memory Vault**: Contextual retrieval of historical macro events relevant to current signals using fast inference models.
- **Cognitive Load Monitoring**: Real-time assessment of signal density to prevent analysis paralysis.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (v4), Motion (Framer Motion).
- **Visualization**: D3.js for Geospatial and Force-Directed Graphs.
- **Backend**: Express (Node.js) with SQLite (better-sqlite3) for local state persistence.
- **AI Engine**:
  - **Groq (Llama Ecosystem)**: High-speed inference using `llama-3.3-70b-versatile` for complex reasoning and `llama-3.1-8b-instant` for fast data retrieval.

## 📊 Architecture

### Backend Services
- `server.ts`: Handles API proxying to Groq to secure API keys, serves the frontend, and manages the SQLite database.
- `database.ts`: Schema management and CRUD operations for news items and heat indices.

### Frontend Services
- `aiProvider.ts`: Centralized provider mapping all intelligence tasks to the Groq service layer.
- `groq.ts`: Specialized service layer for structured JSON generation and causal analysis.

## 📝 License

This project is private. See `package.json` for versioning and metadata.

---
*Built for macro-strategists and risk analysts who need to see through the noise.*
