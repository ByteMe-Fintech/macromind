import React from 'react';
import { NewsItem } from '../data/demoData';
import { AlertCircle, Flame, BrainCircuit, RefreshCw, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InfoIcon } from './InfoIcon';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CognitiveLoad {
  load: number;
  status: string;
  recommendation: string;
}

export function CommandCenter({ news, cognitiveLoad, onSync }: { news: NewsItem[], cognitiveLoad: CognitiveLoad | null, onSync: () => Promise<void> }) {
  const [syncing, setSyncing] = React.useState(false);
  const [hoveredAlarm, setHoveredAlarm] = React.useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  const topThemes = [...news]
    .filter(item => item.scores && typeof item.scores.heat === 'number')
    .sort((a, b) => (b.scores?.heat || 0) - (a.scores?.heat || 0))
    .slice(0, 3);

  const criticalAlarms = news
    .filter(item => (item.scores?.disruption || 0) > 8)
    .slice(0, 2);

  return (
    <div className="bg-white/40 border border-ink/10 rounded-sm p-5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/40">Command Center</h3>
          <InfoIcon text="The central hub for monitoring system health, cognitive load, and high-impact macro themes." />
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-2 py-1 rounded-sm bg-editor-red/10 border border-editor-red/30 text-[9px] font-mono uppercase text-editor-red hover:bg-editor-red/20 transition-all disabled:opacity-50 font-bold"
        >
          {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {syncing ? 'Syncing...' : 'Sync Live Signals'}
        </button>
      </div>

      {/* Cognitive Budget Meter */}
      <div className="p-4 rounded-sm bg-black/[0.02] border border-ink/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className={cn(
              "w-4 h-4",
              cognitiveLoad?.load && cognitiveLoad.load > 80 ? "text-editor-red" : "text-ink-blue"
            )} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink/60">Cognitive Budget</span>
            <InfoIcon text="Measures decision fatigue based on the volume and intensity of high-disruption signals in the last 4 hours." />
          </div>
          <span className={cn(
            "text-[10px] font-mono font-bold",
            cognitiveLoad?.load && cognitiveLoad.load > 80 ? "text-editor-red" : "text-ink-blue"
          )}>
            {cognitiveLoad?.status || 'OPTIMAL'}
          </span>
        </div>
        <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              cognitiveLoad?.load && cognitiveLoad.load > 80 ? "bg-editor-red" : "bg-ink-blue"
            )}
            style={{ width: `${cognitiveLoad?.load || 20}%` }} 
          />
        </div>
        <div className="text-[9px] font-mono text-ink/30 uppercase tracking-tight">
          {cognitiveLoad?.recommendation || 'Full Stream Active'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {topThemes.map((item, idx) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-ink/30">0{idx + 1}</span>
              <Flame className={cn(
                "w-3 h-3",
                item.scores.heat > 7 ? "text-editor-red" : "text-ink-blue"
              )} />
            </div>
            <div className="text-[11px] font-serif font-bold leading-tight line-clamp-2 italic">{item.theme}</div>
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-ink-blue transition-all duration-1000" 
                style={{ width: `${item.scores.heat * 10}%` }} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-ink/5 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
          <div className="flex items-center">
            <span className="text-ink/40">Active Alarms</span>
            <InfoIcon text="Critical signals that require immediate attention. Hover over an alarm to see the specific headline." />
          </div>
          <span className="text-editor-red font-bold">{criticalAlarms.length} Critical</span>
        </div>
        
        <div className="space-y-2">
          {criticalAlarms.length > 0 ? (
            criticalAlarms.map(alarm => (
              <div 
                key={alarm.id} 
                onMouseEnter={() => setHoveredAlarm(alarm.id)}
                onMouseLeave={() => setHoveredAlarm(null)}
                className="relative flex items-center gap-3 p-2 rounded-sm bg-editor-red/10 border border-editor-red/20 cursor-help group transition-all"
              >
                <AlertCircle className="w-4 h-4 text-editor-red" />
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-editor-red uppercase tracking-tight">Priority Alarm</div>
                  <div className="text-[11px] font-serif font-bold text-ink/70 truncate w-48">
                    {hoveredAlarm === alarm.id ? alarm.headline : alarm.theme}
                  </div>
                </div>
                
                {hoveredAlarm === alarm.id && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-64 p-3 bg-newsprint border border-editor-red/30 rounded-sm shadow-2xl text-[11px] text-ink leading-snug font-serif italic">
                    {alarm.headline}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-[10px] font-mono text-ink/20 uppercase text-center py-2">
              No Critical Alarms Detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
