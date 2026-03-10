import * as groq from "./groq";
import * as gemini from "./gemini";

export type { CausalNode, CausalLink, DebateResponse } from "./groq";

export type AIProvider = "groq" | "gemini";

export const setProvider = (provider: AIProvider) => {
  localStorage.setItem("ai_provider", provider);
};

export const getProvider = (): AIProvider => {
  return "gemini";
};

export const getCausalGraph = groq.getCausalGraph;
export const getDebate = groq.getDebate;
export const getHistoricalMemory = gemini.getHistoricalMemory;
export const fetchLiveSignals = gemini.fetchLiveSignals;
