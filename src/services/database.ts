// src/services/database.ts
// This service now handles data persistence in the browser's LocalStorage, 
// allowing the app to run on static hosting like AWS Amplify without a Node.js server.

export interface NewsItem {
  id: string;
  headline: string;
  content: string;
  url?: string;
  theme: string;
  source: string;
  timestamp: string;
  sentiment: number;
  impacts: any[];
  scores: {
    disruption: number;
    contagion: number;
    heat: number;
  };
  disruption_score?: number;
  contagion_score?: number;
}

const STORAGE_KEY = 'macromind_signals_v1.1'; // Change this to force a clear for all users
const VERSION_KEY = 'macromind_storage_version';
const CURRENT_VERSION = '1.1'; 

// Auto-clear logic on module load
if (typeof window !== 'undefined') {
  const savedVersion = localStorage.getItem(VERSION_KEY);
  if (savedVersion !== CURRENT_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    console.log(`Storage migrated to version ${CURRENT_VERSION}`);
  }
}

const getStoredData = (): NewsItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Storage corruption detected, auto-clearing...", e);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

const setStoredData = (data: NewsItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload(); // Reload to re-seed demo data
};

export const insertNews = (item: any) => {
  const news = getStoredData();
  const headline = item?.headline ?? "";
  const normalizedHeadline = headline.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Format the item correctly
  const newsItem: NewsItem = {
    ...item,
    id: item.id || Math.random().toString(36).substr(2, 9),
    timestamp: item.timestamp || new Date().toISOString(),
    impacts: item.impacts || [],
    scores: item.scores || {
      disruption: item.disruption_score || 0,
      contagion: item.contagion_score || 0,
      heat: calculateHeatIndex(item.theme)
    }
  };

  const existingIndex = news.findIndex(n => (n?.headline ?? "").toLowerCase().trim().replace(/\s+/g, ' ') === normalizedHeadline);

  if (existingIndex !== -1) {
    news[existingIndex] = newsItem;
  } else {
    news.push(newsItem);
  }

  setStoredData(news);
};

export const getRecentNews = (limit = 50): NewsItem[] => {
  const news = getStoredData();
  return news
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
    .map(item => ({
      ...item,
      scores: {
        ...item.scores,
        heat: calculateHeatIndex(item.theme)
      }
    }));
};

export const deleteNews = (id: string) => {
  const news = getStoredData();
  setStoredData(news.filter(n => n.id !== id));
};

export const calculateHeatIndex = (theme: string): number => {
  const news = getStoredData();
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  const count = news.filter(n => n.theme === theme && new Date(n.timestamp).getTime() > yesterday).length;
  return Math.min(10, (count / 5) * 10);
};

export const getCognitiveLoad = () => {
  const news = getStoredData();
  const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
  const highImpactCount = news.filter(n => (n.scores?.disruption > 7) && new Date(n.timestamp).getTime() > fourHoursAgo).length;
  
  const load = Math.min(100, (highImpactCount / 3) * 100);
  return { 
    load, 
    status: load > 80 ? "Critical" : load > 50 ? "Elevated" : "Optimal",
    recommendation: load > 80 ? "Throttle Non-Essential Signals" : "Full Stream Active"
  };
};

export const bulkSaveNews = (items: any[]) => {
  items.forEach(item => insertNews(item));
};

export default {
  insertNews,
  getRecentNews,
  deleteNews,
  calculateHeatIndex,
  getCognitiveLoad,
  bulkSaveNews,
  clearAllData
};
