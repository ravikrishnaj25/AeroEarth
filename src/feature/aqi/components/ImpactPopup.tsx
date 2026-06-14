import React from 'react';
import type { ImpactData } from '../utils/calculations';
import { formatCurrency } from '../utils/calculations';

interface ImpactPopupProps {
    impact: ImpactData | null;
    position: { x: number; y: number } | null;
    onClose: () => void;
}

export const ImpactPopup: React.FC<ImpactPopupProps> = ({ impact, position, onClose }) => {
    if (!impact || !position) return null;

    return (
        <div
            className="impact-popup"
            style={{
                position: 'fixed',
                left: position.x + 20,
                top: position.y - 100,
                zIndex: 1000,
            }}
        >
            <button className="impact-popup-close" onClick={onClose}>×</button>

            {impact.type === 'tree' && (
                <div className="impact-content">
                    <div className="impact-header tree">
                        <span className="impact-icon">🌳</span>
                        <h3>Tree Impact Summary</h3>
                    </div>
                    <div className="impact-badge outdoor">🌍 Outdoor Impact</div>

                    <div className="impact-stats">
                        <div className="stat-row highlight">
                            <span className="stat-label">Tree Type</span>
                            <span className="stat-value">{impact.treeName}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">AQI Improvement</span>
                            <span className="stat-value positive">-{impact.aqiImprovement} points</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">PM2.5 Reduction</span>
                            <span className="stat-value">-{impact.pm25Reduction} µg/m³</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">PM10 Reduction</span>
                            <span className="stat-value">-{impact.pm10Reduction} µg/m³</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Coverage Radius</span>
                            <span className="stat-value">{impact.coverageRadius}m</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">CO₂ Absorbed</span>
                            <span className="stat-value eco">{impact.co2Absorbed} kg/year</span>
                        </div>
                    </div>

                    <div className="impact-cost">
                        <div className="cost-row">
                            <span>One-time Cost</span>
                            <span className="cost-value">{formatCurrency(impact.costOneTime)}</span>
                        </div>
                        <div className="cost-row">
                            <span>Maintenance</span>
                            <span className="cost-value">{formatCurrency(impact.maintenanceMonthly)}/month</span>
                        </div>
                    </div>

                    <p className="impact-summary">{impact.impactSummary}</p>
                </div>
            )}

            {impact.type === 'garden' && (
                <div className="impact-content">
                    <div className="impact-header garden">
                        <span className="impact-icon">🌿</span>
                        <h3>Vertical Garden Impact</h3>
                    </div>
                    <div className="impact-badge outdoor">🌍 Outdoor Impact</div>

                    <div className="impact-stats">
                        <div className="stat-row highlight">
                            <span className="stat-label">Area Installed</span>
                            <span className="stat-value">{impact.areaM2} m²</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">AQI Improvement</span>
                            <span className="stat-value positive">-{impact.aqiImprovement} points</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">PM2.5 Reduction</span>
                            <span className="stat-value">-{impact.pm25Reduction} µg/m³</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Temperature Drop</span>
                            <span className="stat-value eco">-{impact.temperatureReduction.toFixed(1)}°C</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Noise Reduction</span>
                            <span className="stat-value">-{impact.noiseReduction.toFixed(1)} dB</span>
                        </div>
                    </div>

                    <div className="impact-cost">
                        <div className="cost-row">
                            <span>Cost per m²</span>
                            <span className="cost-value">{formatCurrency(impact.costPerM2)}</span>
                        </div>
                        <div className="cost-row total">
                            <span>Total Cost</span>
                            <span className="cost-value">{formatCurrency(impact.totalCost)}</span>
                        </div>
                        <div className="cost-row">
                            <span>Maintenance</span>
                            <span className="cost-value">{formatCurrency(impact.maintenanceMonthly)}/month</span>
                        </div>
                    </div>

                    <p className="impact-summary">{impact.impactSummary}</p>
                </div>
            )}

            {impact.type === 'purifier' && (
                <div className="impact-content">
                    <div className="impact-header purifier">
                        <span className="impact-icon">💨</span>
                        <h3>Air Purifier Impact</h3>
                    </div>
                    <div className="impact-badge indoor">🏠 Indoor Impact</div>

                    <div className="impact-stats">
                        <div className="stat-row highlight">
                            <span className="stat-label">Room Coverage</span>
                            <span className="stat-value">{impact.coverageSqFt} sq ft</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Indoor PM2.5 Drop</span>
                            <span className="stat-value positive">-{impact.pm25ReductionPercent}%</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">CADR</span>
                            <span className="stat-value">{impact.cadr} m³/hr</span>
                        </div>
                    </div>

                    <div className="impact-cost">
                        <div className="cost-row">
                            <span>Device Cost</span>
                            <span className="cost-value">{formatCurrency(impact.costOneTime)}</span>
                        </div>
                        <div className="cost-row">
                            <span>Filter Replacement</span>
                            <span className="cost-value">{formatCurrency(impact.filterReplacement)} / 6 months</span>
                        </div>
                    </div>

                    <p className="impact-summary">{impact.impactSummary}</p>
                </div>
            )}
        </div>
    );
};

export default ImpactPopup;
