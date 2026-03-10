import React, { useEffect, useState } from 'react';
import { Database, ExternalLink, Clock } from 'lucide-react';
import { motion } from 'motion/react';

import { getHistoricalMemory } from '../services/aiProvider';

interface Memory {
  id: string;
  date: string;
  title: string;
  summary: string;
  link: string;
}

export function MemoryVault({ theme }: { theme?: string }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (theme) {
      setLoading(true);
      getHistoricalMemory(theme)
        .then(data => {
          setMemories(data as Memory[]);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [theme]);

  return (
    <div className="bg-white/40 border border-ink/10 rounded-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-ink/10 flex items-center justify-between bg-black/[0.02]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-editor-red" />
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/60">Historical Archives</h3>
        </div>
        {selectedMemory && (
          <button 
            onClick={() => setSelectedMemory(null)}
            className="text-[9px] font-mono uppercase text-editor-red hover:underline"
          >
            Back to List
          </button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-white/20">
        {selectedMemory ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-editor-red font-bold uppercase">{selectedMemory.date}</span>
              <a 
                href={selectedMemory.link || `https://www.google.com/search?q=${encodeURIComponent(selectedMemory.title)}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 text-ink/40 hover:text-ink transition-colors" />
              </a>
            </div>
            <h4 className="text-xl font-serif font-bold text-ink leading-tight italic">{selectedMemory.title}</h4>
            <div className="h-px bg-ink/10 w-12" />
            <p className="text-sm font-serif text-ink/80 leading-relaxed first-letter:text-3xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-1">
              {selectedMemory.summary}
            </p>
            <div className="pt-4 border-t border-ink/5">
              <p className="text-[10px] font-mono text-ink/40 uppercase italic">
                Causal correlation confirmed by MacroMind v2.4
              </p>
            </div>
          </motion.div>
        ) : memories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <Clock className="w-8 h-8 mb-2 text-ink" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink">No Historical Matches</span>
          </div>
        ) : (
          memories.map(memory => (
            <div 
              key={memory.id} 
              onClick={() => setSelectedMemory(memory)}
              className="p-4 rounded-sm bg-black/[0.02] border border-ink/5 hover:border-ink/20 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-editor-red/50 uppercase font-bold">{memory.date}</span>
                <ExternalLink className="w-3 h-3 text-ink/20 group-hover:text-ink/60 transition-colors" />
              </div>
              <h4 className="text-[13px] font-serif font-bold mb-2 group-hover:text-editor-red transition-colors text-ink leading-tight">{memory.title}</h4>
              <p className="text-[11px] font-serif text-ink/60 leading-relaxed italic line-clamp-2">
                "{memory.summary}"
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
