import React, { useEffect, useState, useMemo } from 'react';
import { NewsFeed } from './components/NewsFeed';
import { CommandCenter } from './components/CommandCenter';
import { GlobalMap } from './components/GlobalMap';
import { DebateRoom } from './components/DebateRoom';
import { AssetMatrix } from './components/AssetMatrix';
import { AestheticOverlays } from './components/AestheticOverlays';
import { DominoGraph } from './components/DominoGraph';
import { MemoryVault } from './components/MemoryVault';
import { NewsItem } from './data/demoData';
import { getCausalGraph, getDebate, fetchLiveSignals, CausalNode, CausalLink, DebateResponse } from './services/aiProvider';
import { Shield, Activity, Database, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { getStableId } from './utils/id';

import { insertNews, getRecentNews, deleteNews, bulkSaveNews, getCognitiveLoad } from './services/database';
import { demoNews } from './data/demoData';

export default function App() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [cognitiveLoad, setCognitiveLoad] = useState<{ load: number, status: string, recommendation: string } | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [analysis, setAnalysis] = useState<{ graph: { nodes: CausalNode[], links: CausalLink[] }, debate: DebateResponse } | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'analysis'>('dashboard');

  const filteredNews = useMemo(() => {
    if (selectedNewsIds.length === 0) return news;
    return news.filter(item => selectedNewsIds.includes(item.id));
  }, [news, selectedNewsIds]);

  useEffect(() => {
    const syncData = () => {
      let currentNews = getRecentNews();
      
      // Seed demo data if empty
      if (currentNews.length === 0) {
        bulkSaveNews(demoNews);
        currentNews = getRecentNews();
      }
      
      setNews(currentNews);
      setCognitiveLoad(getCognitiveLoad());
    };

    syncData();
    const interval = setInterval(syncData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectNews = React.useCallback(async (item: NewsItem) => {
    setSelectedNews(item);
    setSelectedNewsIds(prev => prev.includes(item.id) ? prev : [item.id, ...prev]);
    setLoading(true);
    setAnalysis(null);
    setView('analysis');
    try {
      const [graph, debate] = await Promise.all([
        getCausalGraph(item.headline, item.content),
        getDebate(item.headline, item.content)
      ]);
      setAnalysis({ graph, debate });
    } catch (err) {
      console.error('Analysis failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to analyze news. Please check your API key.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteNews = async (id: string) => {
    deleteNews(id);
    const updatedNews = getRecentNews();
    setNews(updatedNews);
    setCognitiveLoad(getCognitiveLoad());
    
    setSelectedNewsIds(prev => prev.filter(sid => sid !== id));
    if (selectedNews?.id === id) setSelectedNews(null);
  };

  const handleSync = async () => {
    try {
      console.log("Starting Live Signal Sync from Frontend...");
      const liveSignals = await fetchLiveSignals();
      
      if (!liveSignals || liveSignals.length === 0) {
        throw new Error("No live signals found.");
      }

      const newsItems = liveSignals.map((signal: any) => {
        return {
          id: signal.id,
          headline: signal.headline,
          content: signal.content,
          theme: signal.theme,
          source: signal.source,
          url: signal.url,
          timestamp: new Date().toISOString(),
          scores: {
            disruption: signal.disruption_score,
            contagion: signal.contagion_score,
            heat: 5
          },
          sentiment: signal.sentiment,
          impacts: signal.impacts,
          disruption_score: signal.disruption_score,
          contagion_score: signal.contagion_score
        };
      });

      // Save directly to LocalStorage
      bulkSaveNews(newsItems);
      
      // Update local state immediately
      const updatedNews = getRecentNews();
      setNews(updatedNews);
      setCognitiveLoad(getCognitiveLoad());
      setSelectedNewsIds([]);
    } catch (err) {
      console.error(err);
      alert(`Sync Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-newsprint text-ink font-sans selection:bg-editor-red/20">
      <AestheticOverlays />
      {/* Newspaper Masthead */}
      <header className="border-b-4 border-ink px-6 py-8 bg-newsprint sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-6">
          <div className="flex-1" />
          <div className="flex-1 text-center">
            <h1 className="text-5xl font-serif font-bold tracking-tighter uppercase border-y border-ink/10 py-2 inline-block px-12">
              MacroMind
            </h1>
          </div>
          <div className="flex-1 text-right text-sm font-mono uppercase tracking-widest opacity-80">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          </div>
          
          <div className="flex items-center justify-between border-y border-ink/20 py-2">
            <div className="flex gap-8">
              <button 
                onClick={() => setView('dashboard')}
                className={cn(
                  "text-[11px] font-mono uppercase tracking-widest transition-colors relative",
                  view === 'dashboard' ? "text-editor-red font-bold" : "text-ink/40 hover:text-ink"
                )}
              >
                Dashboard
                {view === 'dashboard' && <motion.div layoutId="nav-underline" className="absolute -bottom-[9px] left-0 right-0 h-1 bg-editor-red" />}
              </button>
              <button 
                onClick={() => setView('analysis')}
                className={cn(
                  "text-[11px] font-mono uppercase tracking-widest transition-colors relative",
                  view === 'analysis' ? "text-editor-red font-bold" : "text-ink/40 hover:text-ink"
                )}
              >
                Analysis
                {view === 'analysis' && <motion.div layoutId="nav-underline" className="absolute -bottom-[9px] left-0 right-0 h-1 bg-editor-red" />}
              </button>
            </div>

            <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-editor-red animate-pulse" />
                Live Feed Active
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
        {/* Left Column: Command Center & News Feed */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <CommandCenter news={news} cognitiveLoad={cognitiveLoad} onSync={handleSync} />
          <NewsFeed 
            news={news} 
            onSelect={handleSelectNews} 
            onDelete={handleDeleteNews}
            selectedId={selectedNews?.id} 
          />
        </div>

        {/* Right Column: Analysis Engine */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <AnimatePresence>
            {selectedNewsIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/60 border-l-4 border-editor-red p-4 rounded-sm shadow-sm mb-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-editor-red" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-editor-red font-bold">
                      Active Signal Analysis ({selectedNewsIds.length})
                    </span>
                  </div>
                  {selectedNewsIds.length > 1 && (
                    <button 
                      onClick={() => setSelectedNewsIds([])}
                      className="text-[9px] font-mono text-ink/40 hover:text-editor-red uppercase tracking-widest"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedNewsIds.map((id, idx) => {
                    const item = news.find(n => n.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className={cn("flex items-start gap-3", idx > 0 && "pt-2 border-t border-ink/5")}>
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-editor-red flex-shrink-0" />
                        <h2 className={cn(
                          "font-serif font-bold italic text-ink leading-tight",
                          selectedNewsIds.length === 1 ? "text-2xl" : "text-lg"
                        )}>
                          {item.headline}
                        </h2>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <GlobalMap 
            news={news} 
            onSelect={(item) => {
              handleSelectNews(item);
              setSelectedNewsIds([item.id]);
            }} 
            selectedNewsIds={selectedNewsIds}
            onFilterChange={setSelectedNewsIds}
          />
          {view === 'dashboard' && <AssetMatrix news={news} />}
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-[calc(100vh-240px)] border border-ink/10 bg-white/40 rounded-sm flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 border border-ink/10 rounded-full flex items-center justify-center mb-6">
                  <Activity className="w-10 h-10 opacity-10" />
                </div>
                <h2 className="text-3xl font-serif mb-4 italic">Awaiting Signal Ingestion</h2>
                <p className="text-sm text-ink/60 max-w-md font-body">
                  Select a high-disruption event from the feed to trigger the causal engine and multi-agent debate room.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {loading ? (
                  <div className="h-[calc(100vh-240px)] border border-ink/10 bg-white/40 rounded-sm flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-2 border-editor-red/20 border-t-editor-red rounded-full animate-spin mb-4" />
                    <div className="font-mono text-[10px] uppercase tracking-widest text-editor-red">
                      Processing Causal Chains...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <button 
                        onClick={() => setView('dashboard')}
                        className="text-[10px] font-mono uppercase tracking-widest text-editor-red hover:text-editor-red/80 flex items-center gap-2"
                      >
                        ← Back to Dashboard
                      </button>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-ink/20">
                        Analysis Engine Active
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <DebateRoom debate={analysis?.debate} />
                      <MemoryVault theme={selectedNews?.theme} />
                    </div>
                    <DominoGraph graph={analysis?.graph} />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
