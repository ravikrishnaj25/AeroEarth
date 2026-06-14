import { Check, AlertTriangle, Skull, Info, Zap } from 'lucide-react';
import React from 'react';
import type { AgentNodeId } from '../engine/types';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  node?: AgentNodeId;
}

interface ActivityFeedProps {
  logs: LogEntry[];
  currentNodeId: AgentNodeId | null;
  onClear: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, currentNodeId, onClear }) => {
  const getLogStyle = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-[#00ff55] border-l-2 border-[#00ff55] pl-2';
      case 'warning':
        return 'text-amber-400 border-l-2 border-amber-400 pl-2';
      case 'error':
        return 'text-red-400 border-l-2 border-red-500 pl-2';
      default:
        return 'text-slate-300 border-l-2 border-slate-700 pl-2';
    }
  };

  const getLogPrefix = (level: string) => {
    switch (level) {
      case 'success':
        return <><Check size={12} className="inline mr-1" />[SUCCESS]</>;
      case 'warning':
        return <><AlertTriangle size={12} className="inline mr-1" />[WARNING]</>;
      case 'error':
        return <><Skull size={12} className="inline mr-1" />[CRITICAL]</>;
      default:
        return <><Info size={12} className="inline mr-1" />[INFO]</>;
    }
  };

  return (
    <div className="w-full bg-[#050806] border border-[rgba(0,255,85,0.15)] rounded-2xl p-5 flex flex-col h-[480px] shadow-[0_0_20px_rgba(0,255,85,0.02)]">
      <div className="flex justify-between items-center mb-4 border-b border-[rgba(0,255,85,0.1)] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#00ff55] rounded-full animate-pulse"></span>
          <h3 className="text-[#00ff55] font-mono text-sm tracking-wider uppercase font-semibold">
            Telemetry & Decision Logs
          </h3>
        </div>
        <button 
          onClick={onClear}
          className="text-xs font-mono text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 px-2.5 py-1 rounded transition-colors"
        >
          Clear CLI
        </button>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2.5 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {currentNodeId && (
          <div className="bg-[#002b0f]/20 border border-[#00ff55]/20 p-2.5 rounded-lg mb-3 animate-pulse">
            <span className="text-[#00ff55] font-semibold"><Zap size={12} /> [EXECUTING] Node: {currentNodeId.toUpperCase()}</span>
            <div className="text-xs text-slate-400 mt-1">
              Analyzing telemetry grid... Connecting neural weights...
            </div>
          </div>
        )}

        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-20 italic">
            Waiting for Agent telemetry sequence...
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index} 
              className={`py-1 rounded-sm hover:bg-slate-900/40 transition-colors flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 ${getLogStyle(log.level)}`}
            >
              <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
              <div className="flex-1">
                <span className="font-semibold mr-1.5 select-none">{getLogPrefix(log.level)}</span>
                <span>{log.message}</span>
                {log.node && (
                  <span className="ml-2 bg-slate-900 border border-slate-800 text-slate-400 px-1 py-[1px] rounded text-xs uppercase font-semibold">
                    {log.node}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CLI Simulated Footer */}
      <div className="border-t border-[rgba(0,255,85,0.1)] pt-3 mt-3 flex items-center font-mono text-xs text-slate-500">
        <span className="text-[#00ff55] mr-2">ecoguardian-agent-cli&gt;</span>
        <span className="animate-pulse font-bold text-white">|</span>
        <span className="ml-auto text-xs uppercase tracking-wider text-slate-500">
          Agent System Connected (LLM: Claude-3.5)
        </span>
      </div>
    </div>
  );
};
