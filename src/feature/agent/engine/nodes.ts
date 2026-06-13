import type { 
  ZoneState, 
  Forecast, 
  AlertZone, 
  AgentDecision, 
  ImpactPrediction, 
  Quest, 
  NFTRecord, 
  VerificationResult,
  ActionType
} from './types';
import { MOCK_ZONES, MOCK_LLM_REASONING, FAKE_TXS } from './mockData';

// 1. IngestNode
export class IngestNode {
  static execute(_cycleIndex: number, previousZones?: ZoneState[]): ZoneState[] {
    // If we have previous zones, we can simulate slight changes
    if (previousZones && previousZones.length > 0) {
      return previousZones.map(zone => {
        // Create small fluctuations
        const aqiDelta = Math.floor(Math.random() * 15) - 7;
        const waterDelta = Math.floor(Math.random() * 7) - 3;
        const solarDelta = (Math.random() * 0.6) - 0.3;
        const tempDelta = Math.floor(Math.random() * 3) - 1;

        return {
          ...zone,
          aqi: Math.max(30, Math.min(300, zone.aqi + aqiDelta)),
          waterQuality: Math.max(10, Math.min(100, zone.waterQuality + waterDelta)),
          solarIrradiance: parseFloat(Math.max(1.0, Math.min(10.0, zone.solarIrradiance + solarDelta)).toFixed(2)),
          temperature: Math.max(15, Math.min(45, zone.temperature + tempDelta)),
          timestamp: new Date().toISOString()
        };
      });
    }

    // Default load
    return MOCK_ZONES.map(z => ({
      ...z,
      timestamp: new Date().toISOString()
    }));
  }
}

// 2. ForecastNode
export class ForecastNode {
  static execute(zones: ZoneState[]): Forecast[] {
    return zones.map(zone => {
      // Create a deterministic yet slightly randomized trend
      // Industrial zones trend worse, clean zones fluctuate
      const isIndustrial = zone.id.includes('industrial') || zone.id.includes('north');
      const baseTrend = isIndustrial ? 1.04 : 0.98;

      return {
        zoneId: zone.id,
        forecasts: [
          {
            hour: 24,
            aqi: Math.round(zone.aqi * baseTrend + (Math.random() * 6 - 3)),
            waterQuality: Math.round(zone.waterQuality * (2 - baseTrend) + (Math.random() * 4 - 2)),
            solarIrradiance: parseFloat(Math.max(1.0, zone.solarIrradiance * (0.95 + Math.random() * 0.1)).toFixed(2))
          },
          {
            hour: 48,
            aqi: Math.round(zone.aqi * Math.pow(baseTrend, 2) + (Math.random() * 10 - 5)),
            waterQuality: Math.round(zone.waterQuality * Math.pow(2 - baseTrend, 2) + (Math.random() * 6 - 3)),
            solarIrradiance: parseFloat(Math.max(1.0, zone.solarIrradiance * (0.92 + Math.random() * 0.16)).toFixed(2))
          },
          {
            hour: 72,
            aqi: Math.round(zone.aqi * Math.pow(baseTrend, 3) + (Math.random() * 16 - 8)),
            waterQuality: Math.round(zone.waterQuality * Math.pow(2 - baseTrend, 3) + (Math.random() * 8 - 4)),
            solarIrradiance: parseFloat(Math.max(1.0, zone.solarIrradiance * (0.90 + Math.random() * 0.2)).toFixed(2))
          }
        ]
      };
    });
  }
}

