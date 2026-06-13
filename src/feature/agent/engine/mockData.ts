import type { ZoneState } from './types';

export const MOCK_ZONES: ZoneState[] = [
  {
    id: 'chennai-north',
    name: 'Chennai North (Industrial)',
    lat: 13.16,
    lng: 80.25,
    aqi: 182, // High pollution
    waterQuality: 42, // Poor water
    solarIrradiance: 5.8, // Good solar
    humidity: 78,
    temperature: 32,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'bengaluru-east',
    name: 'Bengaluru East (Tech Corridor)',
    lat: 12.97,
    lng: 77.71,
    aqi: 88, // Moderate pollution
    waterQuality: 65, // Moderate water
    solarIrradiance: 5.2, // Good solar
    humidity: 55,
    temperature: 28,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'hyderabad-central',
    name: 'Hyderabad Central (High Density)',
    lat: 17.38,
    lng: 78.48,
    aqi: 145, // Elevated pollution
    waterQuality: 55, // Moderate water
    solarIrradiance: 6.1, // Excellent solar
    humidity: 45,
    temperature: 34,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'kochi-marine',
    name: 'Kochi Marine (Coastal Zone)',
    lat: 9.97,
    lng: 76.25,
    aqi: 45, // Clean air
    waterQuality: 35, // Low water score due to runoff/salinity
    solarIrradiance: 4.8, // Moderate solar
    humidity: 85,
    temperature: 30,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'coimbatore-industrial',
    name: 'Coimbatore Industrial',
    lat: 11.01,
    lng: 76.95,
    aqi: 155, // High pollution
    waterQuality: 58, // Moderate water
    solarIrradiance: 5.6, // Good solar
    humidity: 62,
    temperature: 31,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'chennai-south',
    name: 'Chennai South (Residential)',
    lat: 12.98,
    lng: 80.22,
    aqi: 92, // Moderate pollution
    waterQuality: 70, // Decent water
    solarIrradiance: 5.7, // Good solar
    humidity: 75,
    temperature: 30,
    timestamp: new Date().toISOString(),
  }
];

