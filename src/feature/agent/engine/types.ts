export interface ZoneState {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  waterQuality: number; // 0-100 score
  solarIrradiance: number; // kWh/m^2/day
  humidity: number;
  temperature: number;
  timestamp: string;
}

export interface Forecast {
  zoneId: string;
  forecasts: {
    hour: 24 | 48 | 72;
    aqi: number;
    waterQuality: number;
    solarIrradiance: number;
  }[];
}

export interface AlertZone {
  zoneId: string;
  zoneName: string;
  metrics: {
    aqi: number;
    waterQuality: number;
    solarIrradiance: number;
  };
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type ActionType = 'PLANT_TREES' | 'WATER_CONSERVATION' | 'SOLAR_ADOPTION' | 'MONITOR';

export interface AgentDecision {
  zoneId: string;
  zoneName: string;
  action: ActionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  metrics: {
    treeCount?: number;
    waterGallons?: number;
    solarPanelsCount?: number;
    estimatedCost: number;
  };
  llmReasoning: string;
}

export interface ImpactPrediction {
  zoneId: string;
  zoneName: string;
  action: ActionType;
  predictedAqiChange: number; // negative is reduction
  predictedWaterQualityImprovement: number;
  predictedCleanEnergyKwh: number;
  impactMetrics: {
    co2OffsetKg: number;
    peopleBenefited: number;
  };
}

export interface Quest {
  id: string;
  zoneId: string;
  zoneName: string;
  title: string;
  description: string;
  rewardPoints: number;
  durationHours: number;
  progress: number; // 0 - 100
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  actionType: ActionType;
  targetMetric: string;
}

export interface NFTRecord {
  tokenId: string;
  zoneName: string;
  actionType: ActionType;
  txHash: string;
  timestamp: string;
  metadataUrl: string;
  details: string;
}

export interface VerificationResult {
  zoneId: string;
  zoneName: string;
  actionType: ActionType;
  predictedDelta: number;
  actualDelta: number;
  accuracy: number; // percentage
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export interface AgentCycleResult {
  cycleId: number;
  timestamp: string;
  ingest: ZoneState[];
  forecast: Forecast[];
  alerts: AlertZone[];
  decisions: AgentDecision[];
  impacts: ImpactPrediction[];
  quests: Quest[];
  nfts: NFTRecord[];
  verifications: VerificationResult[];
}

export type AgentNodeId =
  | 'ingest'
  | 'forecast'
  | 'threshold'
  | 'reasoning'
  | 'impact'
  | 'quest'
  | 'blockchain'
  | 'verify';

export interface NodeEvent {
  nodeId: AgentNodeId;
  status: 'running' | 'completed' | 'error';
  data?: any;
  durationMs?: number;
  message: string;
}
