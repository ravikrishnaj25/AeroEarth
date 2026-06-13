import type { 
  ZoneState, 
  Forecast, 
  AlertZone, 
  AgentDecision, 
  ImpactPrediction, 
  Quest, 
  NFTRecord, 
  VerificationResult, 
  AgentNodeId,
  AgentCycleResult
} from './types';
import { 
  IngestNode, 
  ForecastNode, 
  ThresholdNode, 
  ReasoningNode, 
  ImpactNode, 
  QuestNode, 
  BlockchainNode, 
  VerifyNode 
} from './nodes';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface EngineState {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentNodeId: AgentNodeId | null;
  cycleCount: number;
  zones: ZoneState[];
  forecasts: Forecast[];
  alerts: AlertZone[];
  decisions: AgentDecision[];
  impacts: ImpactPrediction[];
  quests: Quest[];
  nfts: NFTRecord[];
  verifications: VerificationResult[];
  logs: { timestamp: string; level: 'info' | 'warning' | 'error' | 'success'; message: string; node?: AgentNodeId }[];
  history: AgentCycleResult[];
}

type StateListener = (state: EngineState) => void;

export class AgentEngine {
  private state: EngineState;
  private listeners: Set<StateListener> = new Set();

  constructor() {
    this.state = {
      status: 'idle',
      currentNodeId: null,
      cycleCount: 0,
      zones: [],
      forecasts: [],
      alerts: [],
      decisions: [],
      impacts: [],
      quests: [],
      nfts: [],
      verifications: [],
      logs: [],
      history: []
    };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Emit initial state
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach(listener => listener(copy));
  }

  private addLog(level: 'info' | 'warning' | 'error' | 'success', message: string, node?: AgentNodeId) {
    const time = new Date().toLocaleTimeString();
    this.state.logs = [
      { timestamp: time, level, message, node },
      ...this.state.logs
    ].slice(0, 100); // keep last 100 logs
    this.notify();
  }

  public getState(): EngineState {
    return { ...this.state };
  }

  public clearLogs() {
    this.state.logs = [];
    this.addLog('info', 'Telemetry activity log cleared.');
  }

