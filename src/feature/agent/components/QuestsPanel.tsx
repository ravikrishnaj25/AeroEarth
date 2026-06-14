import { TreePine, Droplets, Sun, Search } from 'lucide-react';
import React from 'react';
import type { Quest } from '../engine/types';

interface QuestsPanelProps {
  quests: Quest[];
}

export const QuestsPanel: React.FC<QuestsPanelProps> = ({ quests }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20';
      case 'EXPIRED':
        return 'bg-red-950/40 text-red-400 border border-red-500/20';
      default:
        return 'bg-[#002b0f]/30 text-[#00ff55] border border-[#00ff55]/20 animate-pulse';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'PLANT_TREES':
        return <TreePine size={18} />;
      case 'WATER_CONSERVATION':
        return <Droplets size={18} />;
      case 'SOLAR_ADOPTION':
        return <Sun size={18} />;
      default:
        return <Search size={18} />;
    }
  };

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const pastQuests = quests.filter(q => q.status !== 'ACTIVE');

  return (
    <div className="w-full bg-[#0a0f0d] border border-[rgba(0,255,85,0.15)] rounded-2xl p-5 shadow-[0_0_20px_rgba(0,255,85,0.02)] flex flex-col h-[480px]">
      <div className="flex justify-between items-center mb-4 border-b border-[rgba(0,255,85,0.1)] pb-3">
        <h3 className="text-[#00ff55] font-mono text-sm tracking-wider uppercase font-semibold">
          Active Citizen Quests ({activeQuests.length})
        </h3>
        <span className="text-xs font-mono text-[#00ff55] bg-[#00ff55]/10 px-2 py-0.5 rounded-full border border-[#00ff55]/20">
          Rewards Enabled
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {quests.length === 0 ? (
          <div className="text-slate-600 text-center py-20 italic font-mono text-xs">
            No active climate quests found. Run a cycle to generate missions.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Quests */}
            {activeQuests.map((quest) => (
              <div
                key={quest.id}
                className="bg-slate-950 border border-slate-900 rounded-xl p-4 hover:border-[#00ff55]/40 transition-colors"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="space-y-0.5">
                    <span className="text-lg mr-1">{getActionIcon(quest.actionType)}</span>
                    <h4 className="text-white text-xs font-semibold inline font-mono">{quest.title}</h4>
                    <span className="block text-xs text-slate-500 font-mono">{quest.zoneName}</span>
                  </div>
                  <span className={`text-xs px-2 py-[2px] rounded-full uppercase tracking-wider font-bold shrink-0 font-mono ${getStatusStyle(quest.status)}`}>
                    {quest.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-normal mb-3 font-mono">
                  {quest.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-500">
                    <span>Task: {quest.targetMetric}</span>
                    <span>{quest.progress}% Joined</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00ff55] rounded-full transition-all duration-700"
                      style={{ width: `${quest.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center text-xs font-mono border-t border-slate-900 pt-2 text-slate-500">
                  <span>Reward: <strong className="text-slate-200">+{quest.rewardPoints} XP</strong></span>
                  <span>Expires: <strong className="text-slate-200">{quest.durationHours}h</strong></span>
                </div>
              </div>
            ))}

            {/* Past Quests Title */}
            {pastQuests.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-xs uppercase font-mono tracking-wider text-slate-500 border-b border-slate-900 pb-1">
                  Quest Archive
                </div>
                {pastQuests.slice(0, 5).map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 flex justify-between items-center opacity-60 font-mono text-xs"
                  >
                    <div>
                      <span className="text-slate-300 font-bold block">{quest.title}</span>
                      <span className="text-slate-500 text-xs">{quest.zoneName}</span>
                    </div>
                    <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 uppercase text-xs font-bold">
                      {quest.status}
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