// 3. ThresholdNode
export class ThresholdNode {
  static execute(zones: ZoneState[], forecasts: Forecast[]): AlertZone[] {
    const alerts: AlertZone[] = [];

    zones.forEach(zone => {
      const forecast = forecasts.find(f => f.zoneId === zone.id);
      const h24Aqi = forecast ? forecast.forecasts[0].aqi : zone.aqi;
      const h24Water = forecast ? forecast.forecasts[0].waterQuality : zone.waterQuality;

      // Rule triggers
      if (zone.aqi > 150 || h24Aqi > 160) {
        alerts.push({
          zoneId: zone.id,
          zoneName: zone.name,
          metrics: { aqi: zone.aqi, waterQuality: zone.waterQuality, solarIrradiance: zone.solarIrradiance },
          reason: `Critical AQI exceedance: Current AQI (${zone.aqi}) or 24h forecast (${h24Aqi}) exceeds safety threshold of 150.`,
          severity: 'critical'
        });
      } else if (zone.waterQuality < 45 || h24Water < 40) {
        alerts.push({
          zoneId: zone.id,
          zoneName: zone.name,
          metrics: { aqi: zone.aqi, waterQuality: zone.waterQuality, solarIrradiance: zone.solarIrradiance },
          reason: `Severe Water Quality degradation: Current score (${zone.waterQuality}) indicates critical pollutant contamination.`,
          severity: 'high'
        });
      } else if (zone.aqi > 100) {
        alerts.push({
          zoneId: zone.id,
          zoneName: zone.name,
          metrics: { aqi: zone.aqi, waterQuality: zone.waterQuality, solarIrradiance: zone.solarIrradiance },
          reason: `Elevated Air Pollution: AQI (${zone.aqi}) is unhealthy for sensitive groups.`,
          severity: 'medium'
        });
      } else if (zone.solarIrradiance > 5.5 && zone.aqi > 80) {
        // High solar potential combined with moderate pollution makes it a prime candidate for solar adoption to offset grid emissions
        alerts.push({
          zoneId: zone.id,
          zoneName: zone.name,
          metrics: { aqi: zone.aqi, waterQuality: zone.waterQuality, solarIrradiance: zone.solarIrradiance },
          reason: `Solar Offset Opportunity: High solar irradiance (${zone.solarIrradiance} kWh/m²/day) with moderate energy grid load.`,
          severity: 'low'
        });
      }
    });

    return alerts;
  }
}

// 4. ReasoningNode
export class ReasoningNode {
  static execute(alerts: AlertZone[]): AgentDecision[] {
    // If no alerts, we still want to make at least one positive decision in high-priority zones for demo purposes
    const targets = alerts.length > 0 
      ? alerts 
      : [{
          zoneId: 'bengaluru-east',
          zoneName: 'Bengaluru East (Tech Corridor)',
          metrics: { aqi: 88, waterQuality: 65, solarIrradiance: 5.2 },
          reason: 'Scheduled optimization check.',
          severity: 'low' as const
        }];

    return targets.map(alert => {
      let action: ActionType = 'MONITOR';
      let details = '';
      let priority = alert.severity;
      
      // Determine action based on alert trigger
      if (alert.severity === 'critical' || alert.metrics.aqi > 150) {
        action = 'PLANT_TREES';
      } else if (alert.metrics.waterQuality < 50) {
        action = 'WATER_CONSERVATION';
      } else if (alert.metrics.solarIrradiance > 5.0) {
        action = 'SOLAR_ADOPTION';
      }

      // Fill in metrics
      const treeCount = action === 'PLANT_TREES' ? Math.floor(100 + Math.random() * 200) : undefined;
      const waterGallons = action === 'WATER_CONSERVATION' ? Math.floor(10000 + Math.random() * 40000) : undefined;
      const solarPanelsCount = action === 'SOLAR_ADOPTION' ? Math.floor(20 + Math.random() * 50) : undefined;
      const estimatedCost = action === 'PLANT_TREES' 
        ? (treeCount || 0) * 12 
        : action === 'WATER_CONSERVATION' 
          ? 2500 
          : action === 'SOLAR_ADOPTION' 
            ? (solarPanelsCount || 0) * 450 
            : 0;

      // Extract LLM reasoning template or write a dynamic fallback
      const templates = MOCK_LLM_REASONING[alert.zoneId] || MOCK_LLM_REASONING['chennai-north'];
      const llmReasoning = templates[action] || `Autonomous check completed. Node verified. Decision: ${action}.`;

      if (action === 'PLANT_TREES') {
        details = `Deploy urban canopy initiative in ${alert.zoneName}. Plan: plant ${treeCount} trees to combat high particulate matter.`;
      } else if (action === 'WATER_CONSERVATION') {
        details = `Deploy smart bio-retention filters and stormwater catchments to intercept runoff in ${alert.zoneName}. Target: save ${waterGallons?.toLocaleString()} gallons.`;
      } else if (action === 'SOLAR_ADOPTION') {
        details = `Rollout community smart solar grid project in ${alert.zoneName} to install ${solarPanelsCount} photovoltaic panels.`;
      } else {
        details = `Sensor readings within acceptable range. Continue monitoring telemetry in ${alert.zoneName}.`;
      }

      return {
        zoneId: alert.zoneId,
        zoneName: alert.zoneName,
        action,
        priority,
        details,
        metrics: {
          treeCount,
          waterGallons,
          solarPanelsCount,
          estimatedCost
        },
        llmReasoning
      };
    });
  }
}