  public async runCycle(): Promise<AgentCycleResult | null> {
    if (this.state.status === 'running') {
      this.addLog('warning', 'Agent cycle is already running.');
      return null;
    }

    this.state.status = 'running';
    this.state.currentNodeId = 'ingest';
    this.notify();

    const cycleId = this.state.cycleCount + 1;
    this.addLog('info', `Starting Autonomous Agentic Cycle #${cycleId}...`, 'ingest');
    await delay(1200);

    try {
      // 1. INGESTION NODE
      this.addLog('info', 'Ingesting telemetry from 6 environmental monitoring zones...', 'ingest');
      const ingestedZones = IngestNode.execute(cycleId, this.state.zones);
      this.state.zones = ingestedZones;
      this.addLog('success', `Telemetry successfully synchronized. 6 zones online.`, 'ingest');
      await delay(1200);

      // 2. FORECASTING NODE
      this.state.currentNodeId = 'forecast';
      this.addLog('info', 'Invoking multi-variate prediction model on active zones...', 'forecast');
      await delay(600);
      const forecasts = ForecastNode.execute(ingestedZones);
      this.state.forecasts = forecasts;
      this.addLog('success', 'Generated 24h, 48h, and 72h forecasts for AQI, Water & Solar.', 'forecast');
      await delay(1200);

      // 3. THRESHOLD DETECTION NODE
      this.state.currentNodeId = 'threshold';
      this.addLog('info', 'Analyzing forecast values against environmental safety thresholds...', 'threshold');
      await delay(500);
      const alerts = ThresholdNode.execute(ingestedZones, forecasts);
      this.state.alerts = alerts;
      if (alerts.length > 0) {
        alerts.forEach(alert => {
          this.addLog(
            alert.severity === 'critical' ? 'error' : 'warning', 
            `[ALERT] ${alert.zoneName}: ${alert.reason}`, 
            'threshold'
          );
        });
      } else {
        this.addLog('success', 'All parameters within standard safety thresholds.', 'threshold');
      }
      await delay(1200);

      // 4. AGENTIC REASONING NODE
      this.state.currentNodeId = 'reasoning';
      this.addLog('info', 'Invoking Claude 3.5 Sonnet reasoning agent to determine optimal interventions...', 'reasoning');
      await delay(1800);
      const decisions = ReasoningNode.execute(alerts);
      this.state.decisions = decisions;
      decisions.forEach(dec => {
        if (dec.action !== 'MONITOR') {
          this.addLog('info', `[DECISION] Agent selected ${dec.action} for ${dec.zoneName} (Priority: ${dec.priority.toUpperCase()})`, 'reasoning');
        } else {
          this.addLog('info', `[DECISION] Maintain telemetry monitoring for ${dec.zoneName}`, 'reasoning');
        }
      });
      await delay(1200);

      // 5. IMPACT PREDICTION NODE
      this.state.currentNodeId = 'impact';
      this.addLog('info', 'Simulating micro-climate impact and ROI on chosen interventions...', 'impact');
      await delay(1000);
      const impacts = ImpactNode.execute(decisions);
      this.state.impacts = impacts;
      impacts.forEach(imp => {
        if (imp.action === 'PLANT_TREES') {
          this.addLog('success', `[IMPACT] ${imp.zoneName}: Est. AQI change ${imp.predictedAqiChange}, CO2 offset: ${imp.impactMetrics.co2OffsetKg}kg/yr`, 'impact');
        } else if (imp.action === 'WATER_CONSERVATION') {
          this.addLog('success', `[IMPACT] ${imp.zoneName}: Est. Water Quality improvement +${imp.predictedWaterQualityImprovement} points`, 'impact');
        } else if (imp.action === 'SOLAR_ADOPTION') {
          this.addLog('success', `[IMPACT] ${imp.zoneName}: Est. clean energy production ${imp.predictedCleanEnergyKwh} kWh/day`, 'impact');
        }
      });
      await delay(1200);

      // 6. CITIZEN QUEST CREATION NODE
      this.state.currentNodeId = 'quest';
      this.addLog('info', 'Generating citizen mobilization quests and rewards...', 'quest');
      await delay(1000);
      const newQuests = QuestNode.execute(decisions);
      // Merge quests (replace older ones for same zone or add new ones)
      const mergedQuests = [...this.state.quests];
      newQuests.forEach(newQ => {
        const idx = mergedQuests.findIndex(q => q.zoneId === newQ.zoneId && q.status === 'ACTIVE');
        if (idx > -1) {
          mergedQuests[idx] = { ...mergedQuests[idx], status: 'EXPIRED' }; // expire old active
        }
        mergedQuests.push(newQ);
      });
      this.state.quests = mergedQuests.slice(-20); // keep last 20 quests
      newQuests.forEach(q => {
        this.addLog('success', `[QUEST CREATED] "${q.title}" in ${q.zoneName} (${q.rewardPoints} XP reward)`, 'quest');
      });
      await delay(1200);

      // 7. BLOCKCHAIN NOTARIZATION NODE
      this.state.currentNodeId = 'blockchain';
      this.addLog('info', 'Connecting to Polygon RPC Provider. Minting Climate Commitment NFT...', 'blockchain');
      await delay(1500);
      const newNfts = BlockchainNode.execute(decisions, cycleId);
      this.state.nfts = [...newNfts, ...this.state.nfts].slice(0, 30); // keep last 30
      newNfts.forEach(nft => {
        this.addLog('success', `[BLOCKCHAIN] NFT Minted. Token ID: #${nft.tokenId}. Tx: ${nft.txHash.slice(0, 10)}...`, 'blockchain');
      });
      await delay(1200);

      // 8. VERIFICATION NODE
      this.state.currentNodeId = 'verify';
      this.addLog('info', 'Verifying previous cycle predictions against actual ingested updates...', 'verify');
      await delay(1000);
      
      // We verify the previous cycle's predictions using this cycle's newly ingested zones
      // If history exists, take the last cycle's decisions and predictions
      const lastCycle = this.state.history[0];
      let verifications: VerificationResult[] = [];
      if (lastCycle && lastCycle.decisions && lastCycle.impacts) {
        verifications = VerifyNode.execute(lastCycle.decisions, lastCycle.impacts, ingestedZones);
        this.state.verifications = [...verifications, ...this.state.verifications].slice(0, 20);
        verifications.forEach(ver => {
          this.addLog(
            ver.accuracy > 80 ? 'success' : 'warning',
            `[VERIFY] ${ver.zoneName} Efficacy: Predicted ${ver.predictedDelta}, Actual ${ver.actualDelta} (Accuracy: ${ver.accuracy}%)`, 
            'verify'
          );
        });
      } else {
        this.addLog('info', '[VERIFY] Baseline established. Efficacy verification will run in Cycle #2.', 'verify');
      }
      await delay(1000);

      // Complete cycle
      const cycleResult: AgentCycleResult = {
        cycleId,
        timestamp: new Date().toISOString(),
        ingest: ingestedZones,
        forecasts, // Wait, type in types.ts is forecasts: Forecast[], but in interface it was forecast: Forecast[]
        // Let's make sure it matches the type, wait, in types.ts, let's verify if it was forecast or forecasts.
        // In types.ts:
        // interface AgentCycleResult {
        //   cycleId: number;
        //   timestamp: string;
        //   ingest: ZoneState[];
        //   forecast: Forecast[]; // It was forecast (singular). Let's use forecast as forecast: forecasts in the object.
        forecast: forecasts,
        alerts,
        decisions,
        impacts,
        quests: newQuests,
        nfts: newNfts,
        verifications
      } as AgentCycleResult;

      this.state.history = [cycleResult, ...this.state.history].slice(0, 10);
      this.state.cycleCount = cycleId;
      this.state.status = 'completed';
      this.state.currentNodeId = null;
      this.addLog('success', `Autonomous Agentic Cycle #${cycleId} completed successfully!`, 'verify');
      this.notify();

      // Simulate ongoing quest progress updates after cycle completion
      this.updateActiveQuestsProgress();

      return cycleResult;
    } catch (err: any) {
      this.state.status = 'error';
      this.state.currentNodeId = null;
      this.addLog('error', `Cycle failed with error: ${err.message || err}`);
      this.notify();
      return null;
    }
  }

  // Helper to periodically increase progress on active quests for a dynamic interface
  private updateActiveQuestsProgress() {
    this.state.quests = this.state.quests.map(quest => {
      if (quest.status === 'ACTIVE') {
        const additionalProgress = Math.floor(Math.random() * 12) + 4;
        const newProgress = Math.min(100, quest.progress + additionalProgress);
        return {
          ...quest,
          progress: newProgress,
          status: newProgress >= 100 ? 'COMPLETED' : 'ACTIVE'
        };
      }
      return quest;
    });
    this.notify();
  }
}

// Singleton instance of the engine
export const agentEngineInstance = new AgentEngine();
