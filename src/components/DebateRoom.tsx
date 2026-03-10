import React, { useState } from 'react';
import { DebateResponse } from '../services/aiProvider';
import Markdown from 'react-markdown';
import { MessageSquare, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function DebateRoom({ debate }: { debate?: DebateResponse }) {
  const [activeTab, setActiveTab] = useState<'bull' | 'bear' | 'risk'>('bull');

  if (!debate) return null;

  const tabs = [
    { id: 'bull', label: 'Bullish View', icon: TrendingUp, color: 'text-ink-blue' },
    { id: 'bear', label: 'Bearish View', icon: TrendingDown, color: 'text-editor-red' },
    { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert, color: 'text-ink' },
  ] as const;

  return (
    <div className="bg-white/40 border border-ink/10 rounded-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-ink/10 flex items-center justify-between bg-black/[0.02]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-editor-red" />
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/60">Editorial Debate</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-ink/30 uppercase">Tension Index</span>
          <div className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-editor-red" 
              style={{ width: `${debate.tensionScore}%` }} 
            />
          </div>
          <span className="text-[10px] font-mono text-editor-red font-bold">{debate.tensionScore}%</span>
        </div>
      </div>

      <div className="flex border-b border-ink/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-3 px-4 text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
              activeTab === tab.id 
                ? "bg-black/[0.05] text-ink border-b-2 border-editor-red font-bold" 
                : "text-ink/30 hover:text-ink/60"
            )}
          >
            <tab.icon className={cn("w-3 h-3", activeTab === tab.id ? tab.color : "opacity-30")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white/20">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-3 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest",
              activeTab === 'bull' ? "bg-ink-blue/10 text-ink-blue border border-ink-blue/30" :
              activeTab === 'bear' ? "bg-editor-red/10 text-editor-red border border-editor-red/30" :
              "bg-ink/10 text-ink border border-ink/30"
            )}>
              Verdict: {
                activeTab === 'bull' ? debate.bullVerdict :
                activeTab === 'bear' ? debate.bearVerdict :
                debate.riskVerdict
              }
            </div>
          </div>
          <div className="text-[9px] font-mono text-ink/40 uppercase tracking-widest italic">
            Agent Confidence: {activeTab === 'bull' ? 'High' : activeTab === 'bear' ? 'Elevated' : 'Pragmatic'}
          </div>
        </div>

        <div className="prose prose-sm max-w-none font-serif italic text-ink/80 leading-relaxed">
          {activeTab === 'bull' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Markdown>{debate.bull || "_No bullish analysis available for this signal._"}</Markdown>
            </div>
          )}
          {activeTab === 'bear' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Markdown>{debate.bear || "_No bearish analysis available for this signal._"}</Markdown>
            </div>
          )}
          {activeTab === 'risk' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Markdown>{debate.riskManager || "_No risk management strategy available for this signal._"}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
