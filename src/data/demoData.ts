export interface Impact {
  region: string;
  relation: 'positive' | 'negative';
  description: string;
}

export interface NewsItem {
  id: string;
  timestamp: string;
  headline: string;
  source: string;
  content: string;
  url?: string;
  scores: {
    disruption: number;
    heat: number;
    contagion: number;
  };
  theme: string;
  impacts?: Impact[];
}

export const demoNews: NewsItem[] = [];
