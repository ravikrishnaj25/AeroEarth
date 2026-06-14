import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import { debounce } from 'lodash';
import {
  estimateBuildingDimensions,
  calculateAdvancedWaterCollection,
  createWaterPotentialIndicator,
  type BuildingDimensions,
  type RainParams
} from './utils/calculations';
import { setupCesiumVR } from '../../utils/CesiumVR';
import { ImmersiveVRScene, VRButton } from '../../components/vr';
import { useTour, TourOverlay } from '../../components/tour';
import type { TourStep } from '../../components/tour';
import BlockchainLoader from '../../components/BlockchainLoader';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Note: Ensure CESIUM_BASE_URL is set for static assets if using a custom build.
// For many sandbox environments, we can rely on standard imports.
(window as any).CESIUM_BASE_URL = 'https://cdn.jsdelivr.net/npm/cesium@1.114.0/Build/Cesium/';

const CESIUM_ACCESS_TOKEN = (import.meta as any).env?.VITE_CESIUM_ACCESS_TOKEN || '';
Cesium.Ion.defaultAccessToken = CESIUM_ACCESS_TOKEN;

const WaterPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const highlightedFeatureRef = useRef<any>(null);
  const hoveredEntityRef = useRef<Cesium.Entity | null>(null);
  const rainStageRef = useRef<Cesium.PostProcessStage | null>(null);
  const isRainingRef = useRef(false);
  const vrDisposeRef = useRef<(() => void) | null>(null);

  // UI State
  const [isRaining, setIsRaining] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

  // Adjustable rain parameters
  const [rainIntensity, setRainIntensity] = useState(1.0);
  const [rainAngle, setRainAngle] = useState(-0.6);
  const [rainSize, setRainSize] = useState(0.6);
  const [rainSpeed, setRainSpeed] = useState(60.0);

  // Refs for shader access
  const rainIntensityRef = useRef(rainIntensity);
  const rainAngleRef = useRef(rainAngle);
  const rainSizeRef = useRef(rainSize);
  const rainSpeedRef = useRef(rainSpeed);

  // Tour steps for Water dashboard
  const tourSteps: TourStep[] = [
    {
      target: 'water-map',
      title: '3D Water Harvesting Map',
      description: 'This is your interactive 3D map showing rainwater harvesting potential across Ahmedabad. Hover over buildings to see collection estimates based on rooftop area and rain conditions.',
      placement: 'bottom',
    },
    {
      target: 'rain-toggle',
      title: 'Rain Simulation Toggle',
      description: 'Turn the rain simulation on or off. When active, you\'ll see a rain shader effect on the 3D map and hear ambient rain audio.',
      placement: 'right',
      onEnter: () => {
        setIsRaining(true);
      },
    },
    {
      target: 'rain-sliders',
      title: 'Rain Parameters',
      description: 'Fine-tune the rain simulation — adjust intensity (drizzle to downpour), wind angle, raindrop size, and fall speed. These parameters affect both the visual effect and the water collection estimates.',
      placement: 'right',
    },
    {
      target: 'rainwater-plan',
      title: 'Your Rainwater Plan',
      description: 'View your estimated daily water collection, recommended tank capacity, and current rain status. Use the "Get Quote" button to request a professional rainwater harvesting system.',
      placement: 'right',
    },
    {
      target: 'water-vr-button',
      title: 'VR Mode 🥽',
      description: 'Enter immersive VR mode to explore the 3D water harvesting map in virtual reality. Walk through the city and see rainwater potential from a first-person perspective.',
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

  // Keep refs in sync with state
  useEffect(() => {
    rainIntensityRef.current = rainIntensity;
    rainAngleRef.current = rainAngle;
    rainSizeRef.current = rainSize;
    rainSpeedRef.current = rainSpeed;
    // Request render to update rain effect
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.requestRender();
    }
  }, [rainIntensity, rainAngle, rainSize, rainSpeed]);

  // Keep ref in sync with state for shader access
  useEffect(() => {
    isRainingRef.current = isRaining;
    // Request render to update rain effect
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.requestRender();
    }
  }, [isRaining]);

  // Sync atmospheric effects with rain state
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    try {
      if (isRaining) {
        const shadowDarkness = 0.3 + rainIntensity * 0.4;
        if (viewer.scene?.shadowMap) viewer.scene.shadowMap.darkness = shadowDarkness;
        if (viewer.scene?.skyAtmosphere) {
          viewer.scene.skyAtmosphere.hueShift = 0.1 * rainIntensity;
          viewer.scene.skyAtmosphere.saturationShift = -0.3 * rainIntensity;
          viewer.scene.skyAtmosphere.brightnessShift = -0.2 * rainIntensity;
        }
      } else {
        if (viewer.scene?.shadowMap) viewer.scene.shadowMap.darkness = 0.3;
        if (viewer.scene?.skyAtmosphere) {
          viewer.scene.skyAtmosphere.hueShift = 0.0;
          viewer.scene.skyAtmosphere.saturationShift = 0.0;
          viewer.scene.skyAtmosphere.brightnessShift = 0.0;
        }
      }
    } catch (e) {
      // Viewer may be in the process of being destroyed
      console.warn('Could not update atmospheric effects:', e);
    }
  }, [isRaining, rainIntensity]);

  // Create Rain Shader
  const createRainStage = (viewer: Cesium.Viewer) => {
    const fragmentShader = `
      uniform sampler2D colorTexture;
      uniform float tiltAngle;
      uniform float rainSize;
      uniform float rainSpeed;
      uniform float intensity;
      
      in vec2 v_textureCoordinates;

      float hash(float x) {
        return fract(sin(x * 133.3) * 13.13);
      }

      void main(void) {
        float time = czm_frameNumber / rainSpeed;
        vec2 resolution = czm_viewport.zw;
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        vec3 rainColor = vec3(0.6, 0.8, 1.0);
        
        float a = tiltAngle;
        float si = sin(a), co = cos(a);
        uv = mat2(co, -si, si, co) * uv;
        uv *= length(uv + vec2(0.0, 4.9)) * rainSize + 1.0;
        
        float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);
        float streak = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;
        
        rainColor *= v * streak * intensity;
        
        vec4 originalColor = texture(colorTexture, v_textureCoordinates);
        out_FragColor = mix(originalColor, vec4(rainColor, 1.0), 0.3 * intensity);
      }
    `;

    const stage = new Cesium.PostProcessStage({
      name: "rain_effect",
      fragmentShader: fragmentShader,
      uniforms: {
        tiltAngle: () => rainAngleRef.current,
        rainSize: () => rainSizeRef.current,
        rainSpeed: () => rainSpeedRef.current,
        intensity: () => (isRainingRef.current ? rainIntensityRef.current : 0.0),
      },
    });

    viewer.scene.postProcessStages.add(stage);
    rainStageRef.current = stage;
  };

  const highlightBuilding = useCallback((feature: any, liters: number) => {
    if (highlightedFeatureRef.current) {
      highlightedFeatureRef.current.color = Cesium.Color.WHITE;
    }

    let color = Cesium.Color.LIGHTSKYBLUE;
    if (liters > 5000) color = Cesium.Color.DEEPSKYBLUE;
    else if (liters > 2500) color = Cesium.Color.DODGERBLUE;
    else if (liters > 1000) color = Cesium.Color.CORNFLOWERBLUE;

    feature.color = color;
    highlightedFeatureRef.current = feature;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      vrButton: false, // Disable Cesium's VR button, we use Three.js VRButton
      animation: false,
      timeline: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      useDefaultRenderLoop: false, // Disable default render loop for WebXR control
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
      viewer.scene.shadowMap.size = 2048;
    }
    viewer.scene.light = new Cesium.SunLight();

    const fixedTime = new Date();
    fixedTime.setUTCHours(11, 0, 0, 0);
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(fixedTime);
    viewer.clock.shouldAnimate = false;

    createRainStage(viewer);

    // Setup WebXR VR support using Three.js
    const { vrButton, dispose } = setupCesiumVR(viewer);
    vrDisposeRef.current = dispose;

    // Style and position the VR button
    vrButton.style.position = 'absolute';
    vrButton.style.bottom = '20px';
    vrButton.style.left = '50%';
    vrButton.style.transform = 'translateX(-50%)';
    vrButton.style.zIndex = '100';
    containerRef.current.appendChild(vrButton);

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
            const height = pickedObject.getProperty("cesium#estimatedHeight") || 10;
            const levels = pickedObject.getProperty("building:levels") || Math.max(1, Math.floor(height / 3.5));
            const roofAngle = pickedObject.getProperty("roof:angle") || 0;

            // Get building dimensions
            const dimensions: BuildingDimensions = estimateBuildingDimensions(height, levels);

            // Get current rain parameters
            const rainParams: RainParams = {
              intensity: rainIntensityRef.current,
              angle: rainAngleRef.current,
              size: rainSizeRef.current,
              speed: rainSpeedRef.current
            };

            // Calculate advanced water collection
            const waterData = calculateAdvancedWaterCollection(
              dimensions,
              rainParams,
              isRainingRef.current,
              roofAngle
            );

            // Create Billboard with original clean tooltip
            const tooltipPosition = Cesium.Cartesian3.clone(cartesian);
            Cesium.Cartesian3.add(tooltipPosition, new Cesium.Cartesian3(0, 0, 15), tooltipPosition);

            hoveredEntityRef.current = viewer.entities.add({
              position: tooltipPosition,
              billboard: {
                image: createWaterPotentialIndicator(waterData.potential, waterData.litersPerDay),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scale: 0.6,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
            });

            highlightBuilding(pickedObject, waterData.litersPerDay);
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
      if (vrDisposeRef.current) {
        vrDisposeRef.current();
      }
      viewer.destroy();
    };
  }, [highlightBuilding]);

  return (
    <div className="relative w-full h-full min-h-screen">
      <BlockchainLoader dataType="Water" isReady={viewerReady} />
      <div ref={containerRef} className="absolute inset-0 w-full h-full bg-slate-900" data-tour="water-map" />

      {/* Control Panel - matches Solar Page styling */}
      <div className="absolute top-5 left-5 z-10 w-80 p-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white">

        <div className="space-y-6">
          {/* Rain Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10" data-tour="rain-toggle">
            <span className="text-sm font-medium">Rain Simulation</span>
            <button
              onClick={() => {
                const newState = !isRaining;
                setIsRaining(newState);
                const audio = document.getElementById('rain-audio') as HTMLAudioElement;
                if (audio) {
                  if (newState) {
                    audio.volume = Math.min(rainIntensity / 2, 1);
                    audio.play().catch(() => {});
                  } else {
                    audio.pause();
                  }
                }
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${isRaining ? 'bg-blue-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isRaining ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-4" data-tour="rain-sliders">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/60 flex justify-between">
                Intensity: {rainIntensity.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={rainIntensity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setRainIntensity(val);
                  const audio = document.getElementById('rain-audio') as HTMLAudioElement;
                  if (audio && isRaining) audio.volume = Math.min(val / 2, 1);
                }}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/60 flex justify-between">
                Angle: {(rainAngle * 60).toFixed(0)}°
              </label>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.1"
                value={rainAngle}
                onChange={(e) => setRainAngle(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/60 flex justify-between">
                Drop Size: {rainSize.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={rainSize}
                onChange={(e) => setRainSize(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/60 flex justify-between">
                Speed: {rainSpeed.toFixed(0)}
              </label>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={rainSpeed}
                onChange={(e) => setRainSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-5 right-5 z-10 px-4 py-2 bg-black/40 backdrop-blur-sm rounded text-xs text-white/60">
        Ahmedabad, Gujarat Visualization • Data powered by OSM & Cesium
      </div>

      {/* Rain Summary Panel - Your Rainwater Plan */}
      <div className="absolute bottom-24 left-5 z-10 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white overflow-hidden" data-tour="rainwater-plan">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            🌧️ Your Rainwater Plan
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${isRaining ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`}></span>
            <span className="text-xs text-white/60">Status</span>
            <span className={`ml-auto text-sm font-semibold ${isRaining ? 'text-blue-400' : 'text-gray-400'}`}>
              {isRaining ? 'Raining' : 'Clear'}
            </span>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
              <span className="text-xs text-white/60">Rain Intensity</span>
              <span className="text-sm font-semibold text-blue-400">{rainIntensity.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
              <span className="text-xs text-white/60">Collection Angle</span>
              <span className="text-sm font-semibold text-cyan-400">{Math.abs(rainAngle * 60).toFixed(0)}°</span>
            </div>
          </div>

          {/* Estimated Collection */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💧</span>
              <span className="text-xs text-white/60">Est. Daily Collection</span>
            </div>
            <p className="text-xl font-bold text-blue-400">
              {Math.round(rainIntensity * 2500 * (isRaining ? 1 : 0.3)).toLocaleString('en-IN')} L
            </p>
            <p className="text-xs text-white/40 mt-1">Based on avg 100m² rooftop</p>
          </div>

          {/* Tank Capacity Estimate */}
          <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
            <span className="text-xs text-white/60">Recommended Tank</span>
            <span className="text-sm font-semibold text-emerald-400">
              {Math.ceil(rainIntensity * 2500 / 1000) * 2}K L
            </span>
          </div>



          {/* VR Mode Button */}
          <div data-tour="water-vr-button">
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

      {/* Rain Audio Element */}
      <audio id="rain-audio" loop preload="auto">
        <source src="/audio/rain.mp3" type="audio/mpeg" />
      </audio>

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
        appTitle="Water Harvesting"
        welcomeSubtitle="Welcome to the Rainwater Harvesting dashboard! Let us walk you through rain simulation controls, collection estimates, and how to plan your harvesting system."
      />
    </div>
  );
};

export default WaterPage;
