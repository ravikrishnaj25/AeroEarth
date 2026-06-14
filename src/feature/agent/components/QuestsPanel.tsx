import { TreePine, Droplets, Sun, Search } from 'lucide-react';
import React from 'react';
import type { Quest } from '../engine/types';

interface QuestsPanelProps { quests: Quest[]; }

export const QuestsPanel: React.FC<QuestsPanelProps> = ({ quests }) => {
  const statusBadge = (s: string) => {
    if (s === 'COMPLETED') return 'pill-success';
    if (s === 'EXPIRED')   return 'pill-error';
    return 'pill-success animate-pulse';
  };

  const actionIcon = (t: string) => {
    if (t === 'PLANT_TREES')       return <TreePine size={15} />;
    if (t === 'WATER_CONSERVATION')return <Droplets size={15} />;
    if (t === 'SOLAR_ADOPTION')    return <Sun size={15} />;
    return <Search size={15} />;
  };

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const pastQuests   = quests.filter(q => q.status !== 'ACTIVE');

  return (
    <div className="w-full glass-panel p-5 flex flex-col h-[480px] shadow-lg">
      <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(180,145,60,0.1)' }}>
        <h3 className="text-amber-200/80 font-semibold text-sm tracking-wider uppercase">
          Active Citizen Quests ({activeQuests.length})
        </h3>
        <span
          className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          Rewards Enabled
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {quests.length === 0 ? (
          <div className="text-amber-900/60 text-center py-24 italic text-xs">
            No active climate quests. Run a cycle to generate missions.
          </div>
        ) : (
          <div className="space-y-4">
            {activeQuests.map(q => (
              <div
                key={q.id}
                className="rounded-xl p-4 transition-colors hover:border-amber-700/30"
                style={{ background: 'rgba(255,235,180,0.03)', border: '1px solid rgba(180,145,60,0.12)' }}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="p-1.5 rounded-lg shrink-0 text-emerald-400"
                      style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)' }}
                    >
                      {actionIcon(q.actionType)}
                    </span>
                    <div>
                      <h4 className="text-amber-100 text-xs font-bold leading-normal">{q.title}</h4>
                      <span className="block text-[10px] text-amber-200/40 font-bold uppercase tracking-wider mt-0.5">{q.zoneName}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0 ${statusBadge(q.status)}`}>
                    {q.status}
                  </span>
                </div>

                <p className="text-xs text-amber-200/50 leading-normal mb-3 font-medium">{q.description}</p>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-amber-200/45 font-semibold">
                    <span>{q.targetMetric}</span>
                    <span className="text-amber-200/60">{q.progress}% Joined</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(180,145,60,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${q.progress}%`, background: 'linear-gradient(90deg, #34d399, #10b981)' }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center text-[10px] pt-2.5 text-amber-200/40 font-semibold" style={{ borderTop: '1px solid rgba(180,145,60,0.08)' }}>
                  <span>Reward: <strong className="text-amber-100/80">+{q.rewardPoints} XP</strong></span>
                  <span>Expires: <strong className="text-amber-100/80">{q.durationHours}h</strong></span>
                </div>
              </div>
            ))}

            {pastQuests.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-[10px] uppercase font-bold tracking-widest text-amber-900/70 pb-1.5" style={{ borderBottom: '1px solid rgba(180,145,60,0.08)' }}>
                  Quest Archive
                </div>
                {pastQuests.slice(0, 5).map(q => (
                  <div
                    key={q.id}
                    className="rounded-xl p-3 flex justify-between items-center opacity-55 text-xs font-semibold"
                    style={{ background: 'rgba(255,235,180,0.02)', border: '1px solid rgba(180,145,60,0.08)' }}
                  >
                    <div>
                      <span className="text-amber-100/70 font-bold block">{q.title}</span>
                      <span className="text-[10px] text-amber-200/35 uppercase tracking-wider">{q.zoneName}</span>
                    </div>
                    <span
                      className="text-amber-200/40 px-2 py-0.5 rounded-lg uppercase text-[9px] font-bold"
                      style={{ background: 'rgba(180,145,60,0.07)', border: '1px solid rgba(180,145,60,0.12)' }}
                    >
                      {q.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
