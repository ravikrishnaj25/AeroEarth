import { Inbox, TrendingUp, AlertTriangle, Brain, BarChart2, Map, Link, CheckCircle, Check } from 'lucide-react';
import React from 'react';
import type { AgentNodeId } from '../engine/types';

interface AgentPipelineProps {
  currentNodeId: AgentNodeId | null;
  status: 'idle' | 'running' | 'completed' | 'error';
}

interface PipelineStep {
  id: AgentNodeId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const STEPS: PipelineStep[] = [
  { id: 'ingest',     label: 'Data Ingestion', icon: <Inbox size={15} />,       description: 'Fetch env sensors' },
  { id: 'forecast',   label: 'ML Forecasting', icon: <TrendingUp size={15} />,  description: 'Run multi-var models' },
  { id: 'threshold',  label: 'Policy Checks',  icon: <AlertTriangle size={15} />,description: 'Detect violations' },
  { id: 'reasoning',  label: 'LLM Agent',      icon: <Brain size={15} />,        description: 'Claude reasoning' },
  { id: 'impact',     label: 'Impact Sim',     icon: <BarChart2 size={15} />,    description: 'Predict delta & ROI' },
  { id: 'quest',      label: 'Quest Engine',   icon: <Map size={15} />,          description: 'Mobilize citizens' },
  { id: 'blockchain', label: 'On-Chain NFT',   icon: <Link size={15} />,         description: 'Notarize commitments' },
  { id: 'verify',     label: 'Verification',   icon: <CheckCircle size={15} />,  description: 'Compare & calculate' },
];

export const AgentPipeline: React.FC<AgentPipelineProps> = ({ currentNodeId, status }) => {
  const currentIndex = STEPS.findIndex(s => s.id === currentNodeId);

  return (
    <div className="w-full glass-panel p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-3" style={{ borderBottom: '1px solid rgba(180,145,60,0.1)' }}>
        <h3 className="text-amber-200/80 font-semibold text-sm tracking-wider uppercase">
          Agent Execution Pipeline
        </h3>
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/45">
            Status:&nbsp;
            <span className={status === 'running' ? 'text-emerald-400 font-bold' : 'text-amber-100/70'}>
              {status}
            </span>
          </span>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {STEPS.map((step, index) => {
          let stepStatus: 'pending' | 'running' | 'completed' | 'error' = 'pending';

          if (status === 'running') {
            if (index < currentIndex)      stepStatus = 'completed';
            else if (index === currentIndex) stepStatus = 'running';
          } else if (status === 'completed') {
            stepStatus = 'completed';
          } else if (status === 'error') {
            if (index < currentIndex)      stepStatus = 'completed';
            else if (index === currentIndex) stepStatus = 'error';
          }

          const cardClass =
            stepStatus === 'running'   ? 'step-running' :
            stepStatus === 'completed' ? 'step-completed' :
            stepStatus === 'error'     ? 'step-error' : 'step-pending';

          const iconBg =
            stepStatus === 'running'   ? 'bg-emerald-400 text-slate-900' :
            stepStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            stepStatus === 'error'     ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                                         'bg-amber-900/20 text-amber-700/60 border border-amber-900/20';

          const barColor =
            stepStatus === 'completed' ? 'bg-emerald-500' :
            stepStatus === 'running'   ? 'bg-emerald-400 animate-pulse' :
            stepStatus === 'error'     ? 'bg-rose-500' : 'bg-transparent';

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center border rounded-xl p-3 text-center transition-all duration-300 ${cardClass}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm mb-2.5 ${iconBg}`}>
                {stepStatus === 'completed' ? <Check size={14} /> : step.icon}
              </div>
              <div className="text-[11px] font-semibold tracking-wide truncate w-full leading-tight">
                {step.label}
              </div>
              <div className="text-[9px] mt-1 opacity-60 line-clamp-1 font-medium">
                {step.description}
              </div>
              <div className="w-full mt-3 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,235,180,0.06)' }}>
                <div className={`h-full rounded-full transition-all duration-500 ${barColor} ${stepStatus !== 'running' ? 'w-full' : 'w-1/2'} ${stepStatus === 'pending' ? 'w-0' : ''}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
