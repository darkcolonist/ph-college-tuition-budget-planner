import React from 'react';
import { Terminal, ShieldCheck, CreditCard, Activity } from 'lucide-react';

const DevInspector = ({ metadata }) => {
  if (!metadata) return null;

  const { promptTokenCount, candidatesTokenCount, totalTokenCount, estimatedCostPhp } = metadata;

  return (
    <div className="fixed bottom-6 right-6 z-50 glass rounded-2xl border-cyan-500/30 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-cyan-500/10 group">
      {/* Header */}
      <div className="bg-cyan-500/10 px-4 py-2 border-b border-cyan-500/20 flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Dev Inspector</span>
        <div className="ml-auto flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[9px] text-green-500 font-bold uppercase">Online</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center gap-8">
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
               <span className="text-xs text-slate-400 font-medium tracking-tight">Prompt Tokens</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-200">{promptTokenCount}</span>
          </div>
          <div className="flex justify-between items-center gap-8">
            <div className="flex items-center gap-2">
               <Activity className="w-3.5 h-3.5 text-slate-500" />
               <span className="text-xs text-slate-400 font-medium tracking-tight">Candidate Tokens</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-200">{candidatesTokenCount}</span>
          </div>
          <div className="h-0.5 bg-slate-800/50 rounded-full w-full" />
          <div className="flex justify-between items-center gap-8">
            <div className="flex items-center gap-2">
               <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
               <span className="text-xs text-cyan-400/80 font-bold uppercase tracking-tighter">Est. Token Cost</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-cyan-400 font-mono">
                ₱{estimatedCostPhp.toFixed(4)}
              </span>
              <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">
                Based on Flash Rates
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-900/80 border-t border-white/5 flex items-center gap-2">
          <span className="text-[9px] text-slate-500 font-medium italic">
            v1.5 Flash Grounding Enabled
          </span>
      </div>
    </div>
  );
};

export default DevInspector;
