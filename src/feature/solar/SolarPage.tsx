import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import { debounce } from 'lodash';
import {
  estimateBuildingDimensions,
  calculateSolarPotential,
  createSolarIndicator,
  type BuildingDimensions
} from './utils/calculations';
import { ImmersiveVRScene, VRButton } from '../../components/vr';
import { useTour, TourOverlay } from '../../components/tour';
import type { TourStep } from '../../components/tour';
import BlockchainLoader from '../../components/BlockchainLoader';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Note: Ensure CESIUM_BASE_URL is set for static assets if using a custom build.
(window as any).CESIUM_BASE_URL = 'https://cdn.jsdelivr.net/npm/cesium@1.114.0/Build/Cesium/';

const CESIUM_ACCESS_TOKEN = (import.meta as any).env?.VITE_CESIUM_ACCESS_TOKEN || '';
Cesium.Ion.defaultAccessToken = CESIUM_ACCESS_TOKEN;

const SolarPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const highlightedFeatureRef = useRef<any>(null);
  const hoveredEntityRef = useRef<Cesium.Entity | null>(null);

  // UI State
  const [shadowCoverage, setShadowCoverage] = useState(0.25);
  const [tariff, setTariff] = useState(8.0);
  const [peakSunHours, setPeakSunHours] = useState(5.5);
  const [showShadows, setShowShadows] = useState(true);
  const [isVRMode, setIsVRMode] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

  // Refs to hold current parameter values for use inside event handlers without causing re-renders
  const shadowCoverageRef = useRef(shadowCoverage);
  const tariffRef = useRef(tariff);
  const peakSunHoursRef = useRef(peakSunHours);

  // Sync refs when state changes
  useEffect(() => { shadowCoverageRef.current = shadowCoverage; }, [shadowCoverage]);
  useEffect(() => { tariffRef.current = tariff; }, [tariff]);
  useEffect(() => { peakSunHoursRef.current = peakSunHours; }, [peakSunHours]);

  // Tour steps for Solar dashboard
  const tourSteps: TourStep[] = [
    {
      target: 'solar-map',
      title: '3D Solar Potential Map',
      description: 'This is your interactive 3D map showing solar energy potential across Ahmedabad. Hover over buildings to see estimated panel capacity, energy generation, and monthly savings.',
      placement: 'bottom',
    },
    {
      target: 'shadow-toggle',
      title: 'Shadow Analysis',
      description: 'Toggle the real-time shadow simulation powered by Cesium\'s sun position engine. See how shadows from adjacent buildings affect solar panel placement throughout the day.',
      placement: 'right',
      onEnter: () => {
        setShowShadows(true);
      },
    },
    {
      target: 'solar-sliders',
      title: 'Solar Parameters',
      description: 'Fine-tune your solar analysis — adjust shadow loss percentage, electricity tariff (₹/unit), and peak sun hours. These values directly affect energy generation and savings estimates.',
      placement: 'right',
    },
    {
      target: 'solar-stats',
      title: 'Live Solar Stats',
      description: 'View real-time solar irradiation data and current market electricity tariff for your region. These benchmarks help you evaluate your solar investment.',
      placement: 'bottom',
    },
    {
      target: 'solar-plan',
      title: 'Your Solar Plan',
      description: 'Review your complete solar configuration — shadow loss, tariff, peak sun hours — along with estimated monthly savings. Hit "Get Quote" to request a professional installation.',
      placement: 'right',
    },
    {
      target: 'solar-vr-button',
      title: 'VR Mode 🥽',
      description: 'Enter immersive VR mode to explore your solar potential in virtual reality. Walk through the city and see panel placement and sun angles from a first-person perspective.',
      placement: 'right',
    },
  ];

  const tour = useTour({
    steps: tourSteps,
  });

  // Auto-start tour after Cesium loads
  useEffect(() => {
    if (viewerReady) {
      const timer = setTimeout(() => {
        tour.startTour();
      }, 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerReady]);

  // Sync shadow settings with viewer
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (viewer.scene.shadowMap) {
      viewer.scene.shadowMap.enabled = showShadows;
    }

    // Adjust atmosphere to a sunny state
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.brightnessShift = 0.1;
      viewer.scene.skyAtmosphere.saturationShift = 0.2;
    }
  }, [showShadows]);

  const highlightBuilding = useCallback((feature: any, monthlySavings: number) => {
    if (highlightedFeatureRef.current) {
      highlightedFeatureRef.current.color = Cesium.Color.WHITE;
    }

    // High yield = Golden, Medium = Amber, Low = Yellow
    let color = Cesium.Color.YELLOW.withAlpha(0.8);
    if (monthlySavings > 25000) color = Cesium.Color.GOLD.withAlpha(0.9);
    else if (monthlySavings > 10000) color = Cesium.Color.ORANGE.withAlpha(0.85);

    feature.color = color;
    highlightedFeatureRef.current = feature;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      vrButton: true,
      animation: true,
      timeline: true,
      navigationHelpButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      // @ts-ignore
      shouldAnimate: true
    });

    viewerRef.current = viewer;
    setViewerReady(true);
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
    }

    // View Ahmedabad context
    const latitude = 23.0225;
    const longitude = 72.5714;
    const altitude = 1000;
    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
    viewer.scene.camera.setView({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35.0),
        roll: 0.0,
      },
    });

    // Initialize OSM Buildings
    Cesium.createOsmBuildingsAsync().then((tileset) => {
      viewer.scene.primitives.add(tileset);
      tileset.shadows = Cesium.ShadowMode.ENABLED;
    });

    if (viewer.scene.shadowMap) {
      viewer.scene.shadowMap.enabled = true;
      viewer.scene.shadowMap.size = 4096; // High quality for solar analysis
      viewer.scene.shadowMap.softShadows = true;
    }

    // Set dynamic sun light
    viewer.scene.light = new Cesium.SunLight();

    // Set time to noon for peak solar
    const fixedTime = new Date();
    fixedTime.setUTCHours(7, 0, 0, 0); // ~12:30 PM IST
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(fixedTime);
    viewer.clock.multiplier = 3600; // Fast time progression
    viewer.clock.shouldAnimate = false;

    // Mouse Move Handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    const debouncedMouseMove = debounce((movement) => {
      const scene = viewer.scene;
      const pickedObject = scene.pick(movement.endPosition);

      if (Cesium.defined(pickedObject) && pickedObject.primitive instanceof Cesium.Cesium3DTileset) {
        const cartesian = scene.pickPosition(movement.endPosition);
        if (Cesium.defined(cartesian)) {
          // Clear previous hover entity
          if (hoveredEntityRef.current) {
            viewer.entities.remove(hoveredEntityRef.current);
          }

          // Check if it's a feature we can analyze
          if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
            const height = pickedObject.getProperty("cesium#estimatedHeight") || 15;
            const levels = pickedObject.getProperty("building:levels") || Math.max(1, Math.floor(height / 3.5));
            const elementId = pickedObject.getProperty("elementId");

            // Recalculate based on current UI parameters using elementId as a seed for consistent variation
            const dimensions: BuildingDimensions = estimateBuildingDimensions(height, levels, elementId ? String(elementId) : undefined);
            const solarData = calculateSolarPotential(
              dimensions,
              shadowCoverageRef.current, // Using ref for current value
              tariffRef.current,
              peakSunHoursRef.current
            );

            // Create Billboard
            const tooltipPosition = Cesium.Cartesian3.clone(cartesian);
            Cesium.Cartesian3.add(tooltipPosition, new Cesium.Cartesian3(0, 0, 15), tooltipPosition);

            hoveredEntityRef.current = viewer.entities.add({
              position: tooltipPosition,
              billboard: {
                image: createSolarIndicator(solarData),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scale: 0.6,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
            });

            highlightBuilding(pickedObject, solarData.savingsMonthInr);
          }
        }
      } else {
        if (hoveredEntityRef.current) {
          viewer.entities.remove(hoveredEntityRef.current);
          hoveredEntityRef.current = null;
        }
        if (highlightedFeatureRef.current) {
          highlightedFeatureRef.current.color = Cesium.Color.WHITE;
          highlightedFeatureRef.current = null;
        }
      }
    }, 50);

    handler.setInputAction(debouncedMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      handler.destroy();
      viewer.destroy();
    };
  }, [highlightBuilding]);

  return (
    <div className="relative w-full h-full min-h-screen">
      <BlockchainLoader dataType="Solar" isReady={viewerReady} />
      <div ref={containerRef} className="absolute inset-0 w-full h-full bg-slate-900" data-tour="solar-map" />

      {/* Control Panel */}
      <div className="absolute top-5 left-5 z-10 w-80 p-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white">


        <div className="space-y-6">
          {/* Shadow Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10" data-tour="shadow-toggle">
            <span className="text-sm font-medium">Show Shadows</span>
            <button
              onClick={() => setShowShadows(!showShadows)}
              className={`w-12 h-6 rounded-full transition-colors relative ${showShadows ? 'bg-yellow-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showShadows ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-4" data-tour="solar-sliders">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/60 flex justify-between">
                Shadow Loss: {(shadowCoverage * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={shadowCoverage}
                onChange={(e) => setShadowCoverage(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/60 flex justify-between">
                Tariff: ₹{tariff.toFixed(1)}/unit
              </label>
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={tariff}
                onChange={(e) => setTariff(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/60 flex justify-between">
                Peak Sun: {peakSunHours.toFixed(1)} hrs
              </label>
              <input
                type="range"
                min="3"
                max="8"
                step="0.1"
                value={peakSunHours}
                onChange={(e) => setPeakSunHours(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">

          </div>
        </div>
      </div>

      {/* Stats Overlay Bottom */}
      <div className="absolute top-5 right-5 z-10 flex gap-4" data-tour="solar-stats">
        <div className="px-4 py-2 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 text-center">
          <p className="text-[10px] uppercase tracking-tighter text-white/40">Avg. Irradiation</p>
          <p className="text-lg font-bold text-yellow-400">5.8 <span className="text-[10px] text-white/60">kWh/m²</span></p>
        </div>
        <div className="px-4 py-2 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 text-center">
          <p className="text-[10px] uppercase tracking-tighter text-white/40">Market Tariff</p>
          <p className="text-lg font-bold text-green-400">₹8.5 <span className="text-[10px] text-white/60">avg</span></p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-5 right-5 z-10 px-4 py-2 bg-black/40 backdrop-blur-sm rounded text-[10px] text-white/60">
        Ahmedabad, Gujarat Visualization • Data powered by OSM & Cesium
      </div>

      {/* Solar Summary Panel - Your Solar Plan */}
      <div className="absolute bottom-30 left-5 z-10 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white overflow-hidden" data-tour="solar-plan">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            ☀️ Your Solar Plan
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
              <span className="text-xs text-white/60">Shadow Loss</span>
              <span className="text-sm font-semibold text-yellow-400">{(shadowCoverage * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
              <span className="text-xs text-white/60">Electricity Tariff</span>
              <span className="text-sm font-semibold text-green-400">₹{tariff.toFixed(1)}/unit</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
              <span className="text-xs text-white/60">Peak Sun Hours</span>
              <span className="text-sm font-semibold text-orange-400">{peakSunHours.toFixed(1)} hrs</span>
            </div>
          </div>

          {/* Estimated Savings */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💰</span>
              <span className="text-xs text-white/60">Est. Monthly Savings</span>
            </div>
            <p className="text-xl font-bold text-yellow-400">
              ₹{Math.round((1 - shadowCoverage) * tariff * peakSunHours * 30 * 4).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-white/40 mt-1">Based on avg 4kW rooftop system</p>
          </div>

          {/* Get Quote Button */}
          <button 
            onClick={() => alert(`Quote Request:\n- Shadow Loss: ${(shadowCoverage * 100).toFixed(0)}%\n- Tariff: ₹${tariff}/unit\n- Peak Sun: ${peakSunHours} hrs\n\nOur team will contact you shortly!`)}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/20"
          >
            Get Quote 
          </button>

          {/* VR Mode Button */}
          <div data-tour="solar-vr-button">
            <VRButton 
              className="w-full mt-3" 
              onEnterVR={() => setIsVRMode(true)}
            />
          </div>
        </div>
      </div>

      {/* VR Scene Overlay */}
      {isVRMode && viewerRef.current && (
        <ImmersiveVRScene 
          viewer={viewerRef.current}
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
        appTitle="Solar Analysis"
        welcomeSubtitle="Welcome to the Solar Energy Analysis dashboard! Let us walk you through shadow simulation, panel capacity estimation, and how to plan your solar installation."
      />
    </div>
  );
};

export default SolarPage;
