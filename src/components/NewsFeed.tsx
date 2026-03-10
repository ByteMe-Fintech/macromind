import React from 'react';
import { NewsItem } from '../data/demoData';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InfoIcon } from './InfoIcon';
import { Trash2, Flame, ExternalLink } from 'lucide-react';
import { fixUrl } from '../utils/url';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Robustly validates if a URL is likely to be a direct article.
 * Checks for common problematic patterns like generic homepages or invalid structures.
 */
const isLikelyDirectArticle = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string' || url === "SEARCH_FALLBACK") return false;
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    
    const lowerUrl = (url ?? "").toLowerCase().trim();
    const hostname = (parsed.hostname ?? "").toLowerCase();
    
    // Check for invalid/placeholder TLDs or domains
    if (hostname.includes("example.com") || hostname.includes("test.com") || hostname.includes("localhost")) return false;
    
    // Check for search redirects which are problematic
    if (lowerUrl.includes("google.com/url") || lowerUrl.includes("bing.com/ck")) return false;

    // Check if it's just a homepage (no path)
    const pathSegments = parsed.pathname.split('/').filter(s => s.length > 0);
    if (pathSegments.length === 0) return false;

    // Check for common news section pages that aren't specific articles
    const commonSections = ["world", "business", "finance", "politics", "news", "markets", "economy", "index.html", "index.php"];
    if (pathSegments.length === 1 && commonSections.includes((pathSegments[0] ?? "").toLowerCase())) return false;

    return url.length > 15; // Specific articles usually have longer URLs
  } catch {
    return false;
  }
};

export function NewsFeed({ 
  news, 
  onSelect, 
  onDelete,
  selectedId 
}: { 
  news: NewsItem[], 
  onSelect: (item: NewsItem) => void, 
  onDelete?: (id: string) => void,
  selectedId?: string 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 border-b border-ink/10 pb-2">
        <div className="flex items-center">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/40">Signal Stream</h3>
        </div>
        <span className="text-[10px] font-mono text-editor-red/60 font-bold">{news.length} Active Signals</span>
      </div>
      
      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
        {news.map((item) => (
          <div 
            key={item.id} 
            className="relative group cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <div
              className={cn(
                "w-full text-left pb-4 border-b border-ink/5 transition-all duration-200",
                selectedId === item.id 
                  ? "bg-editor-red/[0.03] -mx-2 px-2" 
                  : "hover:bg-black/[0.02]"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-ink/30 uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  {(item.scores?.heat || 0) > 7 && (
                    <div className="flex items-center gap-0.5 text-editor-red animate-pulse">
                      <Flame className="w-2.5 h-2.5" />
                      <span className="text-[8px] font-mono font-bold uppercase">Hot</span>
                    </div>
                  )}
                </div>
                {item.headline ? (
                  <a 
                    href={fixUrl(item.url, item.headline)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 bg-editor-red text-white rounded-sm hover:bg-editor-red/80 transition-all shadow-md group/link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[9px] font-mono uppercase font-bold tracking-wider">
                      View on Google
                    </span>
                    <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-ink/5 text-ink/30 rounded-full">
                    <span className="text-[8px] font-mono uppercase">Internal Signal</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 text-left">
                  <h4 className={cn(
                    "text-lg font-serif font-bold leading-tight transition-colors",
                    selectedId === item.id ? "text-editor-red" : "text-ink group-hover:text-editor-red"
                  )}>
                    {item.headline}
                  </h4>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-ink/40 border border-ink/10 px-1">
                    {item.source}
                  </div>
                  <div className="text-[9px] font-mono text-ink/60">
                    DISRUPTION: {item.scores?.disruption || 0} // CONTAGION: {item.scores?.contagion || 0}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1 bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full", (item.scores?.heat || 0) > 7 ? "bg-editor-red" : "bg-ink/20")} 
                      style={{ width: `${(item.scores?.heat || 0) * 10}%` }} 
                    />
                  </div>
                  <span className="text-[8px] font-mono text-ink/30">H:{(item.scores?.heat || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-ink/40 hover:text-editor-red"
                title="Delete Signal"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
