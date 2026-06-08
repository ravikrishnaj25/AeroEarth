// Station popup component for AQI details
import React from 'react';
import type { StationData } from '../aqi-types';
import { getAqiInfo } from '../aqi-utils';

interface StationPopupProps {
  station: StationData;
  x: number;
  y: number;
  onClose: () => void;
}

export const StationPopup: React.FC<StationPopupProps> = ({ station, x, y, onClose }) => {
  const info = getAqiInfo(station.aqi);
  
  return (
    <div
      className="station-popup"
      style={{
        left: Math.min(x, window.innerWidth - 280),
        top: Math.min(y, window.innerHeight - 200)
      }}
    >
      <button className="popup-close" onClick={onClose}>×</button>
      <h4>{station.name}</h4>
      <div className="popup-content">
        <div className="popup-aqi" style={{ backgroundColor: info.cssColor }}>
          <span className="aqi-value">{station.aqi}</span>
          <span className="aqi-label">AQI</span>
        </div>
        <div className="popup-details">
          <p><strong>Category:</strong> {info.category}</p>
          <p><strong>Latitude:</strong> {station.latitude.toFixed(4)}°</p>
          <p><strong>Longitude:</strong> {station.longitude.toFixed(4)}°</p>
          <p><strong>Updated:</strong> {new Date(station.time).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};
