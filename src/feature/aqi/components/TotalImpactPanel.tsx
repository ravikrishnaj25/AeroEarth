import { Sprout, TreePine, Leaf, Wind, TrendingDown, Banknote, Receipt } from 'lucide-react';
import React from 'react';
import type { TotalImpactSummary } from '../utils/calculations';
import { formatCurrency } from '../utils/calculations';

interface TotalImpactPanelProps {
    summary: TotalImpactSummary;
    onGetQuote?: () => void;
}

export const TotalImpactPanel: React.FC<TotalImpactPanelProps> = ({ summary }) => {
    const hasAnyPlacements = summary.treesPlaced > 0 || summary.gardenAreaM2 > 0 || summary.purifiersPlaced > 0;
    
    if (!hasAnyPlacements) return null;

    return (
        <div className="total-impact-panel">
            <div className="panel-header">
                <h3><Sprout size={18} /> Your Clean-Air Plan</h3>
            </div>
            
            <div className="panel-content">
                {/* Placements Summary */}
                <div className="placement-summary">
                    {summary.treesPlaced > 0 && (
                        <div className="placement-item">
                            <span className="placement-icon"><TreePine size={18} /></span>
                            <span className="placement-label">Trees placed</span>
                            <span className="placement-value">{summary.treesPlaced}</span>
                        </div>
                    )}
                    {summary.gardenAreaM2 > 0 && (
                        <div className="placement-item">
                            <span className="placement-icon"><Leaf size={18} /></span>
                            <span className="placement-label">Vertical garden</span>
                            <span className="placement-value">{summary.gardenAreaM2} m²</span>
                        </div>
                    )}
                    {summary.purifiersPlaced > 0 && (
                        <div className="placement-item">
                            <span className="placement-icon"><Wind size={18} /></span>
                            <span className="placement-label">Purifiers</span>
                            <span className="placement-value">{summary.purifiersPlaced}</span>
                        </div>
                    )}
                </div>
                
                {/* Impact Stats */}
                <div className="impact-metrics">
                    {summary.totalAqiImprovement > 0 && (
                        <div className="metric-card primary">
                            <span className="metric-icon"><TrendingDown size={18} /></span>
                            <div className="metric-content">
                                <span className="metric-value">-{summary.totalAqiImprovement}</span>
                                <span className="metric-label">Estimated AQI improvement</span>
                            </div>
                        </div>
                    )}
                    
                    {summary.totalPm25Reduction > 0 && (
                        <div className="metric-card">
                            <span className="metric-icon"><Wind size={18} /></span>
                            <div className="metric-content">
                                <span className="metric-value">-{summary.totalPm25Reduction.toFixed(1)}</span>
                                <span className="metric-label">PM2.5 µg/m³ reduced</span>
                            </div>
                        </div>
                    )}
                    
                    {summary.co2OffsetKgYear > 0 && (
                        <div className="metric-card eco">
                            <span className="metric-icon"><Sprout size={18} /></span>
                            <div className="metric-content">
                                <span className="metric-value">{summary.co2OffsetKgYear}</span>
                                <span className="metric-label">CO₂ offset kg/year</span>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Cost Summary */}
                <div className="cost-summary">
                    <div className="cost-item total">
                        <span className="cost-label"><Banknote size={18} /> Total cost</span>
                        <span className="cost-value">{formatCurrency(summary.totalCost)}</span>
                    </div>
                    <div className="cost-item">
                        <span className="cost-label"><Receipt size={18} /> Monthly maintenance</span>
                        <span className="cost-value">{formatCurrency(Math.round(summary.monthlyMaintenance))}</span>
                    </div>
                </div>
                

            </div>
        </div>
    );
};

export default TotalImpactPanel;
