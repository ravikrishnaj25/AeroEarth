import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Play, Pause, Globe, ArrowLeft } from 'lucide-react';
import { useAgentEngine } from './hooks/useAgentEngine';
import { AgentPipeline } from './components/AgentPipeline';
import { ActivityFeed } from './components/ActivityFeed';
import { DecisionCards } from './components/DecisionCards';
import { QuestsPanel } from './components/QuestsPanel';
import { BlockchainLog } from './components/BlockchainLog';
import { VerificationPanel } from './components/VerificationPanel';
import './AgentMonitorPage.css';

const AgentMonitorPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<'claude-3-5' | 'gpt-4o'>('claude-3-5');
  const [runInterval, setRunInterval] = useState<number>(45000);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);

  const { state, runCycle, clearLogs, isAutoRunning, toggleAutoRun } = useAgentEngine(runInterval);

  const handleRunManual = async () => {
    if (state.status !== 'running') await runCycle();
  };

  return (
    <div className="agent-dashboard min-h-screen pb-16">
      {showDisclaimer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div 
            style={{ 
              background: 'rgba(24, 20, 10, 0.95)', 
              borderColor: 'rgba(180, 145, 60, 0.3)',
              boxShadow: '0 0 50px rgba(180, 145, 60, 0.15), 0 20px 50px rgba(0, 0, 0, 0.8)',
              maxWidth: '520px'
            }} 
            className="w-full rounded-2xl border p-6 text-center space-y-4 crt-effect"
          >
            <div className="flex justify-center text-amber-500 mb-2">
              <Shield size={48} className="animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-amber-200 uppercase tracking-wider">
              Simulation Environment Disclaimer
            </h2>
            <p className="text-xs leading-relaxed text-amber-100/75">
              Please note that the AeroEarth Agent Monitor runs on <strong>historical simulation profiles and pre-compiled test results</strong> rather than real-time production telemetry. This interface serves to demonstrate the autonomous agent execution pipeline, policy verification controls, and safety checks in a sandboxed staging environment.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg"
                style={{ boxShadow: '0 4px 15px rgba(52, 211, 153, 0.3)' }}
              >
                Acknowledge & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        style={{
          background: 'rgba(14, 11, 6, 0.92)',
          borderBottom: '1px solid rgba(180, 145, 60, 0.14)',
        }}
        className="sticky top-0 z-50 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,235,180,0.04)', border: '1px solid rgba(180,145,60,0.18)' }}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-200/60 hover:text-amber-300 hover:border-amber-400/40 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={13} /> Home
          </button>
          <div className="h-5 w-px bg-amber-900/30 hidden sm:block" />
          <div>
            <h1 className="text-white text-[15px] font-bold tracking-wide flex items-center gap-2.5">
              <Shield size={17} className="text-emerald-400" />
              <span>AeroEarth <span className="text-emerald-400">Agent</span> Monitor</span>
            </h1>
            <p className="text-[11px] text-amber-200/35 mt-0.5 font-medium tracking-wide">
              Autonomous AI-driven climate protection planner
            </p>
          </div>
        </div>

        {/* Right: Status + Globe */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div
            style={{ background: 'rgba(255,235,180,0.04)', border: '1px solid rgba(180,145,60,0.15)' }}
            className="rounded-xl px-4 py-1.5 flex items-center gap-2.5 text-xs text-amber-200/70 font-semibold"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${state.status === 'running' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${state.status === 'running' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
            </span>
            Agent State:&nbsp;<strong className="text-white uppercase tracking-wider">{state.status}</strong>
          </div>
          <button
            onClick={() => navigate('/aqi')}
            style={{ border: '1px solid rgba(52,211,153,0.28)', background: 'rgba(52,211,153,0.08)' }}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-400/15 px-4 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <Globe size={13} /> Open Cesium Globe
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="max-w-[1680px] mx-auto px-5 mt-7 space-y-6">

        {/* Controls + Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Engine Controller */}
          <div className="glass-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5 pb-3 panel-divider" style={{ borderBottom: '1px solid rgba(180,145,60,0.12)' }}>
                <span className="text-amber-300/80 text-[11px] font-bold uppercase tracking-widest">Engine Controller</span>
                <span
                  style={{ background: 'rgba(180,145,60,0.08)', border: '1px solid rgba(180,145,60,0.18)' }}
                  className="text-[9px] text-amber-400/60 px-2 py-0.5 rounded-md font-bold tracking-widest uppercase"
                >v0.9 BETA</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-200/50 font-bold uppercase tracking-widest block">LLM Planner Core</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="w-full dashboard-select text-xs text-amber-100/90 font-medium rounded-xl py-2.5 pl-3 transition-all"
                  >
                    <option value="claude-3-5">Claude 3.5 Sonnet</option>
                    <option value="gpt-4o">GPT-4o (Reasoning Mode)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-200/50 font-bold uppercase tracking-widest block">Auto-Cycle Rate</label>
                  <select
                    value={runInterval}
                    onChange={(e) => setRunInterval(Number(e.target.value))}
                    className="w-full dashboard-select text-xs text-amber-100/90 font-medium rounded-xl py-2.5 pl-3 transition-all"
                  >
                    <option value={20000}>20 Seconds (Fast Demo)</option>
                    <option value={45000}>45 Seconds (Standard)</option>
                    <option value={90000}>90 Seconds (Thorough)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 mt-6">
              <button
                onClick={handleRunManual}
                disabled={state.status === 'running'}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                  state.status === 'running'
                    ? 'text-amber-200/25 cursor-not-allowed'
                    : 'text-slate-900 shadow-lg hover:shadow-xl hover:brightness-110'
                }`}
                style={
                  state.status !== 'running'
                    ? { background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', boxShadow: '0 4px 20px rgba(52,211,153,0.25)' }
                    : { background: 'rgba(255,235,180,0.05)', border: '1px solid rgba(180,145,60,0.12)' }
                }
              >
                <Zap size={14} className={state.status === 'running' ? 'animate-pulse' : ''} />
                {state.status === 'running' ? 'Cycle Executing...' : 'Trigger Agent Cycle'}
              </button>

              <button
                onClick={toggleAutoRun}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAutoRunning
                    ? 'text-rose-400 hover:bg-rose-500/10'
                    : 'text-emerald-400 hover:bg-emerald-500/10'
                }`}
                style={{
                  border: isAutoRunning ? '1px solid rgba(251,113,133,0.28)' : '1px solid rgba(52,211,153,0.25)',
                  background: isAutoRunning ? 'rgba(251,113,133,0.06)' : 'rgba(52,211,153,0.06)',
                }}
              >
                {isAutoRunning
                  ? <><Pause size={13} /><span>Pause Auto-Scheduler</span></>
                  : <><Play size={13} /><span>Enable Auto-Scheduler</span></>
                }
              </button>

              <div className="text-[11px] text-amber-200/35 text-center font-medium pt-1">
                Completed cycles: <span className="text-amber-100 font-bold">{state.cycleCount}</span>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="lg:col-span-3">
            <AgentPipeline currentNodeId={state.currentNodeId} status={state.status} />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-5">
            <ActivityFeed logs={state.logs} currentNodeId={state.currentNodeId} onClear={clearLogs} />
            <BlockchainLog nfts={state.nfts} />
          </div>
          <div className="space-y-5">
            <DecisionCards decisions={state.decisions} />
            <VerificationPanel verifications={state.verifications} />
          </div>
          <div className="space-y-5">
            <QuestsPanel quests={state.quests} />
          </div>
        </div>

      </main>
    </div>
  );
};

export default AgentMonitorPage;
