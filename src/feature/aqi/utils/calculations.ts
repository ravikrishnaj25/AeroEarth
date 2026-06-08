/**
 * Impact Calculation Utilities for AQI Tools
 * Estimates pollution reduction, cost, and environmental impact
 */

export interface TreeImpactData {
    type: 'tree';
    treeName: string;
    pm25Reduction: number;      // µg/m³
    pm10Reduction: number;      // µg/m³
    aqiImprovement: number;     // points
    coverageRadius: number;     // meters
    co2Absorbed: number;        // kg/year
    costOneTime: number;        // ₹
    maintenanceMonthly: number; // ₹
    environment: 'outdoor';
    impactSummary: string;
}

export interface GardenImpactData {
    type: 'garden';
    areaM2: number;
    pm25Reduction: number;      // µg/m³
    pm10Reduction: number;      // µg/m³
    aqiImprovement: number;     // points
    temperatureReduction: number; // °C
    noiseReduction: number;     // dB
    costPerM2: number;          // ₹
    totalCost: number;          // ₹
    maintenanceMonthly: number; // ₹
    environment: 'outdoor';
    impactSummary: string;
}

export interface PurifierImpactData {
    type: 'purifier';
    coverageSqFt: number;
    pm25ReductionPercent: number; // %
    cadr: number;               // m³/hr
    costOneTime: number;        // ₹
    filterReplacement: number;  // ₹ per 6 months
    environment: 'indoor';
    impactSummary: string;
}

export type ImpactData = TreeImpactData | GardenImpactData | PurifierImpactData;

// Tree species with their environmental benefits
const TREE_TYPES = [
    { name: 'Neem', pm25Factor: 0.8, co2: 22 },
    { name: 'Peepal', pm25Factor: 1.0, co2: 25 },
    { name: 'Banyan', pm25Factor: 1.2, co2: 30 },
    { name: 'Mango', pm25Factor: 0.6, co2: 18 },
    { name: 'Gulmohar', pm25Factor: 0.5, co2: 15 },
];

/**
 * Estimate impact of planting a tree
 */
export function estimateTreeImpact(
    _currentAqi: number = 150,
    currentPm25: number = 75
): TreeImpactData {
    // Select a random tree type for variety
    const treeType = TREE_TYPES[Math.floor(Math.random() * TREE_TYPES.length)];
    
    // Base reduction calculations
    const pm25Base = 0.3 + Math.random() * 0.9; // 0.3 - 1.2 µg/m³
    const pm25Reduction = pm25Base * treeType.pm25Factor;
    const pm10Reduction = pm25Reduction * 1.5; // PM10 is typically higher
    
    // AQI improvement based on PM reduction relative to current levels
    const pm25ReductionPercent = (pm25Reduction / currentPm25) * 100;
    const aqiImprovement = Math.round(1 + pm25ReductionPercent * 2); // 1-5 points typically
    
    return {
        type: 'tree',
        treeName: treeType.name,
        pm25Reduction: Math.round(pm25Reduction * 100) / 100,
        pm10Reduction: Math.round(pm10Reduction * 100) / 100,
        aqiImprovement: Math.min(aqiImprovement, 5), // Cap at 5
        coverageRadius: 15 + Math.floor(Math.random() * 10), // 15-25m
        co2Absorbed: treeType.co2,
        costOneTime: 600 + Math.floor(Math.random() * 400), // ₹600-1000
        maintenanceMonthly: 40 + Math.floor(Math.random() * 30), // ₹40-70
        environment: 'outdoor',
        impactSummary: `Best for streets + open areas. ${treeType.name} trees are excellent air purifiers.`
    };
}

/**
 * Estimate impact of vertical garden installation
 */
