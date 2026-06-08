// AQI color thresholds and configuration

export const AQI_LEVELS = {
  GOOD: { max: 50, color: '#00e400', label: 'Good' },
  MODERATE: { max: 100, color: '#ffff00', label: 'Moderate' },
  UNHEALTHY_SENSITIVE: { max: 150, color: '#ff7e00', label: 'Unhealthy for Sensitive' },
  UNHEALTHY: { max: 200, color: '#ff0000', label: 'Very Unhealthy' },
  HAZARDOUS: { max: Infinity, color: '#8f3f97', label: 'Hazardous' },
} as const;

export const HEATMAP_CONFIG = {
  width: 1024,
  height: 1024,
  radius: 180,
  maxValue: 200,
} as const;

export const CAMERA_THRESHOLDS = {
  fadeStartHeight: 15000, // Start fading heatmap at 15km
  fadeEndHeight: 3000,    // Fully hidden at 3km  
  buildingStyleThreshold: 5000, // Switch building style at 5km
} as const;
