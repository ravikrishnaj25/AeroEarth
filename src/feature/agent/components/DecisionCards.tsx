import { TreePine, Droplets, Sun, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import type { AgentDecision } from '../engine/types';

interface DecisionCardsProps { decisions: AgentDecision[]; }

export const DecisionCards: React.FC<DecisionCardsProps> = ({ decisions }) => {
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);

  const priorityBadge = (p: string) => {
    if (p === 'critical') return 'badge-critical';
    if (p === 'high')     return 'badge-high';
    if (p === 'medium')   return 'badge-medium';
    return 'badge-low';
  };

  const actionIcon = (a: string) => {
    if (a === 'PLANT_TREES')       return <TreePine size={13} className="text-emerald-400" />;
    if (a === 'WATER_CONSERVATION')return <Droplets size={13} className="text-sky-400" />;
    if (a === 'SOLAR_ADOPTION')    return <Sun size={13} className="text-amber-400" />;
    return <Activity size={13} className="text-amber-200/50" />;
  };

  const actionLabel = (a: string) => {
    if (a === 'PLANT_TREES')       return { label: 'Afforestation',     color: 'text-emerald-400' };
    if (a === 'WATER_CONSERVATION')return { label: 'Water Conservation',color: 'text-sky-400' };
    if (a === 'SOLAR_ADOPTION')    return { label: 'Solar Adoption',    color: 'text-amber-400' };
    return { label: 'Monitoring', color: 'text-amber-200/50' };
  };

  return (
    <div className="w-full glass-panel p-5 flex flex-col h-[480px] shadow-lg">
      <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(180,145,60,0.1)' }}>
        <h3 className="text-amber-200/80 font-semibold text-sm tracking-wider uppercase">
          Autonomous Interventions ({decisions.filter(d => d.action !== 'MONITOR').length})
        </h3>
        <span
          className="text-[9px] text-amber-400/60 px-2 py-0.5 rounded-md font-bold tracking-widest uppercase"
          style={{ background: 'rgba(180,145,60,0.08)', border: '1px solid rgba(180,145,60,0.15)' }}
        >
          LLM Planner
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {decisions.length === 0 ? (
          <div className="text-amber-900/60 text-center py-24 italic text-xs">
            No active interventions computed for this cycle yet.
          </div>
        ) : decisions.map((dec) => {
          const { label, color } = actionLabel(dec.action);
          const isOpen = expandedZoneId === dec.zoneId;

          return (
            <div
              key={dec.zoneId}
              className="rounded-xl overflow-hidden transition-all duration-300 hover:border-amber-700/30"
              style={{ background: 'rgba(255,235,180,0.03)', border: '1px solid rgba(180,145,60,0.12)' }}
            >
              {/* Card head */}
              <div className="p-4 flex justify-between items-start gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-amber-100 text-xs font-bold">{dec.zoneName}</h4>
                    <span className={`text-[9px] px-2 py-[1px] rounded-full uppercase tracking-wider font-bold ${priorityBadge(dec.priority)}`}>
                      {dec.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/50 leading-relaxed font-medium">{dec.details}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold flex items-center gap-1 ${color}`}>
                    {actionIcon(dec.action)} {label}
                  </span>
                  <span className="text-[10px] text-amber-200/35 font-medium">
                    Est. ₹{dec.metrics.estimatedCost?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* Metrics row */}
              <div
                className="px-4 pb-3 flex gap-4 flex-wrap text-[11px] text-amber-200/40 font-medium"
                style={{ borderBottom: '1px solid rgba(180,145,60,0.08)' }}
              >
                {dec.metrics.treeCount      && <span>Trees: <strong className="text-amber-100/80">{dec.metrics.treeCount}</strong></span>}
                {dec.metrics.waterGallons   && <span>Gallons: <strong className="text-amber-100/80">{dec.metrics.waterGallons.toLocaleString()}</strong></span>}
                {dec.metrics.solarPanelsCount && <span>Panels: <strong className="text-amber-100/80">{dec.metrics.solarPanelsCount}</strong></span>}
              </div>

              {/* LLM reasoning toggle */}
              {dec.llmReasoning && (
                <div>
                  <button
                    onClick={() => setExpandedZoneId(isOpen ? null : dec.zoneId)}
                    className="w-full text-left px-4 py-2.5 text-xs text-amber-200/45 hover:text-amber-200/80 flex justify-between items-center transition-colors font-medium cursor-pointer"
                    style={{ background: 'rgba(255,235,180,0.02)' }}
                  >
                    <span className="flex items-center gap-1.5">
                      {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {isOpen ? 'Hide Reasoning Trace' : 'Show Reasoning Trace'}
                    </span>
                    <span
                      className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{ border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.06)' }}
                    >
                      Claude 3.5
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="p-4 font-mono text-[11px] leading-relaxed text-amber-100/60 whitespace-pre-line border-l-2 border-emerald-500/40"
                      style={{ background: 'rgba(5,4,2,0.5)', borderTop: '1px solid rgba(180,145,60,0.08)' }}
                    >
                      {dec.llmReasoning}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