export const MOCK_LLM_REASONING: Record<string, {
  PLANT_TREES: string;
  WATER_CONSERVATION: string;
  SOLAR_ADOPTION: string;
  MONITOR: string;
}> = {
  'chennai-north': {
    PLANT_TREES: `**Agent Analysis for Chennai North (Industrial):**
- **Trigger**: Ingested AQI = 182, exceeding the critical threshold of 150.
- **Root Cause**: Heavy emissions from industrial hubs, combined with low urban canopy cover.
- **Evaluation**: Planting trees is identified as the most effective long-term localized mitigation strategy to trap particulate matter (PM2.5 and PM10).
- **Decision**: Initiate a Citizen Quest to plant **250 native saplings** (e.g., Neem, Pongamia) in the industrial buffer zone.
- **Impact Forecast**: Expected to reduce localized PM2.5 concentrations by ~15-20% over 18 months, resulting in an estimated AQI reduction of 28 points.`,
    WATER_CONSERVATION: `**Agent Analysis for Chennai North (Industrial):**
- **Trigger**: Ingested water quality score = 42, indicating severe industrial runoff contamination.
- **Decision**: Deploy Bio-filtration Floating Islands in surrounding water bodies.
- **Impact Forecast**: Expected water quality improvement of +18 points.`,
    SOLAR_ADOPTION: `**Agent Analysis for Chennai North (Industrial):**
- **Trigger**: Solar irradiance = 5.8 kWh/m^2/day.
- **Decision**: Subsidize commercial rooftop solar panels for high-energy manufacturing plants.
- **Impact Forecast**: Daily clean energy production of ~1,200 kWh.`,
    MONITOR: `**Agent Analysis for Chennai North (Industrial):**
- **Metrics**: Stable metrics.
- **Decision**: Maintain current sensor status and log baseline.`
  },
  'bengaluru-east': {
    PLANT_TREES: `**Agent Analysis for Bengaluru East (Tech Corridor):**
- **Trigger**: Moderate AQI of 88, but upward forecast trend due to vehicular congestion.
- **Decision**: Launch micro-forest plantation (Miyawaki method) near outer ring road.
- **Impact Forecast**: Estimated CO2 offset of ~450kg annually.`,
    WATER_CONSERVATION: `**Agent Analysis for Bengaluru East (Tech Corridor):**
- **Trigger**: Water quality score = 65. Lake eutrophication warning detected.
- **Decision**: Partner with housing societies to implement smart rainwater harvesting and greywater recycling.
- **Impact Forecast**: Reduce freshwater withdrawal by 120,000 gallons/month.`,
    SOLAR_ADOPTION: `**Agent Analysis for Bengaluru East (Tech Corridor):**
- **Trigger**: High density of commercial tech parks, Solar irradiance = 5.2 kWh/m^2/day.
- **Decision**: Trigger community-based solar panel drive on corporate IT buildings.
- **Impact Forecast**: Install 400 new smart grid integrated panels, saving 15,000 kWh/month.`,
    MONITOR: `**Agent Analysis for Bengaluru East:**
- **Metrics**: Normal.
- **Decision**: Sensor monitoring active. No intervention needed.`
  },
  'hyderabad-central': {
    PLANT_TREES: `**Agent Analysis for Hyderabad Central:**
- **Trigger**: AQI at 145. Heavy concrete heat island effect.
- **Decision**: Launch vertical gardens and urban forestry drives.
- **Impact Forecast**: Lower ambient temperature by 1.5°C and reduce AQI by 14.`,
    WATER_CONSERVATION: `**Agent Analysis for Hyderabad Central:**
- **Trigger**: Water Quality at 55. High depletion of borewells.
- **Decision**: Implement artificial groundwater recharge structures.
- **Impact Forecast**: +12 improvement in groundwater level and quality index.`,
    SOLAR_ADOPTION: `**Agent Analysis for Hyderabad Central:**
- **Trigger**: Solar Irradiance = 6.1 kWh/m^2/day (High Potential).
- **Decision**: Establish Solar Microgrid quest for residential apartments.
- **Impact Forecast**: Direct offset of coal-fired grid energy.`,
    MONITOR: `**Agent Analysis for Hyderabad Central:**
- **Metrics**: AQI and Water within safety limits. Continuous health check active.`
  },
  'kochi-marine': {
    PLANT_TREES: `**Agent Analysis for Kochi Marine:**
- **Trigger**: Coastal soil erosion and coastal wind speeds.
- **Decision**: Mangrove reforestation along vulnerable coastal borders.
- **Impact Forecast**: Stabilize coastline and boost carbon sequestration by 800kg/year.`,
    WATER_CONSERVATION: `**Agent Analysis for Kochi Marine:**
- **Trigger**: Coastal water quality score = 35 due to plastics and sewage discharge.
- **Decision**: Deploy autonomous plastic cleanup barrier and marine health tracker.
- **Impact Forecast**: Clean 45km of coastal waters, raising water quality score to 58.`,
    SOLAR_ADOPTION: `**Agent Analysis for Kochi Marine:**
- **Trigger**: Marine solar project feasibility.
- **Decision**: Solar floating panels on backwaters.
- **Impact Forecast**: Zero land footprint solar generation.`,
    MONITOR: `**Agent Analysis for Kochi Marine:**
- **Metrics**: Water quality normal. Ongoing monitoring of ocean salinity and marine life.`
  },
  'coimbatore-industrial': {
    PLANT_TREES: `**Agent Analysis for Coimbatore Industrial:**
- **Trigger**: AQI = 155, crossing safe limits.
- **Decision**: Dense green-belt plantation in casting and textile industrial blocks.
- **Impact Forecast**: Expected AQI reduction of 22 points in 12 months.`,
    WATER_CONSERVATION: `**Agent Analysis for Coimbatore Industrial:**
- **Trigger**: Water score = 58. Industrial dye runoff detected.
- **Decision**: Setup localized biological reed beds for natural dye filtration.
- **Impact Forecast**: Prevent heavy metals from entering fresh streams, water score +15.`,
    SOLAR_ADOPTION: `**Agent Analysis for Coimbatore Industrial:**
- **Trigger**: High daylight hours, Solar = 5.6 kWh/m^2/day.
- **Decision**: Setup solar thermal systems for boiler operations in spinning mills.
- **Impact Forecast**: Reduce reliance on oil-fired boilers, clean energy +2,500 kWh.`,
    MONITOR: `**Agent Analysis for Coimbatore Industrial:**
- **Metrics**: Sensor readings normal. No critical alerts triggered.`
  }
};

export const FAKE_TXS = [
  '0x72c3dbf92de31481b3720769cf36de42ff09e05a8120b0805cfd1a3c749ab12a',
  '0xa5cde1837ff29081a28a3f8901b0f191f6305a765e90214a1a5b82cc3941cb82',
  '0x2d8a55b1ffc629810a91e52ab761ee452b61ef2f0931aa570992a2a0174092fc',
  '0x3d0b2f15fa238cc3b0629c4033c4ef01e285a73e4b77f98018449c2a688941cf',
  '0xbcde2a9394628a8d1bb9e525144b207a9ee562b7ff0981aa7a82bcecfd740cba',
  '0x12a9c394c8e7ba4511eeff4579cbe8b209e75c401aa890ba41ea3d726bdfae12',
  '0x9c3bf4d3a2864fbd6041ee2b3ffcde276a165de39832aa7707e46abfe16cfd21',
  '0x87a55cb49f310df6288b8cc29d7ae191e4a3b827ffbc1a63c6218eaee7fcf1e2',
  '0xcd82b4a3952ba5c2a1a8c8ba09d7a28e81fa2c30a84efc629a83ebfe46eef28c',
  '0x41ef8c2abf62dfbc491bbca38cfd2a84b01e3b2e987ac5b82eaae8f16bde412a'
];
