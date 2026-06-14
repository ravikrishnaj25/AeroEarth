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
  { id: 'ingest', label: 'Data Ingestion', icon: <Inbox size={18} />, description: 'Fetch env sensors' },
  { id: 'forecast', label: 'ML Forecasting', icon: <TrendingUp size={18} />, description: 'Run multi-var models' },
  { id: 'threshold', label: 'Policy Checks', icon: <AlertTriangle size={18} />, description: 'Detect violations' },
  { id: 'reasoning', label: 'LLM Agent', icon: <Brain size={18} />, description: 'Claude reasoning' },
  { id: 'impact', label: 'Impact Sim', icon: <BarChart2 size={18} />, description: 'Predict delta & ROI' },
  { id: 'quest', label: 'Quest Engine', icon: <Map size={18} />, description: 'Mobilize citizens' },
  { id: 'blockchain', label: 'On-Chain NFT', icon: <Link size={18} />, description: 'Notarize commitments' },
  { id: 'verify', label: 'Verification', icon: <CheckCircle size={18} />, description: 'Compare & calculate' }
];

export const AgentPipeline: React.FC<AgentPipelineProps> = ({ currentNodeId, status }) => {
  const getStepIndex = (nodeId: AgentNodeId | null) => {
    if (!nodeId) return -1;
    return STEPS.findIndex(s => s.id === nodeId);
  };

  const currentIndex = getStepIndex(currentNodeId);

  return (
    <div className="w-full bg-[#0a0f0d] border border-[rgba(0,255,85,0.15)] rounded-2xl p-6 shadow-[0_0_20px_rgba(0,255,85,0.05)] backdrop-blur-md">
      <div className="flex justify-between items-center mb-4 border-b border-[rgba(0,255,85,0.1)] pb-3">
        <h3 className="text-[#00ff55] font-mono text-sm tracking-widest uppercase">
          Agent Execution Pipeline
        </h3>
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff55] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00ff55]"></span>
            </span>
          )}
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Status: <span className={status === 'running' ? 'text-[#00ff55] font-bold' : 'text-slate-300'}>{status}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 relative">
        {STEPS.map((step, index) => {
          let stepStatus: 'pending' | 'running' | 'completed' | 'error' = 'pending';

          if (status === 'running') {
            if (index < currentIndex) stepStatus = 'completed';
            else if (index === currentIndex) stepStatus = 'running';
          } else if (status === 'completed') {
            stepStatus = 'completed';
          } else if (status === 'error') {
            if (index < currentIndex) stepStatus = 'completed';
            else if (index === currentIndex) stepStatus = 'error';
          }

          let cardStyle = "border-slate-800 bg-slate-950/40 text-slate-500";
          let iconStyle = "bg-slate-900 border-slate-800 text-slate-600";
          let glowStyle = "";

          if (stepStatus === 'completed') {
            cardStyle = "border-[rgba(0,255,85,0.3)] bg-gradient-to-b from-[#00ff55]/5 to-transparent text-slate-200";
            iconStyle = "bg-[#002b0f] border-[#00ff55]/40 text-[#00ff55]";
          } else if (stepStatus === 'running') {
            cardStyle = "border-[#00ff55] bg-gradient-to-b from-[#00ff55]/15 to-transparent text-white ring-1 ring-[#00ff55]/30";
            iconStyle = "bg-[#004d1a] border-[#00ff55] text-[#00ff55] animate-pulse";
            glowStyle = "shadow-[0_0_15px_rgba(0,255,85,0.25)]";
          } else if (stepStatus === 'error') {
            cardStyle = "border-red-500 bg-gradient-to-b from-red-500/10 to-transparent text-white";
            iconStyle = "bg-red-950 border-red-500 text-red-500";
          }

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center justify-between border rounded-xl p-3 text-center transition-all duration-300 ${cardStyle} ${glowStyle}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-mono text-lg mb-2 ${iconStyle}`}>
                {stepStatus === 'completed' ? <Check size={18} /> : step.icon}
              </div>
              <div className="font-mono text-xs font-semibold tracking-wide truncate w-full">
                {step.label}
              </div>
              <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                {step.description}
              </div>

              {/* Step indicator bar on the bottom */}
              <div className="w-full mt-3 h-1 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${stepStatus === 'completed' ? 'w-full bg-[#00ff55]' :
                      stepStatus === 'running' ? 'w-1/2 bg-[#00ff55] animate-pulse' :
                        stepStatus === 'error' ? 'w-full bg-red-500' : 'w-0'
                    }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