// 5. ImpactNode
export class ImpactNode {
  static execute(decisions: AgentDecision[]): ImpactPrediction[] {
    return decisions.map(decision => {
      let predictedAqiChange = 0;
      let predictedWaterQualityImprovement = 0;
      let predictedCleanEnergyKwh = 0;
      let co2OffsetKg = 0;
      let peopleBenefited = 0;

      if (decision.action === 'PLANT_TREES') {
        const trees = decision.metrics.treeCount || 150;
        predictedAqiChange = -parseFloat((trees * 0.12).toFixed(1)); // e.g. -18 AQI
        co2OffsetKg = trees * 22; // 22kg CO2 per tree per year
        peopleBenefited = Math.floor(trees * 4.5);
      } else if (decision.action === 'WATER_CONSERVATION') {
        predictedWaterQualityImprovement = Math.floor(10 + Math.random() * 12); // e.g. +11 points
        co2OffsetKg = 150; // pumps offset
        peopleBenefited = Math.floor(500 + Math.random() * 1000);
      } else if (decision.action === 'SOLAR_ADOPTION') {
        const panels = decision.metrics.solarPanelsCount || 30;
        predictedCleanEnergyKwh = panels * 320 * 0.001 * 5; // kW * sun hours = kWh/day
        predictedCleanEnergyKwh = parseFloat(predictedCleanEnergyKwh.toFixed(1));
        co2OffsetKg = Math.floor(predictedCleanEnergyKwh * 0.85); // 0.85kg CO2 offset per kWh
        peopleBenefited = Math.floor(panels * 3);
      }

      return {
        zoneId: decision.zoneId,
        zoneName: decision.zoneName,
        action: decision.action,
        predictedAqiChange,
        predictedWaterQualityImprovement,
        predictedCleanEnergyKwh,
        impactMetrics: {
          co2OffsetKg,
          peopleBenefited
        }
      };
    });
  }
}

// 6. QuestNode
export class QuestNode {
  static execute(decisions: AgentDecision[]): Quest[] {
    return decisions
      .filter(d => d.action !== 'MONITOR')
      .map((decision, index) => {
        let title = '';
        let description = '';
        let rewardPoints = 100;
        let targetMetric = '';

        if (decision.action === 'PLANT_TREES') {
          title = `Green Canopy Project — ${decision.zoneName.split(' ')[0]}`;
          description = `Join volunteers to plant and adopt ${decision.metrics.treeCount} native trees. Water supply and tools provided.`;
          rewardPoints = (decision.metrics.treeCount || 100) * 2;
          targetMetric = `Plant ${decision.metrics.treeCount} trees`;
        } else if (decision.action === 'WATER_CONSERVATION') {
          title = `Water Catchment Drive — ${decision.zoneName.split(' ')[0]}`;
          description = `Install rainwater recharge pits and bioswales. Help safeguard ${decision.zoneName}'s groundwater table.`;
          rewardPoints = 350;
          targetMetric = `Collect ${(decision.metrics.waterGallons || 20000).toLocaleString()} gallons`;
        } else if (decision.action === 'SOLAR_ADOPTION') {
          title = `Solarize ${decision.zoneName.split(' ')[0]}`;
          description = `Coordinate local rooftop audits and panel installation drives to set up ${decision.metrics.solarPanelsCount} net-metered arrays.`;
          rewardPoints = 500;
          targetMetric = `Install ${decision.metrics.solarPanelsCount} Solar Panels`;
        }

        return {
          id: `quest-${Date.now()}-${index}`,
          zoneId: decision.zoneId,
          zoneName: decision.zoneName,
          title,
          description,
          rewardPoints,
          durationHours: 72,
          progress: Math.floor(Math.random() * 20), // start with low progress
          status: 'ACTIVE',
          actionType: decision.action,
          targetMetric
        };
      });
  }
}

