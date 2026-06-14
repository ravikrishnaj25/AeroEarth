/**
 * Building dimensions interface
 */
export interface BuildingDimensions {
  height: number;
  width: number;
  length: number;
}

/**
 * Rain parameters interface
 */
export interface RainParams {
  intensity: number;
  angle: number;
  size: number;
  speed: number;
}

/**
 * Estimates building dimensions from OSM data
 * Uses height and levels to estimate footprint dimensions
 */
export function estimateBuildingDimensions(height: number, levels: number): BuildingDimensions {
  const averageFloorHeight = height / (levels > 0 ? levels : 1);
  // Estimate footprint based on typical building proportions
  const baseWidth = averageFloorHeight * 4 + Math.random() * 5;
  const baseLength = averageFloorHeight * 5 + Math.random() * 8;

  return {
    height: height,
    width: Math.round(baseWidth * 10) / 10,
    length: Math.round(baseLength * 10) / 10
  };
}

/**
 * Calculates roof area from building dimensions
 */
export function calculateRoofArea(dimensions: BuildingDimensions): number {
  return dimensions.width * dimensions.length;
}

/**
 * Estimates roof area based on height and number of levels (legacy support)
 */
export function estimateRoofArea(height: number, levels: number): number {
  const dims = estimateBuildingDimensions(height, levels);
  return calculateRoofArea(dims);
}

/**
 * Calculates a percentage potential based on roof geometry and rain angle
 * Rain angle affects collection efficiency - vertical rain is most efficient
 */
export function calculateWaterHarvestingPotential(
  area: number,
  roofAngle: number = 0,
  rainAngle: number = 0
): number {
  const basePotential = 60;
  const areaEffect = Math.log(area + 1) * 1.5;
  const roofAngleEffect = Math.max(0, 20 - roofAngle / 1.5);

  // Rain angle affects efficiency: steeper angles reduce collection on flat roofs
  const rainAngleEffect = Math.abs(rainAngle) * 5;

  let totalPotential = basePotential + areaEffect + roofAngleEffect - rainAngleEffect;
  totalPotential = Math.min(totalPotential, 95);
  totalPotential = Math.max(totalPotential, 40);
  return Number(totalPotential.toFixed(2));
}

/**
 * Estimates daily water collection in Liters with comprehensive rain parameters
 * Formula considers:
 * - Building roof area (width × length)
 * - Rain intensity (affects rainfall amount)
 * - Rain angle (affects collection efficiency)
 * - Rain size (droplet size affects retention)
 * - Rain speed (affects splash/runoff)
 */
export function calculateDailyLiters(
  potential: number,
  area: number,
  isRaining: boolean,
  intensity: number
): number {
  const baseRainfall = 2.5; // mm per day average
  const rainMultiplier = isRaining ? 1 + intensity * 2.5 : 1;
  const averageDailyRainfall_mm = baseRainfall * rainMultiplier;

  const maxLiters = area * (averageDailyRainfall_mm / 1000) * 1000;
  const collectedLiters = maxLiters * (potential / 100);

  return Math.round(collectedLiters);
}

/**
 * Advanced water calculation with all parameters
 * Returns detailed breakdown of water collection
 */
