import { getStableId } from "../utils/id";

export const fetchLiveSignals = async () => {
  try {
    const origin = window.location.origin;
    const res = await fetch(`${origin}/api/gemini/live-signals`);
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch live signals");
    }
    
    const data = await res.json();
    
    return data.map((item: any) => ({
      ...item,
      id: getStableId('live', item.headline)
    }));
  } catch (err) {
    console.error("Gemini Live Signals Error:", err);
    throw err;
  }
};

export const getHistoricalMemory = async (theme: string) => {
  try {
    const origin = window.location.origin;
    const res = await fetch(`${origin}/api/gemini/historical-memory?theme=${encodeURIComponent(theme)}`);
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch historical memory");
    }

    const data = await res.json();
    return data.map((item: any) => ({
      ...item,
      id: getStableId('hist', item.title)
    }));
  } catch (err) {
    console.error("Gemini Historical Memory Error:", err);
    throw err;
  }
};