// 7. BlockchainNode
export class BlockchainNode {
  static execute(decisions: AgentDecision[], cycleIndex: number): NFTRecord[] {
    return decisions
      .filter(d => d.action !== 'MONITOR')
      .map((decision, index) => {
        const tokenId = (1000 + cycleIndex * 10 + index).toString();
        const txHash = FAKE_TXS[(cycleIndex + index) % FAKE_TXS.length];
        
        let details = '';
        if (decision.action === 'PLANT_TREES') {
          details = `Mint Climate Commitment: Urban Afforestation of ${decision.metrics.treeCount} saplings.`;
        } else if (decision.action === 'WATER_CONSERVATION') {
          details = `Mint Climate Commitment: Hydrological restoration block for water filtration.`;
        } else if (decision.action === 'SOLAR_ADOPTION') {
          details = `Mint Climate Commitment: Renewable Energy Generation certificate for ${decision.metrics.solarPanelsCount} PV arrays.`;
        }

        return {
          tokenId,
          zoneName: decision.zoneName,
          actionType: decision.action,
          txHash,
          timestamp: new Date().toISOString(),
          metadataUrl: `ipfs://bafybeihypo3.../nft-${tokenId}.json`,
          details
        };
      });
  }
}

// 8. VerifyNode
export class VerifyNode {
  static execute(
    previousDecisions: AgentDecision[], 
    previousPredictions: ImpactPrediction[], 
    _currentZones: ZoneState[]
  ): VerificationResult[] {
    if (!previousDecisions || previousDecisions.length === 0 || !previousPredictions || previousPredictions.length === 0) {
      return [];
    }

    return previousPredictions.map(pred => {
      let predictedDelta = 0;
      let actualDelta = 0;
      
      if (pred.action === 'PLANT_TREES') {
        // We predicted a negative AQI change (reduction)
        predictedDelta = pred.predictedAqiChange;
        // Mock the actual reduction: make it close to prediction (85% to 105% accuracy)
        const accuracyMultiplier = 0.82 + Math.random() * 0.22;
        actualDelta = parseFloat((predictedDelta * accuracyMultiplier).toFixed(1));
      } else if (pred.action === 'WATER_CONSERVATION') {
        predictedDelta = pred.predictedWaterQualityImprovement;
        const accuracyMultiplier = 0.85 + Math.random() * 0.2;
        actualDelta = Math.round(predictedDelta * accuracyMultiplier);
      } else if (pred.action === 'SOLAR_ADOPTION') {
        predictedDelta = pred.predictedCleanEnergyKwh;
        const accuracyMultiplier = 0.88 + Math.random() * 0.15;
        actualDelta = parseFloat((predictedDelta * accuracyMultiplier).toFixed(1));
      } else {
        return null;
      }

      const diff = Math.abs(predictedDelta - actualDelta);
      const denominator = Math.max(1, Math.abs(predictedDelta));
      const accuracy = Math.max(50, Math.min(100, Math.round((1 - diff / denominator) * 100)));

      return {
        zoneId: pred.zoneId,
        zoneName: pred.zoneName,
        actionType: pred.action,
        predictedDelta,
        actualDelta,
        accuracy,
        status: accuracy > 85 ? 'SUCCESS' : accuracy > 70 ? 'PARTIAL' : 'FAILED'
      };
    }).filter(Boolean) as VerificationResult[];
  }
}
