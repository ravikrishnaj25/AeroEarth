import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [runInterval, setRunInterval] = useState<number>(45000); // 45 seconds default
  
  const {
    state,
    runCycle,
    clearLogs,
    isAutoRunning,
    toggleAutoRun
  } = useAgentEngine(runInterval);

  const handleRunManual = async () => {
    if (state.status !== 'running') {
      await runCycle();
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRunInterval(Number(e.target.value));
  };

  return (
    <div className="agent-dashboard min-h-screen pb-12 font-sans selection:bg-[#00ff55]/30 selection:text-white">
      {/* Top Navigation / Header */}
      <header className="border-b border-[rgba(0,255,85,0.15)] bg-black/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="text-xs font-mono border border-slate-800 hover:border-[#00ff55]/30 hover:text-[#00ff55] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-slate-400 bg-slate-950/50"
          >
            <span>←</span> Home
          </button>
          <div className="h-5 w-[1px] bg-slate-800"></div>
          <div>
            <h1 className="text-white font-mono text-sm tracking-wider font-bold flex items-center gap-2">
              <span className="text-[#00ff55] text-glow-green">🛡️ EcoGuardian</span> Agent Monitor
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Autonomous AI-driven climate protection planner
            </p>
          </div>
        </div>

        {/* Global Agent State Pill */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-950/80 border border-slate-900 rounded-xl px-4 py-1.5 flex items-center gap-2.5 font-mono text-xs text-slate-400">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${state.status === 'running' ? 'bg-[#00ff55]' : 'bg-blue-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${state.status === 'running' ? 'bg-[#00ff55]' : 'bg-blue-400'}`}></span>
            </span>
            <span>Agent State: <strong className="text-white uppercase">{state.status}</strong></span>
          </div>

          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); navigate('/aqi'); }}
            className="text-xs font-mono bg-[#00ff55]/10 text-[#00ff55] border border-[#00ff55]/20 hover:bg-[#00ff55]/20 px-3 py-1.5 rounded-lg transition-all font-semibold"
          >
            Open Cesium Globe →
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1600px] mx-auto px-6 mt-6 space-y-6">
        
        {/* Top Control and Pipeline Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="bg-[#0a0f0d] border border-[rgba(0,255,85,0.15)] rounded-2xl p-5 flex flex-col justify-between shadow-[0_0_20px_rgba(0,255,85,0.02)] backdrop-blur-md font-mono">
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-[rgba(0,255,85,0.1)] pb-2.5">
                <span className="text-[#00ff55] text-xs font-bold uppercase tracking-wider">Engine Controller</span>
                <span className="text-xs text-slate-500">v0.9.0-BETA</span>
              </div>

              {/* Selector / Configuration */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 block uppercase">LLM Planner Core</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-xs text-white outline-none focus:border-[#00ff55]/50 transition-colors"
                  >
                    <option value="claude-3-5">Claude 3.5 Sonnet (Recom.)</option>
                    <option value="gpt-4o">GPT-4o (Reasoning Mode)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 block uppercase">Auto-Cycle Rate</label>
                  <select 
                    value={runInterval}
                    onChange={handleIntervalChange}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-xs text-white outline-none focus:border-[#00ff55]/50 transition-colors"
                  >
                    <option value={20000}>20 Seconds (Fast Demo)</option>
                    <option value={45000}>45 Seconds (Standard)</option>
                    <option value={90000}>90 Seconds (Thorough)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Run Buttons */}
            <div className="space-y-2.5 mt-5">
              <button 
                onClick={handleRunManual}
                disabled={state.status === 'running'}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-300 border ${
                  state.status === 'running' 
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'bg-[#00ff55] hover:bg-[#00cc44] text-black border-transparent shadow-[0_0_15px_rgba(0,255,85,0.15)] hover:shadow-[0_0_25px_rgba(0,255,85,0.3)]'
                }`}
              >
                {state.status === 'running' ? 'Cycle Executing...' : '⚡ Trigger Agent Cycle'}
              </button>

              <button 
                onClick={toggleAutoRun}
                className={`w-full py-2 px-4 rounded-xl text-xs font-bold border transition-colors ${
                  isAutoRunning 
                    ? 'border-red-500/30 text-red-400 bg-red-950/10 hover:bg-red-950/20' 
                    : 'border-[#00ff55]/30 text-[#00ff55] bg-[#00ff55]/5 hover:bg-[#00ff55]/10'
                }`}
              >
                {isAutoRunning ? '❚❚ Pause Auto-Scheduler' : '▶ Enable Auto-Scheduler'}
              </button>

              <div className="text-xs text-slate-500 text-center mt-1">
                Completed cycles: <span className="text-white font-bold">{state.cycleCount}</span>
              </div>
            </div>
          </div>

          {/* Pipeline Component (Takes remaining 3 columns) */}
          <div className="lg:col-span-3">
            <AgentPipeline currentNodeId={state.currentNodeId} status={state.status} />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Column 1: CLI Telemetry & On-Chain Commitments */}
          <div className="space-y-6">
            <ActivityFeed logs={state.logs} currentNodeId={state.currentNodeId} onClear={clearLogs} />
            <BlockchainLog nfts={state.nfts} />
          </div>

          {/* Column 2: LLM Decisions & Verification Engine */}
          <div className="space-y-6">
            <DecisionCards decisions={state.decisions} />
            <VerificationPanel verifications={state.verifications} />
          </div>

          {/* Column 3: Active Quests */}
          <div className="space-y-6">
            <QuestsPanel quests={state.quests} />
          </div>

        </div>

      </main>
    </div>
  );
};

export default AgentMonitorPage;
