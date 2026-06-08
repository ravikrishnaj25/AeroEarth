// AQI utility functions
import * as Cesium from 'cesium';
import type { AqiInfo } from './aqi-types';

// Get AQI color as RGB values
export function getAqiRGB(aqi: number): [number, number, number] {
  if (aqi <= 50) return [0, 228, 0];       // Good - Green
  if (aqi <= 100) return [255, 255, 0];    // Moderate - Yellow
  if (aqi <= 150) return [255, 126, 0];    // Unhealthy for Sensitive - Orange
  if (aqi <= 200) return [255, 0, 0];      // Very Unhealthy - Red
  return [143, 63, 151];                    // Hazardous - Purple
}

// Get AQI category and color
export function getAqiInfo(aqi: number): AqiInfo {
  if (aqi <= 50) return { category: "Good", color: "green", cssColor: "#00e400" };
  if (aqi <= 100) return { category: "Moderate", color: "yellow", cssColor: "#ffff00" };
  if (aqi <= 150) return { category: "Unhealthy for Sensitive", color: "orange", cssColor: "#ff7e00" };
  if (aqi <= 200) return { category: "Very Unhealthy", color: "red", cssColor: "#ff0000" };
  return { category: "Hazardous", color: "purple", cssColor: "#8f3f97" };
}

export function getCesiumColor(aqi: number): Cesium.Color {
  if (aqi <= 50) return Cesium.Color.fromCssColorString("#00e400");
  if (aqi <= 100) return Cesium.Color.fromCssColorString("#ffff00");
  if (aqi <= 150) return Cesium.Color.fromCssColorString("#ff7e00");
  if (aqi <= 200) return Cesium.Color.fromCssColorString("#ff0000");
  return Cesium.Color.fromCssColorString("#8f3f97");
}

// Create heatmap on canvas
export function createHeatmapCanvas(
  width: number,
  height: number,
  data: { x: number; y: number; value: number }[],
  maxValue: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Clear canvas with transparency
  ctx.clearRect(0, 0, width, height);

  // Draw each data point as a radial gradient
  const radius = 180; // Larger radius for smoother blending

  data.forEach(point => {
    const [r, g, b] = getAqiRGB(point.value);
    const intensity = Math.min(point.value / maxValue, 1);

    // Create radial gradient for smooth blending
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius
    );

    // Center is more opaque, edges fade out smoothly
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.6 * intensity})`);
    gradient.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, ${0.45 * intensity})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.3 * intensity})`);
    gradient.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${0.15 * intensity})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas;
}

// Compute bounds from station coordinates with padding
export function computeBounds(stations: { longitude: number; latitude: number }[]) {
  const lons = stations.map(s => s.longitude);
  const lats = stations.map(s => s.latitude);
  const padding = 0.5; // degrees - larger padding for coverage
  return {
    west: Math.min(...lons) - padding,
    east: Math.max(...lons) + padding,
    south: Math.min(...lats) - padding,
    north: Math.max(...lats) + padding,
  };
}