export function calculateAdvancedWaterCollection(
  dimensions: BuildingDimensions,
  rainParams: RainParams,
  isRaining: boolean,
  roofAngle: number = 0
): {
  roofArea: number;
  potential: number;
  litersPerHour: number;
  litersPerDay: number;
  collectionEfficiency: number;
} {
  const roofArea = calculateRoofArea(dimensions);

  // Base rainfall in mm/hour during rain
  const baseRainfallRate = 5; // mm/hour for moderate rain

  // Intensity multiplier (0.1 to 2.0 range)
  const intensityMultiplier = rainParams.intensity;

  // Angle effect: rain at steeper angles hits less roof surface
  // rainAngle typically -1.5 to 1.5, 0 is vertical
  const angleEfficiency = 1 - Math.abs(rainParams.angle) * 0.2;

  // Droplet size effect: larger droplets (higher size) collect better
  const sizeEfficiency = 0.8 + (rainParams.size * 0.1);

  // Speed effect: too fast rain causes splash loss, optimal around 40-60
  const speedOptimal = 50;
  const speedDeviation = Math.abs(rainParams.speed - speedOptimal) / 100;
  const speedEfficiency = 1 - speedDeviation * 0.15;

  // Roof angle effect on collection
  const roofEfficiency = 1 - (roofAngle / 100);

  // Combined collection efficiency
  const collectionEfficiency = Math.min(
    0.95,
    Math.max(0.3, angleEfficiency * sizeEfficiency * speedEfficiency * roofEfficiency)
  );

  // Potential based on all factors
  const potential = calculateWaterHarvestingPotential(roofArea, roofAngle, rainParams.angle);

  if (!isRaining) {
    return {
      roofArea: Math.round(roofArea),
      potential,
      litersPerHour: 0,
      litersPerDay: 0,
      collectionEfficiency: collectionEfficiency * 100
    };
  }

  // Rainfall rate in mm/hour adjusted by intensity
  const effectiveRainfallRate = baseRainfallRate * intensityMultiplier;

  // Liters per hour = roof area (m²) × rainfall (mm) × efficiency × 1 L/m²/mm
  const litersPerHour = roofArea * effectiveRainfallRate * collectionEfficiency;

  // Assume 6 hours of rain per day on rainy days
  const rainHoursPerDay = 6;
  const litersPerDay = litersPerHour * rainHoursPerDay;

  return {
    roofArea: Math.round(roofArea),
    potential,
    litersPerHour: Math.round(litersPerHour),
    litersPerDay: Math.round(litersPerDay),
    collectionEfficiency: Math.round(collectionEfficiency * 100)
  };
}

/**
 * Generates a dynamic canvas for the Cesium Billboard tooltip.
 */
