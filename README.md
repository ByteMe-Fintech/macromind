# MacroMind: Macro-Economic Signal Intelligence

MacroMind is a high-fidelity dashboard for real-time global macro-economic signal analysis. It ingests live news, performs multi-agent causal reasoning, and visualizes complex global interdependencies through interactive maps and graphs.

![MacroMind Dashboard](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🌟 Core Features

- **Live Signal Ingestion**: Real-time monitoring of global headlines using Gemini-powered search and summarization.
- **Global Disruption Map**: Interactive D3.js visualization of regional impact correlations and "heat" zones.
- **Domino Causal Graph**: AI-generated directed graphs showing how events ripple through asset classes (FX, Equities, Commodities).
- **Multi-Agent Debate Room**: Synthetic "round-table" analysis between specialized AI agents (Geopolitical Strategist, Macro Economist, Risk Analyst).
- **Memory Vault**: Contextual retrieval of historical macro events relevant to current signals for deeper perspective.
- **Cognitive Load Monitoring**: Real-time assessment of signal density to prevent analysis paralysis.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (v4), Motion (Framer Motion).
- **Visualization**: D3.js for Geospatial and Force-Directed Graphs.
- **Backend**: Express (Node.js) with SQLite (better-sqlite3) for local state persistence.
- **AI Engines**: 
  - **Groq**: High-speed Llama-3 causal reasoning and debate generation.
  - **Gemini**: 2.0 Flash for real-time signal harvesting and historical memory search.

## 📊 Architecture

### Backend Services
- `server.ts`: Handles API proxying to AI providers, serving the frontend, and managing the SQLite database.
- `database.ts`: Schema management and CRUD operations for news items and heat indices.

### Frontend Services
- `aiProvider.ts`: Orchestrates calls between Groq (reasoning) and Gemini (data retrieval).
- `gemini.ts` & `groq.ts`: Specialized service layers for each AI model.

## 📝 License

This project is private. See `package.json` for versioning and metadata.

---
*Built for macro-strategists and risk analysts who need to see through the noise.*
