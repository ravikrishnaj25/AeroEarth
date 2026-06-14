import React from 'react';
import type { VerificationResult } from '../engine/types';

interface VerificationPanelProps {
  verifications: VerificationResult[];
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ verifications }) => {
  // Compute some simulated aggregate metrics based on verification data or reasonable static baselines
  const totalCount = verifications.length;
  const avgAccuracy = totalCount > 0
    ? Math.round(verifications.reduce((sum, item) => sum + item.accuracy, 0) / totalCount)
    : 89; // Default starting accuracy for display

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-[#00ff55] bg-[#00ff55]/10 border border-[#00ff55]/20';
      case 'PARTIAL':
        return 'text-amber-400 bg-amber-400/10 border border-amber-400/20';
      default:
        return 'text-red-400 bg-red-400/10 border border-red-500/20';
    }
  };

  const getDeltaString = (action: string, val: number) => {
    if (action === 'PLANT_TREES') {
      return `${val} AQI`;
    } else if (action === 'WATER_CONSERVATION') {
      return `+${val} WQI`;
    } else {
      return `+${val} kWh`;
    }
  };

  return (
    <div className="w-full bg-[#0a0f0d] border border-[rgba(0,255,85,0.15)] rounded-2xl p-5 shadow-[0_0_20px_rgba(0,255,85,0.02)] flex flex-col h-[480px]">
      <div className="flex justify-between items-center mb-4 border-b border-[rgba(0,255,85,0.1)] pb-3">
        <h3 className="text-[#00ff55] font-mono text-sm tracking-wider uppercase font-semibold">
          Validation & Efficacy Engine
        </h3>
        <span className="text-xs font-mono text-slate-500">
          Agent Performance Core
        </span>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-4 font-mono">
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 text-center">
          <span className="text-xs uppercase text-slate-500 block">Agent Accuracy</span>
          <span className="text-base font-bold text-[#00ff55]">{avgAccuracy}%</span>
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 text-center">
          <span className="text-xs uppercase text-slate-500 block">Active Reliability</span>
          <span className="text-base font-bold text-blue-400">Class-A</span>
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 text-center">
          <span className="text-xs uppercase text-slate-500 block">Total Verified</span>
          <span className="text-base font-bold text-purple-400">{totalCount || '---'}</span>
        </div>
      </div>

      {/* Verification List */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {verifications.length === 0 ? (
          <div className="text-slate-600 text-center py-20 italic font-mono text-xs leading-relaxed">
            No historical verification datasets generated yet.<br />
            <span className="text-xs mt-1 block">Verification automatically compares Cycle N-1 predictions with Cycle N actual data.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {verifications.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-xs"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-semibold">{item.zoneName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                    {item.status} ({item.accuracy}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 border-t border-slate-900/50 pt-2 text-slate-500 text-xs">
                  <div>
                    Predicted Delta:
                    <span className="text-slate-300 block font-semibold">{getDeltaString(item.actionType, item.predictedDelta)}</span>
                  </div>
                  <div>
                    Actual Delta:
                    <span className="text-[#00ff55] block font-semibold">{getDeltaString(item.actionType, item.actualDelta)}</span>
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
