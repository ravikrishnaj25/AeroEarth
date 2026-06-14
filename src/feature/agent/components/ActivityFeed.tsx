import { Check, AlertTriangle, ShieldAlert, Info, Zap } from 'lucide-react';
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
      case 'success': return 'text-emerald-400 border-l-2 border-emerald-500/70 pl-2.5';
      case 'warning': return 'text-amber-400 border-l-2 border-amber-500/60 pl-2.5';
      case 'error':   return 'text-rose-400 border-l-2 border-rose-500/60 pl-2.5';
      default:        return 'text-amber-200/65 border-l-2 border-amber-900/40 pl-2.5';
    }
  };

  const getLogPrefix = (level: string) => {
    switch (level) {
      case 'success': return <><Check size={11} className="inline mr-1" />[SUCCESS]</>;
      case 'warning': return <><AlertTriangle size={11} className="inline mr-1" />[WARNING]</>;
      case 'error':   return <><ShieldAlert size={11} className="inline mr-1" />[CRITICAL]</>;
      default:        return <><Info size={11} className="inline mr-1" />[INFO]</>;
    }
  };

  return (
    <div className="w-full glass-panel p-5 flex flex-col h-[480px] shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(180,145,60,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <h3 className="text-amber-200/80 font-semibold text-sm tracking-wider uppercase">
            Telemetry &amp; Decision Logs
          </h3>
        </div>
        <button
          onClick={onClear}
          className="text-xs font-semibold text-amber-200/40 hover:text-rose-400 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          style={{ border: '1px solid rgba(180,145,60,0.15)' }}
        >
          Clear Log
        </button>
      </div>

      {/* Terminal body */}
      <div
        className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 pr-1 scrollbar-thin crt-effect rounded-xl p-3"
        style={{ background: 'rgba(5,4,2,0.6)', border: '1px solid rgba(180,145,60,0.08)' }}
      >
        {currentNodeId && (
          <div
            className="p-2.5 rounded-lg mb-3 animate-pulse"
            style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)' }}
          >
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Zap size={11} className="animate-bounce" /> [EXECUTING] Node: {currentNodeId.toUpperCase()}
            </span>
            <div className="text-[10px] text-amber-200/40 mt-1">
              Analyzing telemetry grid... Connecting neural weights...
            </div>
          </div>
        )}

        {logs.length === 0 ? (
          <div className="text-amber-900/60 text-center py-24 italic font-sans text-xs">
            Waiting for Agent telemetry sequence...
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`py-1 rounded-sm hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 ${getLogStyle(log.level)}`}
            >
              <span className="text-amber-900/60 shrink-0 select-none">[{log.timestamp}]</span>
              <div className="flex-1">
                <span className="font-bold mr-1.5 select-none">{getLogPrefix(log.level)}</span>
                <span>{log.message}</span>
                {log.node && (
                  <span
                    className="ml-2 text-amber-200/50 px-1 py-[1px] rounded text-[9px] uppercase font-bold tracking-wide"
                    style={{ background: 'rgba(180,145,60,0.1)', border: '1px solid rgba(180,145,60,0.18)' }}
                  >
                    {log.node}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CLI Footer */}
      <div className="pt-3 mt-3 flex items-center font-mono text-[10px] text-amber-200/30" style={{ borderTop: '1px solid rgba(180,145,60,0.1)' }}>
        <span className="text-emerald-400/80 mr-2">ecoguardian-agent-cli&gt;</span>
        <span className="animate-pulse font-bold text-amber-100/60">|</span>
        <span className="ml-auto uppercase tracking-wider text-[9px] font-sans font-semibold">
          Agent System Connected (LLM: Claude-3.5)
        </span>
      </div>
    </div>
  );
};
