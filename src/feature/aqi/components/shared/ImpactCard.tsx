// Reusable stats component (e.g., "Liters saved", "CO2 reduced")
// TODO: Implement impact card for displaying sustainability metrics

import React from 'react';

interface ImpactCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  color?: string;
}

export const ImpactCard: React.FC<ImpactCardProps> = ({
  title,
  value,
  unit,
  icon,
  color = '#4CAF50'
}) => {
  return (
    <div className="impact-card" style={{ borderColor: color }}>
      {icon && <span className="impact-icon">{icon}</span>}
      <div className="impact-content">
        <h4 className="impact-title">{title}</h4>
        <p className="impact-value">
          {value}
          {unit && <span className="impact-unit"> {unit}</span>}
        </p>
      </div>
    </div>
  );
};
