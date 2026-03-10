import Groq from "groq-sdk";
import { fixUrl } from "../utils/url";

export interface CausalNode {
  id: string;
  label: string;
  type: "event" | "asset" | "risk";
}

export interface CausalLink {
  source: string;
  target: string;
  description: string;
}

export interface DebateResponse {
  bull: string;
  bullVerdict: string;
  bear: string;
  bearVerdict: string;
  riskManager: string;
  riskVerdict: string;
  tensionScore: number;
}

// 1. Initialize Groq directly for the browser
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true 
});

const callGroq = async (messages: any[], model = "llama-3.3-70b-versatile", json = false) => {
  const options: any = {
    messages,
    model,
  };
  
  if (json) {
    options.response_format = { type: "json_object" };
  }

  const chatCompletion = await groq.chat.completions.create(options);
  return chatCompletion.choices[0].message.content || "";
};

const cleanJsonResponse = (text: string) => {
  let cleaned = text.trim();
  const startBracket = cleaned.indexOf('[');
  const startBrace = cleaned.indexOf('{');
  let first = -1;
  if (startBracket !== -1 && (startBrace === -1 || startBracket < startBrace)) {
    first = startBracket;
  } else {
    first = startBrace;
  }
  const lastBracket = cleaned.lastIndexOf(']');
  const lastBrace = cleaned.lastIndexOf('}');
  let last = -1;
  if (lastBracket !== -1 && (lastBrace === -1 || lastBracket > lastBrace)) {
    last = lastBracket;
  } else {
    last = lastBrace;
  }
  if (first !== -1 && last !== -1 && last > first) {
    return cleaned.substring(first, last + 1);
  }
  return cleaned;
};

export const getCausalGraph = async (headline: string, content: string) => {
  const prompt = `Analyze the following news and generate a highly specific, complex causal knowledge graph (nodes and links).
  Do NOT be generic. Identify specific assets, specific risks, and specific economic mechanisms mentioned or implied.
  
  News: ${headline}
  Content: ${content}
  
  Return ONLY a valid JSON object with 'nodes' and 'links'.
  Nodes should have 'id' (unique string), 'label' (short text), and 'type' (event, asset, or risk).
  Links should have 'source' (must match a node id), 'target' (must match a node id), and 'description'.
  Ensure all link sources and targets exist in the nodes array.`;

  const messages = [{ role: "user", content: prompt }];
  const responseText = await callGroq(messages, "llama-3.3-70b-versatile", true);
  
  try {
    const data = JSON.parse(responseText);
    
    const nodeIds = new Set(data.nodes.map((n: any) => n.id));
    data.links = data.links.filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target));
    
    return data;
  } catch (err) {
    console.error("Groq Parse Error:", err, responseText);
    throw new Error("Failed to parse Groq response as JSON");
  }
};

export const getDebate = async (headline: string, content: string) => {
  const prompt = `Run a high-stakes, specific debate between three sophisticated financial personas regarding this news:
  
  Headline: ${headline}
  Content: ${content}
  
  Personas:
  1. Bull Agent: Aggressively optimistic, identifies why the market is wrong to be worried, focuses on growth and resilience.
  2. Bear Agent: Deeply skeptical, identifies hidden structural risks, second-order contagion, and why the consensus is too complacent.
  3. Risk Manager: Coldly pragmatic, focuses on what this means for a global macro portfolio and how to hedge the specific risks mentioned.
  
  Return ONLY a valid JSON object with:
  - 'bull': markdown analysis (be specific to the event)
  - 'bullVerdict': 1-2 word action (e.g. BUY, HOLD, ACCUMULATE)
  - 'bear': markdown analysis (be specific to the event)
  - 'bearVerdict': 1-2 word action (e.g. SELL, REDUCE, HEDGE)
  - 'riskManager': markdown analysis (be specific to the event)
  - 'riskVerdict': 1-2 word action (e.g. NEUTRAL, DEFENSIVE, CAUTION)
  - 'tensionScore': 0-100`;

  const messages = [{ role: "user", content: prompt }];
  const responseText = await callGroq(messages, "llama-3.3-70b-versatile", true);
  
  try {
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Groq Parse Error:", err, responseText);
    throw new Error("Failed to parse Groq response as JSON");
  }
};

export const getHistoricalMemory = async (theme: string) => {
  const prompt = `Find 3 distinct, real historical macro-economic events from the last 20 years that relate to the theme: "${theme}". 
  
  For each event, you MUST provide:
  1. 'date': YYYY-MM-DD
  2. 'title': The actual headline or event name
  3. 'summary': 2-3 sentence analysis.
  4. 'link': A relevant URL (e.g. from Wikipedia or a major news site).
  
  Return ONLY a JSON object with a key 'events' containing the array.`;

  try {
    const responseText = await callGroq([{ role: "user", content: prompt }], "llama-3.1-8b-instant", true);
    const data = JSON.parse(responseText);
    const events = data.events || [];

    return events.map((item: any) => {
      const headline = item.title || item.headline || "";
      const finalUrl = fixUrl(item.link || item.url, headline);
      return { 
        ...item, 
        id: item.id || `mem-${Math.random().toString(36).substr(2, 9)}`, 
        url: finalUrl,
        link: finalUrl
      };
    });
  } catch (err) {
    console.error("Groq Memory Error:", err);
    throw err;
  }
};

export const fetchLiveSignals = async () => {
  const currentTime = new Date().toISOString();
  const prompt = `Current Time: ${currentTime}
  Generate the top 15 most impactful global macro-economic news headlines that would be relevant today. 
  Since you don't have real-time search, provide highly realistic and plausible headlines based on current global trends (Geopolitics, Inflation, Central Banks, Energy).
  
  For each news item, provide:
  1. headline: The headline.
  2. content: A 2-3 sentence summary.
  3. theme: A category (e.g., Monetary Policy, Geopolitics, Energy, Trade).
  4. source: A plausible news organization.
  5. url: A placeholder URL.
  6. disruption_score: 1-10.
  7. contagion_score: 1-10.
  8. sentiment: -1.0 to 1.0.
  9. impacts: A list of objects with 'region' (country name), 'relation' (positive/negative), and 'description'.
  
  Return ONLY the results as a JSON object with a key 'signals' containing the array.`;

  try {
    const responseText = await callGroq([{ role: "user", content: prompt }], "llama-3.3-70b-versatile", true);
    const data = JSON.parse(responseText);
    const signals = data.signals || [];

    return signals.map((item: any) => ({
      ...item,
      id: item.id || `live-${Math.random().toString(36).substr(2, 9)}`,
      url: fixUrl(item.url, item.headline),
      scores: {
        disruption: item.disruption_score,
        contagion: item.contagion_score,
        heat: 5
      }
    }));
  } catch (err) {
    console.error("Groq Live Signals Error:", err);
    throw err;
  }
};
