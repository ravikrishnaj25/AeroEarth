import { useEffect, useRef, useState, useCallback } from 'react';
import 'normalize.css';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium';
import './AqiCesium.css';
import { Toolbox } from './components/shared/Toolbox';
import { ImpactPopup } from './components/ImpactPopup';
import { TotalImpactPanel } from './components/TotalImpactPanel';
import { ImmersiveVRScene, VRButton } from '../../components/vr';
import { useTour, TourOverlay } from '../../components/tour';
import type { TourStep } from '../../components/tour';
import BlockchainLoader from '../../components/BlockchainLoader';
import { 
  estimateTreeImpact, 
  estimateGardenImpact, 
  estimatePurifierImpact, 
  calculateTotalImpact,
  type ImpactData 
} from './utils/calculations';

const ACCESS_TOKEN = import.meta.env.VITE_CESIUM_ACCESS_TOKEN;
Cesium.Ion.defaultAccessToken = ACCESS_TOKEN;

// Station data from API - South India
const apiResponse = {
  "status": "ok",
  "data": [
    // Chennai stations
    { "lat": 13.1036, "lon": 80.2909, "uid": 13737, "aqi": "158", "station": { "name": "Royapuram, Chennai", "time": "2026-01-29T13:30:00+09:00" } },
    { "lat": 12.9533, "lon": 80.2357, "uid": 13738, "aqi": "154", "station": { "name": "Perungudi, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.4127, "lon": 80.1081, "uid": 13807, "aqi": "170", "station": { "name": "Anthoni Pillai Nagar, Gummidipoondi", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.164544, "lon": 80.26285, "uid": 8185, "aqi": "173", "station": { "name": "Manali, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0052189, "lon": 80.2398125, "uid": 11279, "aqi": "159", "station": { "name": "Velachery Res. Area, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0664, "lon": 80.2112, "uid": 13740, "aqi": "154", "station": { "name": "Arumbakkam, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.1278, "lon": 80.2642, "uid": 13739, "aqi": "157", "station": { "name": "Kodungaiyur, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0827, "lon": 80.2707, "uid": 13741, "aqi": "145", "station": { "name": "Anna Nagar, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0569, "lon": 80.2425, "uid": 13742, "aqi": "162", "station": { "name": "T. Nagar, Chennai", "time": "2026-01-29T15:30:00+09:00" } },

    // Coimbatore stations
    { "lat": 11.0168, "lon": 76.9558, "uid": 14001, "aqi": "78", "station": { "name": "SIDCO, Coimbatore", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 10.9925, "lon": 76.9614, "uid": 14002, "aqi": "65", "station": { "name": "RS Puram, Coimbatore", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 11.0246, "lon": 77.0028, "uid": 14003, "aqi": "72", "station": { "name": "Gandhipuram, Coimbatore", "time": "2026-01-29T15:30:00+09:00" } },

    // Madurai stations
    { "lat": 9.9252, "lon": 78.1198, "uid": 14101, "aqi": "89", "station": { "name": "Meenakshi Temple Area, Madurai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 9.9399, "lon": 78.1213, "uid": 14102, "aqi": "95", "station": { "name": "Periyar Bus Stand, Madurai", "time": "2026-01-29T15:30:00+09:00" } },

    // Trichy stations
    { "lat": 10.7905, "lon": 78.7047, "uid": 14201, "aqi": "68", "station": { "name": "Srirangam, Trichy", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 10.8155, "lon": 78.6965, "uid": 14202, "aqi": "74", "station": { "name": "Central Bus Stand, Trichy", "time": "2026-01-29T15:30:00+09:00" } },

    // Salem station
    { "lat": 11.6643, "lon": 78.1460, "uid": 14301, "aqi": "82", "station": { "name": "Steel Plant Area, Salem", "time": "2026-01-29T15:30:00+09:00" } },

    // Tirunelveli station
    { "lat": 8.7139, "lon": 77.7567, "uid": 14401, "aqi": "45", "station": { "name": "Palayamkottai, Tirunelveli", "time": "2026-01-29T15:30:00+09:00" } },

    // Vellore station
    { "lat": 12.9165, "lon": 79.1325, "uid": 14501, "aqi": "98", "station": { "name": "CMC Area, Vellore", "time": "2026-01-29T15:30:00+09:00" } },

    // Pondicherry stations
    { "lat": 11.9416, "lon": 79.8083, "uid": 14601, "aqi": "52", "station": { "name": "White Town, Puducherry", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 11.9139, "lon": 79.8145, "uid": 14602, "aqi": "58", "station": { "name": "Lawspet, Puducherry", "time": "2026-01-29T15:30:00+09:00" } },

    // Bangalore stations (Karnataka)
    { "lat": 12.9716, "lon": 77.5946, "uid": 15001, "aqi": "112", "station": { "name": "MG Road, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 12.9352, "lon": 77.6245, "uid": 15002, "aqi": "125", "station": { "name": "BTM Layout, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0358, "lon": 77.5970, "uid": 15003, "aqi": "118", "station": { "name": "Hebbal, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 12.9141, "lon": 77.6411, "uid": 15004, "aqi": "135", "station": { "name": "Silk Board, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 12.9783, "lon": 77.6408, "uid": 15005, "aqi": "108", "station": { "name": "Indiranagar, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },

    // Mysore station
    { "lat": 12.2958, "lon": 76.6394, "uid": 15101, "aqi": "55", "station": { "name": "Palace Area, Mysuru", "time": "2026-01-29T15:30:00+09:00" } },

    // Hyderabad stations (Telangana)
    { "lat": 17.3850, "lon": 78.4867, "uid": 16001, "aqi": "142", "station": { "name": "Charminar, Hyderabad", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 17.4400, "lon": 78.3489, "uid": 16002, "aqi": "128", "station": { "name": "HITEC City, Hyderabad", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 17.4239, "lon": 78.4738, "uid": 16003, "aqi": "138", "station": { "name": "Secunderabad, Hyderabad", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 17.4156, "lon": 78.4347, "uid": 16004, "aqi": "145", "station": { "name": "Kukatpally, Hyderabad", "time": "2026-01-29T15:30:00+09:00" } },

    // Kochi stations (Kerala)
    { "lat": 9.9312, "lon": 76.2673, "uid": 17001, "aqi": "42", "station": { "name": "Fort Kochi", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 9.9816, "lon": 76.2999, "uid": 17002, "aqi": "48", "station": { "name": "Ernakulam South, Kochi", "time": "2026-01-29T15:30:00+09:00" } },

    // Thiruvananthapuram stations
    { "lat": 8.5241, "lon": 76.9366, "uid": 17101, "aqi": "38", "station": { "name": "Technopark, Thiruvananthapuram", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 8.4875, "lon": 76.9525, "uid": 17102, "aqi": "35", "station": { "name": "Kovalam, Thiruvananthapuram", "time": "2026-01-29T15:30:00+09:00" } },

    // Visakhapatnam stations (Andhra Pradesh)
    { "lat": 17.6868, "lon": 83.2185, "uid": 18001, "aqi": "95", "station": { "name": "Beach Road, Visakhapatnam", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 17.7231, "lon": 83.3013, "uid": 18002, "aqi": "115", "station": { "name": "Steel Plant, Visakhapatnam", "time": "2026-01-29T15:30:00+09:00" } },

    // Vijayawada station
    { "lat": 16.5062, "lon": 80.6480, "uid": 18101, "aqi": "88", "station": { "name": "Benz Circle, Vijayawada", "time": "2026-01-29T15:30:00+09:00" } },

    // Tirupati station
    { "lat": 13.6288, "lon": 79.4192, "uid": 18201, "aqi": "62", "station": { "name": "Temple Area, Tirupati", "time": "2026-01-29T15:30:00+09:00" } },
  ]
};

// Process and filter valid AQI data
interface StationData {
  name: string;
  latitude: number;
  longitude: number;
  aqi: number;
  time: string;
  uid: number;
  position: Cesium.Cartesian3;
}

const aqiData: StationData[] = apiResponse.data
  .filter((station) => station.aqi !== "-")
  .map((station) => ({
    name: station.station.name,
    latitude: station.lat,
    longitude: station.lon,
    aqi: parseInt(station.aqi),
    time: station.station.time,
    uid: station.uid,
    position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat),
  }));

// Compute bounds from station coordinates with padding
const computeBounds = () => {
  const lons = aqiData.map(s => s.longitude);
  const lats = aqiData.map(s => s.latitude);
  const padding = 0.5; // degrees - larger padding for South India coverage
  return {
    west: Math.min(...lons) - padding,
    east: Math.max(...lons) + padding,
    south: Math.min(...lats) - padding,
    north: Math.max(...lats) + padding,
  };
};

// Get AQI color as RGB values
function getAqiRGB(aqi: number): [number, number, number] {
  if (aqi <= 50) return [0, 228, 0];       // Good - Green
  if (aqi <= 100) return [255, 255, 0];    // Moderate - Yellow
  if (aqi <= 150) return [255, 126, 0];    // Unhealthy for Sensitive - Orange
  if (aqi <= 200) return [255, 0, 0];      // Very Unhealthy - Red
  return [143, 63, 151];                    // Hazardous - Purple
}

// Create heatmap on canvas
function createHeatmapCanvas(
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

// Get AQI category and color
function getAqiInfo(aqi: number): { category: string; color: string; cssColor: string } {
  if (aqi <= 50) return { category: "Good", color: "green", cssColor: "#00e400" };
  if (aqi <= 100) return { category: "Moderate", color: "yellow", cssColor: "#ffff00" };
  if (aqi <= 150) return { category: "Unhealthy for Sensitive", color: "orange", cssColor: "#ff7e00" };
  if (aqi <= 200) return { category: "Very Unhealthy", color: "red", cssColor: "#ff0000" };
  return { category: "Hazardous", color: "purple", cssColor: "#8f3f97" };
}

function getCesiumColor(aqi: number): Cesium.Color {
  if (aqi <= 50) return Cesium.Color.fromCssColorString("#00e400");
  if (aqi <= 100) return Cesium.Color.fromCssColorString("#ffff00");
  if (aqi <= 150) return Cesium.Color.fromCssColorString("#ff7e00");
  if (aqi <= 200) return Cesium.Color.fromCssColorString("#ff0000");
  return Cesium.Color.fromCssColorString("#8f3f97");
}

interface PopupInfo {
  visible: boolean;
  x: number;
  y: number;
  station: StationData | null;
}

function AqiCesiumApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  const [popup, setPopup] = useState<PopupInfo>({ visible: false, x: 0, y: 0, station: null });
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);
  
  // Impact popup state
  const [currentImpact, setCurrentImpact] = useState<ImpactData | null>(null);
  const [impactPosition, setImpactPosition] = useState<{ x: number; y: number } | null>(null);
  const [allImpacts, setAllImpacts] = useState<ImpactData[]>([]);

  // Wind & Pollution simulation state
  const [showWind, setShowWind] = useState(false);
  const [windSpeed, setWindSpeed] = useState(8.0); // m/s
  const [windDirection, setWindDirection] = useState(45); // degrees
  const [showPollution, setShowPollution] = useState(true);
  const [isVRMode, setIsVRMode] = useState(false);
  const [toolboxOpen, setToolboxOpen] = useState(false);

  // Tour steps for AQI dashboard
  const tourSteps: TourStep[] = [
    {
      target: 'cesium-map',
      title: '3D AQI Map',
      description: 'This is your interactive 3D map showing real-time Air Quality Index data across South India. Buildings are color-coded by AQI levels and station markers show live readings.',
      placement: 'bottom',
    },
    {
      target: 'aqi-legend',
      title: 'AQI Color Legend',
      description: 'This legend shows the AQI color scale — from green (Good) to purple (Hazardous). Use it to understand the color-coding of buildings and station markers.',
      placement: 'right',
    },
    {
      target: 'atmosphere-panel',
      title: 'Atmosphere Simulation',
      description: 'Control atmospheric effects on the map. Toggle wind particles and pollution haze to visualize environmental conditions in real-time.',
      placement: 'right',
    },
    {
      target: 'wind-toggle',
      title: 'Wind Effect',
      description: 'Enable the wind simulation to see dust and particle flow across the map. Adjust wind speed and direction to model different weather patterns.',
      placement: 'right',
      onEnter: () => {
        setShowWind(true);
      },
    },
    {
      target: 'pollution-toggle',
      title: 'Pollution Haze',
      description: 'Toggle the pollution haze overlay to visualize the atmospheric impact of AQI levels. The haze intensity and color adjusts based on average AQI.',
      placement: 'right',
    },
    {
      target: 'eco-toolbox',
      title: 'Eco Toolbox',
      description: 'Open the Eco Toolbox to place sustainability solutions on buildings and streets. Choose from trees, vertical gardens, and air purifiers.',
      placement: 'left',
      onEnter: () => {
        setToolboxOpen(true);
      },
    },
    {
      target: 'tool-tree',
      title: 'Plant a Tree 🌳',
      description: 'Select the tree tool and click on the map to plant a tree. Each tree absorbs ~18 kg CO₂/year and reduces AQI by ~2 points in a 20m radius.',
      placement: 'left',
    },
    {
      target: 'tool-garden',
      title: 'Vertical Garden 🌿',
      description: 'Paint vertical gardens on building walls. They reduce AQI by up to 15 points, drop temperature by ~2°C, and cut noise by ~5 dB.',
      placement: 'left',
    },
    {
      target: 'tool-purifier',
      title: 'Air Purifier 💨',
      description: 'Place indoor air purifiers in buildings. They reduce indoor PM2.5 by up to 86%% with a CADR of 386 m³/hr. Great for high-AQI zones.',
      placement: 'left',
      onLeave: () => {
        setToolboxOpen(false);
      },
    },
  ];

  const tour = useTour({
    steps: tourSteps,
  });

  // Auto-start tour after Cesium loads
  useEffect(() => {
    if (viewer) {
      const timer = setTimeout(() => {
        tour.startTour();
      }, 3000); // wait for Cesium to fully load
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer]);
  
  // Refs for shader access
  const showWindRef = useRef(showWind);
  const windSpeedRef = useRef(windSpeed);
  const windDirectionRef = useRef(windDirection);
  const showPollutionRef = useRef(showPollution);
  const windStageRef = useRef<Cesium.PostProcessStage | null>(null);
  const pollutionStageRef = useRef<Cesium.PostProcessStage | null>(null);

  // Keep refs in sync
  useEffect(() => {
    showWindRef.current = showWind;
    windSpeedRef.current = windSpeed;
    windDirectionRef.current = windDirection;
    showPollutionRef.current = showPollution;
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.requestRender();
    }
  }, [showWind, windSpeed, windDirection, showPollution]);

  // Handle placement completed events from PlacementManager
  const handlePlacementCompleted = useCallback((event: CustomEvent<{ 
    tool: string; 
    screenPosition: { x: number; y: number } | null;
    areaM2?: number;
  }>) => {
    const { tool, screenPosition, areaM2 } = event.detail;
    
    let impact: ImpactData | null = null;
    
    if (tool === 'tree') {
      impact = estimateTreeImpact();
    } else if (tool === 'garden') {
      impact = estimateGardenImpact(areaM2 || 15);
    } else if (tool === 'purifier') {
      impact = estimatePurifierImpact();
    }
    
    if (impact) {
      setCurrentImpact(impact);
      setImpactPosition(screenPosition);
      setAllImpacts(prev => [...prev, impact!]);
      
      // Auto-hide popup after 5 seconds
      setTimeout(() => {
        setCurrentImpact(null);
        setImpactPosition(null);
      }, 5000);
    }
  }, []);

  // Listen for placement events
  useEffect(() => {
    window.addEventListener('placement-completed', handlePlacementCompleted as EventListener);
    return () => {
      window.removeEventListener('placement-completed', handlePlacementCompleted as EventListener);
    };
  }, [handlePlacementCompleted]);

  // Listen for VR mode exit to restore shaders
  useEffect(() => {
    const handleVRModeExit = () => {
      console.log('[AqiCesiumApp] VR mode exited, restoring shaders');
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        const v = viewerRef.current;
        // Recalculate average AQI
        const avgAqi = aqiData.reduce((sum, s) => sum + s.aqi, 0) / aqiData.length;
        
        // Recreate shaders (they were removed during VR optimization)
        try {
          // Only recreate if they don't exist
          if (!windStageRef.current || v.scene.postProcessStages.length === 0) {
            createWindStage(v);
            createPollutionStage(v, avgAqi);
          }
        } catch (e) {
          console.warn('[AqiCesiumApp] Could not restore shaders:', e);
        }
      }
      setIsVRMode(false);
    };

    window.addEventListener('vr-mode-exit', handleVRModeExit);
    return () => {
      window.removeEventListener('vr-mode-exit', handleVRModeExit);
    };
  }, []);

  const closeImpactPopup = useCallback(() => {
    setCurrentImpact(null);
    setImpactPosition(null);
  }, []);

  const handleGetQuote = useCallback(() => {
    alert('Quote request submitted! Our team will contact you shortly.');
  }, []);

  // Create Wind Particle Shader
  const createWindStage = (viewer: Cesium.Viewer) => {
    const fragmentShader = `
      uniform sampler2D colorTexture;
      uniform float windSpeed;
      uniform float windDirection;
      uniform float intensity;
      
      in vec2 v_textureCoordinates;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main(void) {
        float time = czm_frameNumber / 60.0;
        vec2 resolution = czm_viewport.zw;
        vec2 uv = gl_FragCoord.xy / resolution;
        
        // Wind direction in radians
        float angle = windDirection * 3.14159 / 180.0;
        vec2 windDir = vec2(cos(angle), sin(angle));
        
        // Create streaming dust particles
        vec2 movingUV = uv * 20.0 - windDir * time * windSpeed * 0.5;
        float dust = noise(movingUV) * noise(movingUV * 2.0 + time);
        dust = pow(dust, 3.0) * 0.3;
        
        // Streaky wind lines
        float streak = noise(vec2(uv.x * 100.0 + time * windSpeed, uv.y * 5.0));
        streak = pow(streak, 8.0) * 0.15;
        
        vec3 windColor = vec3(0.8, 0.75, 0.65) * (dust + streak) * intensity;
        
        vec4 originalColor = texture(colorTexture, v_textureCoordinates);
        out_FragColor = vec4(originalColor.rgb + windColor, originalColor.a);
      }
    `;

    const stage = new Cesium.PostProcessStage({
      name: "wind_effect",
      fragmentShader: fragmentShader,
      uniforms: {
        windSpeed: () => windSpeedRef.current,
        windDirection: () => windDirectionRef.current,
        intensity: () => (showWindRef.current ? 1.0 : 0.0),
      },
    });

    viewer.scene.postProcessStages.add(stage);
    windStageRef.current = stage;
  };

  // Create Pollution Haze Shader
  const createPollutionStage = (viewer: Cesium.Viewer, avgAqi: number) => {
    const fragmentShader = `
      uniform sampler2D colorTexture;
      uniform float aqiLevel;
      uniform float intensity;
      
      in vec2 v_textureCoordinates;

      vec3 getAqiColor(float aqi) {
        if (aqi <= 50.0) return vec3(0.0, 0.9, 0.0);       // Good - Green
        if (aqi <= 100.0) return vec3(1.0, 1.0, 0.0);      // Moderate - Yellow
        if (aqi <= 150.0) return vec3(1.0, 0.5, 0.0);      // Unhealthy Sensitive - Orange
        if (aqi <= 200.0) return vec3(1.0, 0.0, 0.0);      // Very Unhealthy - Red
        return vec3(0.56, 0.25, 0.6);                       // Hazardous - Purple
      }

      void main(void) {
        vec4 originalColor = texture(colorTexture, v_textureCoordinates);
        
        if (intensity < 0.01) {
          out_FragColor = originalColor;
          return;
        }
        
        vec3 pollutionColor = getAqiColor(aqiLevel);
        float hazeAmount = clamp(aqiLevel / 400.0, 0.0, 0.35) * intensity;
        
        // Add slight desaturation for pollution effect
        float gray = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 desaturated = mix(originalColor.rgb, vec3(gray), hazeAmount * 0.5);
        
        // Blend with pollution color
        vec3 finalColor = mix(desaturated, pollutionColor, hazeAmount * 0.4);
        
        out_FragColor = vec4(finalColor, originalColor.a);
      }
    `;

    const stage = new Cesium.PostProcessStage({
      name: "pollution_haze",
      fragmentShader: fragmentShader,
      uniforms: {
        aqiLevel: () => avgAqi,
        intensity: () => (showPollutionRef.current ? 1.0 : 0.0),
      },
    });

    viewer.scene.postProcessStages.add(stage);
    pollutionStageRef.current = stage;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const initializeCesium = async () => {
      // Create Cesium viewer with world terrain
      const viewer = new Cesium.Viewer(containerRef.current!, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        baseLayerPicker: true,
        geocoder: true,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: true,
        animation: false,
        timeline: false,
        fullscreenButton: true,
      });

      viewerRef.current = viewer;
      setViewer(viewer); // Store viewer in state for Toolbox
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
      }

      // Add 3D OSM Buildings with AQI-based coloring
      let osmBuildingsTileset: Cesium.Cesium3DTileset | null = null;
      try {
        osmBuildingsTileset = await Cesium.createOsmBuildingsAsync();
        viewer.scene.primitives.add(osmBuildingsTileset);

        // Build dynamic style conditions based on station data
        // Group stations by approximate regions and get average AQI
        const getAqiColorCondition = (aqi: number): string => {
          if (aqi <= 50) return "color('rgba(0, 228, 0, 0.7)')";
          if (aqi <= 100) return "color('rgba(255, 255, 0, 0.7)')";
          if (aqi <= 150) return "color('rgba(255, 126, 0, 0.7)')";
          if (aqi <= 200) return "color('rgba(255, 0, 0, 0.7)')";
          return "color('rgba(143, 63, 151, 0.7)')";
        };

        // Create conditions for each station area (using lat/lon boxes)
        const buildingConditions: [string, string][] = aqiData.map(station => {
          const latMin = station.latitude - 0.1;
          const latMax = station.latitude + 0.1;
          const lonMin = station.longitude - 0.1;
          const lonMax = station.longitude + 0.1;
          const condition = `\${feature['cesium#latitude']} > ${latMin} && \${feature['cesium#latitude']} < ${latMax} && \${feature['cesium#longitude']} > ${lonMin} && \${feature['cesium#longitude']} < ${lonMax}`;
          return [condition, getAqiColorCondition(station.aqi)];
        });

        // Add default condition
        buildingConditions.push(["true", "color('rgba(200, 200, 200, 0.6)')"]);

        // Style buildings with AQI colors based on their location
        osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: buildingConditions
          }
        });

        console.log('3D OSM Buildings loaded with AQI styling');

        // Calculate average AQI for pollution shader
        const avgAqi = aqiData.reduce((sum, s) => sum + s.aqi, 0) / aqiData.length;

        // Initialize wind and pollution shaders
        createWindStage(viewer);
        createPollutionStage(viewer, avgAqi);
      } catch (err) {
        console.error('Failed to load 3D buildings:', err);
      }

      // Function to update building style based on zoom level
      const updateBuildingStyle = (showAqiColors: boolean) => {
        if (!osmBuildingsTileset) return;

        if (showAqiColors) {
          // AQI-colored buildings when zoomed out
          const getAqiColorCondition = (aqi: number): string => {
            if (aqi <= 50) return "color('rgba(0, 228, 0, 0.7)')";
            if (aqi <= 100) return "color('rgba(255, 255, 0, 0.7)')";
            if (aqi <= 150) return "color('rgba(255, 126, 0, 0.7)')";
            if (aqi <= 200) return "color('rgba(255, 0, 0, 0.7)')";
            return "color('rgba(143, 63, 151, 0.7)')";
          };

          const buildingConditions: [string, string][] = aqiData.map(station => {
            const latMin = station.latitude - 0.1;
            const latMax = station.latitude + 0.1;
            const lonMin = station.longitude - 0.1;
            const lonMax = station.longitude + 0.1;
            const condition = `\${feature['cesium#latitude']} > ${latMin} && \${feature['cesium#latitude']} < ${latMax} && \${feature['cesium#longitude']} > ${lonMin} && \${feature['cesium#longitude']} < ${lonMax}`;
            return [condition, getAqiColorCondition(station.aqi)];
          });
          buildingConditions.push(["true", "color('rgba(200, 200, 200, 0.6)')"]);

          osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
            color: {
              conditions: buildingConditions
            }
          });
        } else {
          // Original building colors when zoomed in close
          osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
            color: "color('white')"
          });
        }
      };

      // Compute bounds from station data
      const bounds = computeBounds();

      // Create heatmap using custom canvas renderer
      const heatmapWidth = 1024;
      const heatmapHeight = 1024;

      // Convert geographic coordinates to heatmap pixel coordinates
      const lonRange = bounds.east - bounds.west;
      const latRange = bounds.north - bounds.south;

      // Prepare heatmap data with pixel coordinates
      const heatmapData = aqiData.map(station => {
        const x = Math.round(((station.longitude - bounds.west) / lonRange) * heatmapWidth);
        const y = Math.round(((bounds.north - station.latitude) / latRange) * heatmapHeight);
        console.log(`Station ${station.name}: pixel (${x}, ${y}), AQI: ${station.aqi}`);
        return { x, y, value: station.aqi };
      });

      // Create heatmap canvas
      const heatmapCanvas = createHeatmapCanvas(heatmapWidth, heatmapHeight, heatmapData, 200);
      const imageUrl = heatmapCanvas.toDataURL('image/png');
      console.log('Heatmap image created, URL length:', imageUrl.length);

      // Add heatmap as a ground overlay using SingleTileImageryProvider
      let heatmapLayer: Cesium.ImageryLayer | null = null;
      try {
        const heatmapProvider = await Cesium.SingleTileImageryProvider.fromUrl(imageUrl, {
          rectangle: Cesium.Rectangle.fromDegrees(
            bounds.west,
            bounds.south,
            bounds.east,
            bounds.north
          ),
        });

        heatmapLayer = viewer.imageryLayers.addImageryProvider(heatmapProvider);
        heatmapLayer.alpha = 0.5; // Initial opacity
        console.log('Heatmap layer added successfully');
      } catch (err) {
        console.error('Failed to add heatmap layer:', err);
      }

      // Adjust heatmap visibility based on camera height
      // Fade out heatmap when zooming in close to see buildings
      let lastBuildingStyleState = true; // Track if AQI colors are shown

      const updateHeatmapVisibility = () => {
        const cameraHeight = viewer.camera.positionCartographic.height;

        // Define height thresholds for heatmap visibility
        const fadeStartHeight = 15000; // Start fading at 15km
        const fadeEndHeight = 3000;    // Fully hidden at 3km
        const buildingStyleThreshold = 5000; // Switch building style at 5km

        // Update heatmap alpha
        if (heatmapLayer) {
          if (cameraHeight > fadeStartHeight) {
            // Fully visible when high up
            heatmapLayer.alpha = 0.5;
          } else if (cameraHeight < fadeEndHeight) {
            // Hidden when close to ground
            heatmapLayer.alpha = 0;
          } else {
            // Gradual fade between thresholds
            const fadeRatio = (cameraHeight - fadeEndHeight) / (fadeStartHeight - fadeEndHeight);
            heatmapLayer.alpha = 0.5 * fadeRatio;
          }
        }

        // Update building style based on zoom level
        const shouldShowAqiColors = cameraHeight > buildingStyleThreshold;
        if (shouldShowAqiColors !== lastBuildingStyleState) {
          updateBuildingStyle(shouldShowAqiColors);
          lastBuildingStyleState = shouldShowAqiColors;
        }
      };

      // Listen to camera changes
      viewer.camera.changed.addEventListener(updateHeatmapVisibility);
      // Also update on move end for smoother experience
      viewer.camera.moveEnd.addEventListener(updateHeatmapVisibility);

      // Add clickable station markers
      aqiData.forEach((station) => {
        const color = getCesiumColor(station.aqi);
        const info = getAqiInfo(station.aqi);

        // Add point marker - bigger and bolder
        viewer.entities.add({
          id: `station-${station.uid}`,
          position: Cesium.Cartesian3.fromDegrees(station.longitude, station.latitude, 100),
          point: {
            pixelSize: 18,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 3,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `${station.name}\nAQI: ${station.aqi}`,
            font: 'bold 16px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 3,
            outlineColor: Cesium.Color.BLACK,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(5000, 1.0, 200000, 0.4),
            translucencyByDistance: new Cesium.NearFarScalar(5000, 1.0, 300000, 0.0),
          },
          properties: {
            stationData: station,
            aqiCategory: info.category,
          },
        });
      });

      // Helper function to get AQI color for a location based on nearest station
      const getAqiColorForLocation = (latitude: number): string => {
        if (latitude > 13.35) return 'rgba(255, 0, 0, 0.9)'; // Gummidipoondi - AQI 170
        if (latitude > 13.12) return 'rgba(255, 0, 0, 0.9)'; // Manali area - AQI 173
        if (latitude > 13.08) return 'rgba(255, 0, 0, 0.85)'; // Royapuram - AQI 158
        if (latitude > 13.0) return 'rgba(255, 0, 0, 0.8)'; // Arumbakkam - AQI 154
        return 'rgba(255, 0, 0, 0.8)'; // Velachery/Perungudi - AQI 154-159
      };

      // Track highlighted building
      let highlightedFeature: Cesium.Cesium3DTileFeature | null = null;
      let originalColor: Cesium.Color | null = null;

      // Click handler for station details popup and building highlighting
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pickedObject = viewer.scene.pick(click.position);

        // Reset previously highlighted building
        if (highlightedFeature && originalColor) {
          highlightedFeature.color = originalColor;
          highlightedFeature = null;
          originalColor = null;
        }

        if (Cesium.defined(pickedObject)) {
          // Check if it's a station marker
          if (pickedObject.id && pickedObject.id.properties) {
            const stationData = pickedObject.id.properties.stationData?.getValue(Cesium.JulianDate.now());

            if (stationData) {
              setPopup({
                visible: true,
                x: click.position.x,
                y: click.position.y,
                station: stationData,
              });
              return;
            }
          }

          // Check if it's a 3D building tile
          if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
            const feature = pickedObject as Cesium.Cesium3DTileFeature;

            // Get building location to determine AQI zone
            const latitude = feature.getProperty('cesium#latitude') as number;

            if (latitude) {
              // Store original color and highlight with AQI color
              originalColor = feature.color.clone();
              highlightedFeature = feature;

              const aqiColorStr = getAqiColorForLocation(latitude);
              feature.color = Cesium.Color.fromCssColorString(aqiColorStr);
            }

            setPopup({ visible: false, x: 0, y: 0, station: null });
          } else {
            setPopup({ visible: false, x: 0, y: 0, station: null });
          }
        } else {
          setPopup({ visible: false, x: 0, y: 0, station: null });
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Close popup on right-click or camera move
      handler.setInputAction(() => {
        setPopup({ visible: false, x: 0, y: 0, station: null });
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      viewer.camera.moveEnd.addEventListener(() => {
        setPopup(prev => prev.visible ? { ...prev, visible: false } : prev);
      });

      // Fly camera to fit all stations
      viewer.camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(
          bounds.west,
          bounds.south,
          bounds.east,
          bounds.north
        ),
        duration: 2,
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
      });
    };

    initializeCesium();

    // Cleanup function
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  const closePopup = () => {
    setPopup({ visible: false, x: 0, y: 0, station: null });
  };

  return (
    <div className="app-container">
      <BlockchainLoader dataType="AQI" isReady={!!viewer} />
      <div ref={containerRef} className="cesiumContainer" data-tour="cesium-map" />

      {/* Eco Toolbox for placing trees, gardens, purifiers */}
      <Toolbox viewer={viewer} forceOpen={toolboxOpen} />

      {/* AQI Legend */}
      <div className="legend" data-tour="aqi-legend">
        <h3>Air Quality Index</h3>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#00e400' }}></span>
          <span>0-50: Good</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ffff00' }}></span>
          <span>51-100: Moderate</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ff7e00' }}></span>
          <span>101-150: Unhealthy (Sensitive)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ff0000' }}></span>
          <span>151-200: Very Unhealthy</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#8f3f97' }}></span>
          <span>201+: Hazardous</span>
        </div>
      </div>

      {/* Atmosphere Simulation Panel */}
      <div className="atmosphere-panel" data-tour="atmosphere-panel">
        <h3>Atmosphere Simulation</h3>
        
        <div className="atmosphere-item" data-tour="wind-toggle">
          <span>Wind Effect</span>
          <button
            onClick={() => {
              const newState = !showWind;
              setShowWind(newState);
              // Play/pause wind audio
              const audio = document.getElementById('wind-audio') as HTMLAudioElement;
              if (audio) {
                if (newState) {
                  audio.volume = Math.min(windSpeed / 20, 1);
                  audio.play();
                } else {
                  audio.pause();
                }
              }
            }}
            className={`atmosphere-toggle ${showWind ? 'active' : ''}`}
          />
        </div>

        {showWind && (
          <div className="atmosphere-slider">
            <label>
              <span>Speed</span>
              <span>{windSpeed.toFixed(0)} m/s</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={windSpeed}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setWindSpeed(val);
                const audio = document.getElementById('wind-audio') as HTMLAudioElement;
                if (audio) audio.volume = Math.min(val / 20, 1);
              }}
            />
            <label>
              <span>Direction</span>
              <span>{windDirection}°</span>
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={windDirection}
              onChange={(e) => setWindDirection(parseFloat(e.target.value))}
            />
          </div>
        )}

        <div className="atmosphere-item" data-tour="pollution-toggle">
          <span>Pollution Haze</span>
          <button
            onClick={() => setShowPollution(!showPollution)}
            className={`atmosphere-toggle ${showPollution ? 'active-orange' : ''}`}
          />
        </div>
      </div>

      {/* Wind Audio Element */}
      <audio id="wind-audio" loop preload="auto">
        <source src="/audio/wind.mp3" type="audio/mpeg" />
      </audio>

      {/* Station Popup */}
      {popup.visible && popup.station && (
        <div
          className="station-popup"
          style={{
            left: Math.min(popup.x, window.innerWidth - 280),
            top: Math.min(popup.y, window.innerHeight - 200)
          }}
        >
          <button className="popup-close" onClick={closePopup}>×</button>
          <h4>{popup.station.name}</h4>
          <div className="popup-content">
            <div className="popup-aqi" style={{ backgroundColor: getAqiInfo(popup.station.aqi).cssColor }}>
              <span className="aqi-value">{popup.station.aqi}</span>
              <span className="aqi-label">AQI</span>
            </div>
            <div className="popup-details">
              <p><strong>Category:</strong> {getAqiInfo(popup.station.aqi).category}</p>
              <p><strong>Latitude:</strong> {popup.station.latitude.toFixed(4)}°</p>
              <p><strong>Longitude:</strong> {popup.station.longitude.toFixed(4)}°</p>
              <p><strong>Updated:</strong> {new Date(popup.station.time).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Impact Popup for placements */}
      <ImpactPopup 
        impact={currentImpact} 
        position={impactPosition} 
        onClose={closeImpactPopup} 
      />

      {/* Total Impact Panel */}
      <TotalImpactPanel 
        summary={calculateTotalImpact(allImpacts)} 
        onGetQuote={handleGetQuote} 
      />

      {/* VR Mode Button */}
      <div className="absolute bottom-5 right-5 z-10">
        <VRButton 
          onEnterVR={() => setIsVRMode(true)}
        />
      </div>

      {/* VR Scene Overlay */}
      {isVRMode && viewer && (
        <ImmersiveVRScene 
          viewer={viewer}
          onExitVR={() => setIsVRMode(false)}
        />
      )}

      {/* Tour Overlay */}
      <TourOverlay
        isActive={tour.isActive}
        isWelcomeScreen={tour.isWelcomeScreen}
        currentStep={tour.currentStep}
        totalSteps={tour.totalSteps}
        currentStepData={tour.currentStepData}
        onNext={tour.nextStep}
        onPrev={tour.prevStep}
        onSkip={tour.skipTour}
        appTitle="AQI Dashboard"
        welcomeSubtitle="Welcome to the Air Quality Intelligence dashboard! Let us walk you through the key features — from wind & pollution effects to eco-friendly tools like planting trees, vertical gardens, and air purifiers."
      />
    </div>
  );
}

export default AqiCesiumApp;