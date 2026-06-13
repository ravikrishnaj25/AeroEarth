import React, { useState } from 'react';
import type { AgentDecision } from '../engine/types';

interface DecisionCardsProps {
  decisions: AgentDecision[];
}

export const DecisionCards: React.FC<DecisionCardsProps> = ({ decisions }) => {
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);

  const toggleExpand = (zoneId: string) => {
    setExpandedZoneId(expandedZoneId === zoneId ? null : zoneId);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-950/50 text-red-400 border border-red-500/30';
      case 'high':
        return 'bg-amber-950/50 text-amber-400 border border-amber-500/30';
      case 'medium':
        return 'bg-blue-950/50 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-slate-900 text-slate-400 border border-slate-700';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'PLANT_TREES':
        return 'text-[#00ff55]';
      case 'WATER_CONSERVATION':
        return 'text-[#6496ff]';
      case 'SOLAR_ADOPTION':
        return 'text-[#ff9632]';
      default:
        return 'text-slate-400';
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'PLANT_TREES':
        return '🌲 Afforestation';
      case 'WATER_CONSERVATION':
        return '💧 Water Conservation';
      case 'SOLAR_ADOPTION':
        return '☀️ Solar Adoption';
      default:
        return '🔍 Monitor';
    }
  };

  return (
    <div className="w-full bg-[#0a0f0d] border border-[rgba(0,255,85,0.15)] rounded-2xl p-5 shadow-[0_0_20px_rgba(0,255,85,0.02)] flex flex-col h-[480px]">
      <div className="flex justify-between items-center mb-4 border-b border-[rgba(0,255,85,0.1)] pb-3">
        <h3 className="text-[#00ff55] font-mono text-sm tracking-wider uppercase font-semibold">
          Autonomous Interventions ({decisions.filter(d => d.action !== 'MONITOR').length})
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          Source: LLM Planner Agent
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {decisions.length === 0 ? (
          <div className="text-slate-600 text-center py-20 italic font-mono text-xs">
            No active interventions computed for this cycle yet.
          </div>
        ) : (
          decisions.map((decision) => {
            const isExpanded = expandedZoneId === decision.zoneId;
            const hasReasoning = !!decision.llmReasoning;

            return (
              <div 
                key={decision.zoneId}
                className="bg-slate-950/80 border border-slate-900 rounded-xl overflow-hidden hover:border-[#00ff55]/30 transition-all duration-300"
              >
                {/* Header card */}
                <div className="p-4 flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-mono text-xs font-semibold">{decision.zoneName}</h4>
                      <span className={`text-[9px] px-2 py-[2px] rounded-full uppercase tracking-wider font-bold ${getPriorityStyle(decision.priority)}`}>
                        {decision.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      {decision.details}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-mono font-bold block ${getActionColor(decision.action)}`}>
                      {getActionBadge(decision.action)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Cost: ₹{decision.metrics.estimatedCost?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>

                {/* Sub metrics details */}
                <div className="px-4 pb-3 flex gap-3 flex-wrap border-b border-slate-900 text-[10px] text-slate-500 font-mono">
                  {decision.metrics.treeCount && (
                    <span>🌲 Trees: <strong className="text-slate-300">{decision.metrics.treeCount}</strong></span>
                  )}
                  {decision.metrics.waterGallons && (
                    <span>💧 Gallons: <strong className="text-slate-300">{decision.metrics.waterGallons.toLocaleString()}</strong></span>
                  )}
                  {decision.metrics.solarPanelsCount && (
                    <span>☀️ Panels: <strong className="text-slate-300">{decision.metrics.solarPanelsCount}</strong></span>
                  )}
                </div>

                {/* LLM reasoning toggle */}
                {hasReasoning && (
                  <div>
                    <button 
                      onClick={() => toggleExpand(decision.zoneId)}
                      className="w-full text-left px-4 py-2 bg-slate-900/40 text-[10px] text-slate-400 hover:text-white flex justify-between items-center transition-colors font-mono"
                    >
                      <span>{isExpanded ? '▼ Hide LLM Reasoning Trace' : '▶ Show LLM Reasoning Trace'}</span>
                      <span className="text-[#00ff55] text-[9px] border border-[#00ff55]/20 px-1 rounded bg-[#00ff55]/5">
                        Claude-3.5-Sonnet
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="p-4 bg-[#030604] border-t border-slate-900 font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre-line border-l-2 border-l-[#00ff55]">
                        {decision.llmReasoning}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
