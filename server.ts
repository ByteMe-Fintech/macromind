import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import { GoogleGenAI, Type } from "@google/genai";
import { demoNews } from "./src/data/demoData";
import db, { insertNews, getRecentNews, calculateHeatIndex, getNewsByTimeRange, clearDuplicates, deleteNews } from "./src/services/database";

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Initialize Groq client lazily
    let groqClient: Groq | null = null;
    const getGroq = () => {
      if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return null;
        groqClient = new Groq({ apiKey });
      }
      return groqClient;
    };

    // Initialize Gemini client lazily
    let geminiClient: GoogleGenAI | null = null;
    const getGemini = () => {
      if (!geminiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;
        // The @google/genai SDK expects an object: { apiKey: string }
        geminiClient = new GoogleGenAI({ apiKey });
      }
      return geminiClient;
    };

    // Health check at the top
    app.get("/api/health", (req, res) => {
      console.log(`[${new Date().toISOString()}] Health check requested`);
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Groq API Proxy
    app.post("/api/groq/chat", async (req, res) => {
      try {
        const { messages, model = "llama-3.3-70b-versatile", temperature = 0.7 } = req.body;
        const groq = getGroq();
        
        if (!groq) {
          return res.status(400).json({ error: "Groq API key not configured in server environment" });
        }

        const completion = await groq.chat.completions.create({
          messages,
          model,
          temperature,
        });

        res.json(completion);
      } catch (error: any) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: error.message || "Failed to call Groq API" });
      }
    });

    app.get("/api/gemini/live-signals", async (req, res) => {
      console.log(`[${new Date().toISOString()}] GET /api/gemini/live-signals requested (v2)`);
      try {
        const gemini = getGemini();
        if (!gemini) {
          return res.status(400).json({ error: "Gemini API key not configured" });
        }

        const currentTime = new Date().toISOString();
        const prompt = `Current Time: ${currentTime}
        Search for the top 10 most impactful global macro-economic news headlines from the last 3 months.
        Focus on Geopolitics, Central Banks, Inflation, Energy, and Trade.
        
        Return the data as a JSON array of objects with these properties:
        headline, content, theme, source, url, disruption_score (1-10), contagion_score (1-10), sentiment (-1.0 to 1.0), impacts (array of {region, relation, description}).`;

        const result = await gemini.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        // The @google/genai response has result.text as a shortcut or access parts directly
        const text = result.text();
        res.json(JSON.parse(text));
      } catch (error: any) {
        console.error("Gemini Live Signals Error:", error);
        res.status(500).json({ error: error.message || "Failed to fetch live signals" });
      }
    });

    app.get("/api/gemini/historical-memory", async (req, res) => {
      try {
        const { theme } = req.query;
        if (!theme) return res.status(400).json({ error: "Theme is required" });

        const gemini = getGemini();
        if (!gemini) {
          return res.status(400).json({ error: "Gemini API key not configured" });
        }

        const prompt = `Find 3 distinct, real historical macro-economic events from the last 20 years that relate to the theme: "${theme}". 
        Return a JSON array of objects with:
        - date: YYYY-MM-DD
        - title: The actual headline or event name
        - summary: 2-3 sentence analysis.
        - link: A REAL, working DIRECT URL to the event.`;

        const result = await gemini.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const text = result.text();
        res.json(JSON.parse(text));
      } catch (error: any) {
        console.error("Gemini Historical Memory Error:", error);
        res.status(500).json({ error: error.message || "Failed to fetch historical memory" });
      }
    });

    // Clear old news on startup to keep only the latest
    try {
      db.exec("DELETE FROM news");
      console.log("Database cleared of old news.");
    } catch (dbErr) {
      console.error("Failed to clear database:", dbErr);
    }

    // Seed database with demo data on startup
    demoNews.forEach(item => insertNews(item));
    clearDuplicates();

    // API Routes
    app.get("/api/news", (req, res) => {
      console.log(`[${new Date().toISOString()}] GET /api/news requested`);
      try {
        const news = getRecentNews();
        // Enrich news with real-time heat index
        const enrichedNews = news.map((item: any) => ({
          ...item,
          scores: {
            disruption: item.disruption_score,
            contagion: item.contagion_score,
            heat: calculateHeatIndex(item.theme)
          }
        }));
        res.json(enrichedNews);
      } catch (err) {
        console.error("Failed to fetch news:", err);
        res.status(500).json({ error: "Failed to fetch news" });
      }
    });

    app.delete("/api/news/:id", (req, res) => {
      const { id } = req.params;
      deleteNews(id);
      res.json({ success: true });
    });

    app.post("/api/news/bulk-save", (req, res) => {
      try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
          return res.status(400).json({ error: "Items array required" });
        }

        items.forEach((item: any) => {
          // Ensure timestamp is set if missing
          if (!item.timestamp) item.timestamp = new Date().toISOString();
          insertNews(item);
        });
        
        clearDuplicates();
        res.json({ success: true, count: items.length });
      } catch (error) {
        console.error("Bulk save error:", error);
        res.status(500).json({ error: "Failed to save news items" });
      }
    });

    app.post("/api/news/save-single", (req, res) => {
      try {
        const item = req.body;
        if (!item.id || !item.headline) {
          return res.status(400).json({ error: "Invalid news item" });
        }
        insertNews(item);
        res.json({ success: true });
      } catch (error) {
        console.error("Save single error:", error);
        res.status(500).json({ error: "Failed to save news item" });
      }
    });

    app.get("/api/cognitive-load", (req, res) => {
      console.log(`[${new Date().toISOString()}] GET /api/cognitive-load requested`);
      try {
        // Calculate cognitive load based on high-disruption events in the last 4 hours
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        const highImpactCount = db.prepare('SELECT COUNT(*) as count FROM news WHERE disruption_score > 7 AND timestamp > ?').get(fourHoursAgo) as any;
        
        const load = Math.min(100, (highImpactCount.count / 3) * 100);
        res.json({ 
          load, 
          status: load > 80 ? "Critical" : load > 50 ? "Elevated" : "Optimal",
          recommendation: load > 80 ? "Throttle Non-Essential Signals" : "Full Stream Active"
        });
      } catch (err) {
        console.error("Failed to calculate cognitive load:", err);
        res.status(500).json({ error: "Failed to calculate cognitive load" });
      }
    });

    app.get("/api/news/history", (req, res) => {
      const { start, end } = req.query;
      if (!start || !end) return res.status(400).json({ error: "Missing time range" });
      const news = getNewsByTimeRange(start as string, end as string);
      const enrichedNews = news.map((item: any) => ({
        ...item,
        scores: {
          disruption: item.disruption_score,
          contagion: item.contagion_score,
          heat: calculateHeatIndex(item.theme)
        }
      }));
      res.json(enrichedNews);
    });

    app.get("/api/asset-matrix", (req, res) => {
      // Logic to map current news to asset classes
      const assets = [
        { id: "fx-usd", label: "USD", category: "FX", disruption: 4.2 },
        { id: "fx-eur", label: "EUR", category: "FX", disruption: 2.1 },
        { id: "fx-jpy", label: "JPY", category: "FX", disruption: 6.8 },
        { id: "com-oil", label: "Oil", category: "Commodities", disruption: 8.4 },
        { id: "com-gold", label: "Gold", category: "Commodities", disruption: 3.5 },
        { id: "eq-tech", label: "Tech", category: "Equities", disruption: 7.2 },
        { id: "eq-energy", label: "Energy", category: "Equities", disruption: 9.1 },
        { id: "fi-10y", label: "10Y Yield", category: "Fixed Income", disruption: 5.5 }
      ];
      res.json(assets);
    });

    app.post("/api/analyze", async (req, res) => {
      // This endpoint is now just a placeholder as analysis should happen on frontend
      res.status(405).json({ error: "Analysis must be performed client-side" });
    });

    app.get("/api/memory", async (req, res) => {
      // This endpoint is now just a placeholder as memory fetch should happen on frontend
      res.status(405).json({ error: "Memory fetch must be performed client-side" });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static("dist"));
    }

    // Global Error Handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error("Unhandled Server Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`MacroMind Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