export function createWaterPotentialIndicator(potential: number, liters: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 400;
  const height = 550;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";

  // Custom roundRect implementation if not available
  if (ctx.roundRect) {
    ctx.roundRect(0, 0, width, height, 20);
  } else {
    // Basic fallback for older/limited environments
    ctx.rect(0, 0, width, height);
  }
  ctx.fill();

  const centerX = width / 2;
  const centerY = 180;
  const radius = 130;

  // Gauge Track
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 25;
  ctx.lineCap = "round";
  ctx.stroke();

  // Gauge Progress
  ctx.beginPath();
  const maxPotential = 100;
  const progressAngle = (Math.min(potential, maxPotential) / maxPotential) * Math.PI;
  ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + progressAngle);
  ctx.strokeStyle = "#3b82f6";
  ctx.stroke();

  // Center Content
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 60px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${liters}`, centerX, centerY + 80);

  ctx.font = "bold 24px Inter, Arial, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("LITERS / DAY", centerX, centerY + 115);

  ctx.fillStyle = "#3b82f6";
  ctx.font = "bold 32px Inter, Arial, sans-serif";
  ctx.fillText(`${potential.toFixed(0)}% Efficiency`, centerX, centerY + 170);

  // Detailed Stats
  ctx.fillStyle = "#f1f5f9";
  if (ctx.roundRect) {
    ctx.roundRect(40, 380, width - 80, 130, 15);
  } else {
    ctx.rect(40, 380, width - 80, 130);
  }
  ctx.fill();

  ctx.fillStyle = "#475569";
  ctx.font = "18px Inter, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ESTIMATED COLLECTION", 60, 420);

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 22px Inter, Arial, sans-serif";
  ctx.fillText("Rainwater Harvesting Model", 60, 455);
  ctx.font = "16px Inter, Arial, sans-serif";
  ctx.fillText("Active Monitoring System v2.1", 60, 485);

  return canvas;
}

/**
 * Enhanced tooltip with building dimensions and detailed water stats
 */
export function createEnhancedWaterIndicator(
  dimensions: BuildingDimensions,
  waterData: {
    roofArea: number;
    potential: number;
    litersPerHour: number;
    litersPerDay: number;
    collectionEfficiency: number;
  },
  rainParams: RainParams,
  isRaining: boolean
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 420;
  const height = 700;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);

  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(30, 41, 59, 0.98)");
  gradient.addColorStop(1, "rgba(15, 23, 42, 0.98)");
  ctx.fillStyle = gradient;

  if (ctx.roundRect) {
    ctx.roundRect(0, 0, width, height, 20);
  } else {
    ctx.rect(0, 0, width, height);
  }
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const centerX = width / 2;
  let yPos = 30;

  // Title
  ctx.fillStyle = "#60a5fa";
  ctx.font = "bold 20px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(" WATER HARVEST ANALYSIS", centerX, yPos);

  // Building Dimensions Section
  yPos += 40;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px Inter, Arial, sans-serif";
  ctx.fillText("BUILDING DIMENSIONS", centerX, yPos);

  yPos += 30;
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 18px Inter, Arial, sans-serif";
  ctx.fillText(`H: ${dimensions.height.toFixed(1)}m × W: ${dimensions.width.toFixed(1)}m × L: ${dimensions.length.toFixed(1)}m`, centerX, yPos);

  // Roof Area
  yPos += 35;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px Inter, Arial, sans-serif";
  ctx.fillText("ROOF AREA", centerX, yPos);

  yPos += 25;
  ctx.fillStyle = "#22d3ee";
  ctx.font = "bold 28px Inter, Arial, sans-serif";
  ctx.fillText(`${waterData.roofArea} m²`, centerX, yPos);

  // Water Collection Gauge
  yPos += 50;
  const gaugeRadius = 80;
  const gaugeCenterY = yPos + gaugeRadius;

  // Gauge background
  ctx.beginPath();
  ctx.arc(centerX, gaugeCenterY, gaugeRadius, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.stroke();

  // Gauge progress
  ctx.beginPath();
  const progressAngle = (waterData.collectionEfficiency / 100) * Math.PI;
  ctx.arc(centerX, gaugeCenterY, gaugeRadius, Math.PI, Math.PI + progressAngle);
  ctx.strokeStyle = isRaining ? "#22c55e" : "#64748b";
  ctx.stroke();

  // Efficiency text in gauge
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Inter, Arial, sans-serif";
  ctx.fillText(`${waterData.collectionEfficiency}%`, centerX, gaugeCenterY + 15);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px Inter, Arial, sans-serif";
  ctx.fillText("EFFICIENCY", centerX, gaugeCenterY + 35);

  // Water Collection Stats
  yPos = gaugeCenterY + gaugeRadius + 40;

  // Stats box
  ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
  if (ctx.roundRect) {
    ctx.roundRect(20, yPos, width - 40, 120, 12);
  } else {
    ctx.rect(20, yPos, width - 40, 120);
  }
  ctx.fill();

  yPos += 30;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px Inter, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("LITERS/HOUR", 40, yPos);
  ctx.textAlign = "right";
  ctx.fillText("LITERS/DAY", width - 40, yPos);

  yPos += 28;
  ctx.fillStyle = isRaining ? "#22c55e" : "#64748b";
  ctx.font = "bold 32px Inter, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${waterData.litersPerHour}`, 40, yPos);
  ctx.textAlign = "right";
  ctx.fillStyle = "#60a5fa";
  ctx.fillText(`${waterData.litersPerDay}`, width - 40, yPos);

  // Rain status
  yPos += 45;
  ctx.textAlign = "center";
  ctx.font = "bold 16px Inter, Arial, sans-serif";
  ctx.fillStyle = isRaining ? "#22c55e" : "#f97316";
  ctx.fillText(isRaining ? " RAIN ACTIVE" : " NO RAIN", centerX, yPos);

  // Rain Parameters
  yPos += 40;
  ctx.fillStyle = "#475569";
  if (ctx.roundRect) {
    ctx.roundRect(20, yPos, width - 40, 90, 10);
  } else {
    ctx.rect(20, yPos, width - 40, 90);
  }
  ctx.fill();

  yPos += 25;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("RAIN PARAMETERS", centerX, yPos);

  yPos += 25;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "13px Inter, Arial, sans-serif";
  ctx.fillText(`Intensity: ${rainParams.intensity.toFixed(1)} | Angle: ${rainParams.angle.toFixed(1)}`, centerX, yPos);

  yPos += 22;
  ctx.fillText(`Size: ${rainParams.size.toFixed(1)} | Speed: ${rainParams.speed.toFixed(0)}`, centerX, yPos);

  return canvas;
}
