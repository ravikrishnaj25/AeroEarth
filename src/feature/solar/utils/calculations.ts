/**
 * Building dimensions interface
 */
export interface BuildingDimensions {
    height: number;
    width: number;
    length: number;
}

/**
 * Solar potential interface
 */
export interface SolarData {
    roofArea: number;
    usableRoofArea: number;
    systemSizeKw: number;
    energyYearKwh: number;
    energyMonthKwh: number;
    savingsYearInr: number;
    savingsMonthInr: number;
    shadowCoverage: number;
    sunHours: number;
}

/**
 * Estimates building dimensions from OSM data
 * @param height Building height
 * @param levels Building levels
 * @param seed Optional seed (e.g. elementId) for consistent variation
 */
export function estimateBuildingDimensions(height: number, levels: number, seed?: string): BuildingDimensions {
    const averageFloorHeight = height / (levels > 0 ? levels : 1);

    // Create a simple hash from seed for consistent randomization
    let val = 0;
    if (seed) {
        for (let i = 0; i < seed.length; i++) {
            val = ((val << 5) - val) + seed.charCodeAt(i);
            val |= 0;
        }
    }
    const hash = (n: number) => (Math.abs(Math.sin(n + val) * 10000) % 1);

    const variationW = hash(1) * 10;
    const variationL = hash(2) * 12;

    const baseWidth = averageFloorHeight * 4 + variationW + 5;
    const baseLength = averageFloorHeight * 5 + variationL + 5;

    return {
        height: height,
        width: Math.round(baseWidth * 10) / 10,
        length: Math.round(baseLength * 10) / 10
    };
}

/**
 * Calculates solar potential with industry standards
 */
export function calculateSolarPotential(
    dimensions: BuildingDimensions,
    shadowCoverage: number = 0.2, // 20% shadow as default
    tariff: number = 8.5, // INR per unit
    peakSunHours: number = 5.5,
    performanceRatio: number = 0.8
): SolarData {
    const roofArea = dimensions.width * dimensions.length;

    // Step 1: Usable Roof Area (60% to 80% used for panels)
    const usabilityFactor = 0.7;
    const usableRoofArea = roofArea * usabilityFactor * (1 - shadowCoverage);

    // Step 2: System Size (1kW needs ~10 m2)
    const systemSizeKw = usableRoofArea / 10;

    // Step 3: Energy Generation (Yearly)
    // Energy/year = SystemSize(kW) × 365 × PeakSunHours × PerformanceRatio
    const energyYearKwh = systemSizeKw * 365 * peakSunHours * performanceRatio;
    const energyMonthKwh = energyYearKwh / 12;

    // Step 4: Financial Savings
    const savingsYearInr = energyYearKwh * tariff;
    const savingsMonthInr = savingsYearInr / 12;

    // Estimate sun hours based on shadow
    const sunHours = peakSunHours * (1 - shadowCoverage);

    return {
        roofArea: Math.round(roofArea),
        usableRoofArea: Math.round(usableRoofArea),
        systemSizeKw: Number(systemSizeKw.toFixed(2)),
        energyYearKwh: Math.round(energyYearKwh),
        energyMonthKwh: Math.round(energyMonthKwh),
        savingsYearInr: Math.round(savingsYearInr),
        savingsMonthInr: Math.round(savingsMonthInr),
        shadowCoverage: Math.round(shadowCoverage * 100),
        sunHours: Number(sunHours.toFixed(1))
    };
}

/**
 * Generates a dynamic canvas for the Solar Potential indicator.
 */
export function createSolarIndicator(data: SolarData): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    const width = 400;
    const height = 550;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    ctx.scale(dpr, dpr);

    // Background - Dark theme for Solar
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    if (ctx.roundRect) {
        ctx.roundRect(0, 0, width, height, 20);
    } else {
        ctx.rect(0, 0, width, height);
    }
    ctx.fill();

    // Border
    ctx.strokeStyle = "#eab308"; // Golden/Yellow
    ctx.lineWidth = 2;
    ctx.stroke();

    const centerX = width / 2;
    let yPos = 50;

    // Header
    ctx.fillStyle = "#eab308";
    ctx.font = "bold 24px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(" SOLAR YIELD", centerX, yPos);

    // System Size
    yPos += 70;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px Inter, Arial, sans-serif";
    ctx.fillText(`${data.systemSizeKw} kW`, centerX, yPos);

    yPos += 30;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Inter, Arial, sans-serif";
    ctx.fillText("ESTIMATED SYSTEM SIZE", centerX, yPos);

    // Divider
    yPos += 40;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(50, yPos);
    ctx.lineTo(350, yPos);
    ctx.stroke();

    // Monthly Savings
    yPos += 60;
    ctx.fillStyle = "#22c55e"; // Green for savings
    ctx.font = "bold 42px Inter, Arial, sans-serif";
    ctx.fillText(`₹${data.savingsMonthInr.toLocaleString()}`, centerX, yPos);

    yPos += 30;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Inter, Arial, sans-serif";
    ctx.fillText("SAVINGS / MONTH", centerX, yPos);

    // Stats Grid
    yPos += 60;
    const leftX = 80;
    const rightX = 320;

    // Row 1
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Energy/Year", leftX, yPos);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${data.energyYearKwh.toLocaleString()} kWh`, rightX, yPos);

    // Row 2
    yPos += 40;
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Sun Hours", leftX, yPos);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${data.sunHours} hrs/day`, rightX, yPos);

    // Row 3
    yPos += 40;
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Roof Area", leftX, yPos);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${data.roofArea} m²`, rightX, yPos);

    // Footer text
    yPos += 60;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "italic 12px Inter, Arial, sans-serif";
    ctx.fillText("Standard Model: 70% roof usage | 80% PR", centerX, yPos);

    return canvas;
}
