import * as groq from "./groq";

export type { CausalNode, CausalLink, DebateResponse } from "./groq";

export type AIProvider = "groq";

export const setProvider = (provider: AIProvider) => {
  localStorage.setItem("ai_provider", provider);
};

export const getProvider = (): AIProvider => {
  return "groq";
};

export const getCausalGraph = groq.getCausalGraph;
export const getDebate = groq.getDebate;
export const getHistoricalMemory = groq.getHistoricalMemory;
export const fetchLiveSignals = groq.fetchLiveSignals;
