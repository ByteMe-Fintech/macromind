import React, { useState, useEffect } from 'react';
import { History, Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { InfoIcon } from './InfoIcon';

export function TimeMachine({ onTimeChange }: { onTimeChange: (start: string, end: string) => void }) {
  const [hoursAgo, setHoursAgo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setHoursAgo(prev => (prev + 1) % 49);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const end = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    const start = new Date(Date.now() - (hoursAgo + 4) * 60 * 60 * 1000).toISOString();
    onTimeChange(start, end);
  }, [hoursAgo]);

  return (
    <div className="bg-white/40 border border-ink/10 rounded-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-editor-red" />
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/40">Chronicle Timeline</h3>
          <InfoIcon text="Rewind the global signal stream to see how the dashboard looked in the past. Useful for backtesting causal theories and tracking the evolution of a shock." />
        </div>
        <div className="text-[11px] font-mono text-editor-red font-bold">
          -{hoursAgo}H <span className="text-ink/20">/ 48H</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-ink/60 hover:text-ink transition-all"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        
        <div className="flex-1 relative h-6 flex items-center">
          <div className="absolute inset-0 h-1 bg-black/5 rounded-full my-auto" />
          <input
            type="range"
            min="0"
            max="48"
            value={hoursAgo}
            onChange={(e) => setHoursAgo(parseInt(e.target.value))}
            className="w-full h-1 bg-transparent appearance-none cursor-pointer relative z-10 accent-editor-red"
          />
        </div>

        <button 
          onClick={() => setHoursAgo(0)}
          className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-ink/60 hover:text-ink transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between text-[9px] font-mono text-ink/40 uppercase tracking-widest font-bold">
        <span>Live Feed</span>
        <span>-24H</span>
        <span>-48H</span>
      </div>
    </div>
  );
}
