import React from 'react';
import type { VerificationResult } from '../engine/types';

interface VerificationPanelProps { verifications: VerificationResult[]; }

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ verifications }) => {
  const totalCount  = verifications.length;
  const avgAccuracy = totalCount > 0
    ? Math.round(verifications.reduce((s, v) => s + v.accuracy, 0) / totalCount)
    : 89;

  const statusPill = (s: string) =>
    s === 'SUCCESS' ? 'pill-success' : s === 'PARTIAL' ? 'pill-partial' : 'pill-error';

  const deltaStr = (action: string, val: number) =>
    action === 'PLANT_TREES' ? `${val} AQI` : action === 'WATER_CONSERVATION' ? `+${val} WQI` : `+${val} kWh`;

  return (
    <div className="w-full glass-panel p-5 flex flex-col h-[480px] shadow-lg">
      <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(180,145,60,0.1)' }}>
        <h3 className="text-amber-200/80 font-semibold text-sm tracking-wider uppercase">
          Validation &amp; Efficacy Engine
        </h3>
        <span
          className="text-[9px] text-amber-400/60 px-2 py-0.5 rounded-md font-bold tracking-widest uppercase"
          style={{ background: 'rgba(180,145,60,0.08)', border: '1px solid rgba(180,145,60,0.15)' }}
        >
          Performance Core
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { label: 'Agent Accuracy',  value: `${avgAccuracy}%`, color: 'text-emerald-400' },
          { label: 'Reliability',     value: 'Class-A',         color: 'text-sky-400' },
          { label: 'Total Verified',  value: totalCount || '---', color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,235,180,0.03)', border: '1px solid rgba(180,145,60,0.1)' }}
          >
            <span className="text-[10px] uppercase font-bold text-amber-200/40 block tracking-wider">{label}</span>
            <span className={`text-base font-bold mt-1 block ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {verifications.length === 0 ? (
          <div className="text-amber-900/60 text-center py-16 italic text-xs leading-relaxed">
            No historical verification datasets generated yet.<br />
            <span className="text-[11px] mt-2 block text-amber-900/50">
              Verification compares Cycle N-1 predictions with Cycle N actual data.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {verifications.map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-3 text-xs"
                style={{ background: 'rgba(255,235,180,0.03)', border: '1px solid rgba(180,145,60,0.1)' }}
              >
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-amber-100/90 font-bold">{item.zoneName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${statusPill(item.status)}`}>
                    {item.status} ({item.accuracy}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: '1px solid rgba(180,145,60,0.08)' }}>
                  <div>
                    <span className="text-[10px] text-amber-900/70 uppercase tracking-wider block font-bold mb-0.5">Predicted Delta:</span>
                    <span className="text-amber-100/70 font-mono text-xs font-semibold">{deltaStr(item.actionType, item.predictedDelta)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-900/70 uppercase tracking-wider block font-bold mb-0.5">Actual Delta:</span>
                    <span className="text-emerald-400 font-mono text-xs font-semibold">{deltaStr(item.actionType, item.actualDelta)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