export function estimateGardenImpact(
    areaM2: number = 10,
    _currentAqi: number = 150,
    currentPm25: number = 75
): GardenImpactData {
    // Per m² calculations
    const pm25PerM2 = 0.2 + Math.random() * 0.3; // 0.2 - 0.5 µg/m³ per m²
    const pm25Reduction = pm25PerM2 * areaM2;
    const pm10Reduction = pm25Reduction * 1.3;
    
    // AQI improvement
    const pm25ReductionPercent = (pm25Reduction / currentPm25) * 100;
    const aqiImprovement = Math.round(2 + pm25ReductionPercent * 3); // 4-10 points for larger gardens
    
    // Cost calculations
    const costPerM2 = 1200 + Math.floor(Math.random() * 2300); // ₹1200-3500
    
    return {
        type: 'garden',
        areaM2: areaM2,
        pm25Reduction: Math.round(pm25Reduction * 100) / 100,
        pm10Reduction: Math.round(pm10Reduction * 100) / 100,
        aqiImprovement: Math.min(aqiImprovement, 15),
        temperatureReduction: 1 + Math.random(), // 1-2°C
        noiseReduction: 3 + Math.random() * 2, // 3-5 dB
        costPerM2: costPerM2,
        totalCost: costPerM2 * areaM2,
        maintenanceMonthly: 400 + Math.floor(Math.random() * 200), // ₹400-600
        environment: 'outdoor',
        impactSummary: `Best for apartments + building walls. Green walls provide cooling and noise reduction.`
    };
}

/**
 * Estimate impact of air purifier placement
 */
export function estimatePurifierImpact(): PurifierImpactData {
    // Random variation in purifier specs
    const coverageSqFt = 300 + Math.floor(Math.random() * 300); // 300-600 sq ft
    const cadr = 250 + Math.floor(Math.random() * 200); // 250-450 m³/hr
    const pm25ReductionPercent = 60 + Math.floor(Math.random() * 30); // 60-90%
    
    // Cost based on coverage/performance
    const baseCost = 8000 + Math.floor(Math.random() * 17000); // ₹8000-25000
    
    return {
        type: 'purifier',
        coverageSqFt: coverageSqFt,
        pm25ReductionPercent: pm25ReductionPercent,
        cadr: cadr,
        costOneTime: baseCost,
        filterReplacement: 1500 + Math.floor(Math.random() * 1000), // ₹1500-2500 per 6 months
        environment: 'indoor',
        impactSummary: `Best for homes with asthma patients, children, or elderly. HEPA filtration removes fine particles.`
    };
}

/**
 * Calculate total cumulative impact from all placements
 */
export interface TotalImpactSummary {
    treesPlaced: number;
    gardenAreaM2: number;
    purifiersPlaced: number;
    totalAqiImprovement: number;
    totalPm25Reduction: number;
    totalCost: number;
    monthlyMaintenance: number;
    co2OffsetKgYear: number;
}

export function calculateTotalImpact(impacts: ImpactData[]): TotalImpactSummary {
    let summary: TotalImpactSummary = {
        treesPlaced: 0,
        gardenAreaM2: 0,
        purifiersPlaced: 0,
        totalAqiImprovement: 0,
        totalPm25Reduction: 0,
        totalCost: 0,
        monthlyMaintenance: 0,
        co2OffsetKgYear: 0,
    };
    
    for (const impact of impacts) {
        if (impact.type === 'tree') {
            summary.treesPlaced++;
            summary.totalAqiImprovement += impact.aqiImprovement;
            summary.totalPm25Reduction += impact.pm25Reduction;
            summary.totalCost += impact.costOneTime;
            summary.monthlyMaintenance += impact.maintenanceMonthly;
            summary.co2OffsetKgYear += impact.co2Absorbed;
        } else if (impact.type === 'garden') {
            summary.gardenAreaM2 += impact.areaM2;
            summary.totalAqiImprovement += impact.aqiImprovement;
            summary.totalPm25Reduction += impact.pm25Reduction;
            summary.totalCost += impact.totalCost;
            summary.monthlyMaintenance += impact.maintenanceMonthly;
        } else if (impact.type === 'purifier') {
            summary.purifiersPlaced++;
            // Purifiers don't contribute to outdoor AQI
            summary.totalCost += impact.costOneTime;
            summary.monthlyMaintenance += impact.filterReplacement / 6; // Convert 6-month to monthly
        }
    }
    
    return summary;
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}
