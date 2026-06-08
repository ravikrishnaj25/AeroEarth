// AQI Legend component
import React from 'react';
import { AQI_LEVELS } from '../constants';

export const AqiLegend: React.FC = () => {
  return (
    <div className="legend">
      <h3>Air Quality Index</h3>
      <div className="legend-item">
        <span className="legend-color" style={{ backgroundColor: AQI_LEVELS.GOOD.color }}></span>
        <span>0-{AQI_LEVELS.GOOD.max}: {AQI_LEVELS.GOOD.label}</span>
      </div>
      <div className="legend-item">
        <span className="legend-color" style={{ backgroundColor: AQI_LEVELS.MODERATE.color }}></span>
        <span>{AQI_LEVELS.GOOD.max + 1}-{AQI_LEVELS.MODERATE.max}: {AQI_LEVELS.MODERATE.label}</span>
      </div>
      <div className="legend-item">
        <span className="legend-color" style={{ backgroundColor: AQI_LEVELS.UNHEALTHY_SENSITIVE.color }}></span>
        <span>{AQI_LEVELS.MODERATE.max + 1}-{AQI_LEVELS.UNHEALTHY_SENSITIVE.max}: Unhealthy (Sensitive)</span>
      </div>
      <div className="legend-item">
        <span className="legend-color" style={{ backgroundColor: AQI_LEVELS.UNHEALTHY.color }}></span>
        <span>{AQI_LEVELS.UNHEALTHY_SENSITIVE.max + 1}-{AQI_LEVELS.UNHEALTHY.max}: {AQI_LEVELS.UNHEALTHY.label}</span>
      </div>
      <div className="legend-item">
        <span className="legend-color" style={{ backgroundColor: AQI_LEVELS.HAZARDOUS.color }}></span>
        <span>{AQI_LEVELS.UNHEALTHY.max + 1}+: {AQI_LEVELS.HAZARDOUS.label}</span>
      </div>
    </div>
  );
};
