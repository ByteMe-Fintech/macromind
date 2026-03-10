import React, { useMemo } from 'react';
import { LayoutGrid, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { InfoIcon } from './InfoIcon';
import { NewsItem } from '../data/demoData';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Asset {
  id: string;
  label: string;
  category: string;
  disruption: number;
}

const ASSET_DEFINITIONS = [
  { id: "fx-usd", label: "USD", category: "FX", keywords: ["usd", "fed", "inflation", "cpi", "treasury", "dollar"] },
  { id: "fx-eur", label: "EUR", category: "FX", keywords: ["eur", "ecb", "eurozone", "germany", "france", "euro"] },
  { id: "fx-jpy", label: "JPY", category: "FX", keywords: ["jpy", "boj", "japan", "yen"] },
  { id: "com-oil", label: "Oil", category: "Commodities", keywords: ["oil", "energy", "hormuz", "opec", "crude"] },
  { id: "com-gold", label: "Gold", category: "Commodities", keywords: ["gold", "safe haven", "inflation hedge"] },
  { id: "eq-tech", label: "Tech", category: "Equities", keywords: ["tech", "ai", "nasdaq", "semiconductor", "nvidia", "software"] },
  { id: "eq-energy", label: "Energy", category: "Equities", keywords: ["energy", "exxon", "shell", "utility", "oil company"] },
  { id: "fi-10y", label: "10Y Yield", category: "Fixed Income", keywords: ["yield", "bond", "treasury", "rates", "fixed income"] }
];

export function AssetMatrix({ news }: { news: NewsItem[] }) {
  const assets = useMemo(() => {
    return ASSET_DEFINITIONS.map(assetDef => {
      const assetNews = news.filter(item => {
        const text = `${item?.headline ?? ""} ${item?.content ?? ""} ${item?.theme ?? ""}`.toLowerCase();
        return assetDef.keywords.some(keyword => text.includes((keyword ?? "").toLowerCase()));
      });


      let disruption = 2.0; // Base level
      if (relevantNews.length > 0) {
        const scores = relevantNews
          .map(item => item.scores?.disruption || 0)
          .sort((a, b) => b - a)
          .slice(0, 3);
        disruption = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      return {
        ...assetDef,
        disruption: parseFloat(disruption.toFixed(1))
      };
    });
  }, [news]);

  const categories = Array.from(new Set(assets.map(a => a.category)));

  return (
    <div className="bg-white/40 border border-ink/10 rounded-sm p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-ink/10 pb-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3 h-3 text-editor-red" />
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/40">Asset Matrix</h3>
          <InfoIcon text="Maps macro-economic volatility to specific asset classes." />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map(cat => (
          <div key={cat} className="space-y-3">
            <div className="text-[10px] font-mono text-ink/40 uppercase tracking-widest border-b border-ink/5 pb-1 font-bold">
              {cat}
            </div>
            <div className="space-y-2">
              {assets.filter(a => a.category === cat).map(asset => (
                <motion.div
                  key={asset.id}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between group cursor-help border-b border-ink/5 pb-1"
                >
                  <span className="text-[11px] font-serif font-bold text-ink/70 group-hover:text-editor-red transition-colors italic">
                    {asset.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-mono font-bold",
                      asset.disruption > 7 ? "text-editor-red" : asset.disruption > 4 ? "text-ink" : "text-ink-blue"
                    )}>
                      {asset.disruption.toFixed(1)}
                    </span>
                    {asset.disruption > 5 ? (
                      <TrendingUp className="w-3 h-3 text-editor-red" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-ink-blue opacity-40" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
