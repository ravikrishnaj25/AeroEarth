// State management for active layers and sustainability features
import { useState, useCallback } from 'react';

export type FeatureLayer = 'aqi' | 'solar' | 'water';

interface SustainabilityState {
  activeLayers: FeatureLayer[];
  selectedLocation: { lat: number; lon: number } | null;
}

export function useSustainability() {
  const [state, setState] = useState<SustainabilityState>({
    activeLayers: ['aqi'], // AQI is active by default
    selectedLocation: null,
  });

  const toggleLayer = useCallback((layer: FeatureLayer) => {
    setState(prev => ({
      ...prev,
      activeLayers: prev.activeLayers.includes(layer)
        ? prev.activeLayers.filter(l => l !== layer)
        : [...prev.activeLayers, layer],
    }));
  }, []);

  const setActiveLayer = useCallback((layer: FeatureLayer) => {
    setState(prev => ({
      ...prev,
      activeLayers: [layer],
    }));
  }, []);

  const setSelectedLocation = useCallback((location: { lat: number; lon: number } | null) => {
    setState(prev => ({
      ...prev,
      selectedLocation: location,
    }));
  }, []);

  const isLayerActive = useCallback((layer: FeatureLayer) => {
    return state.activeLayers.includes(layer);
  }, [state.activeLayers]);

  return {
    ...state,
    toggleLayer,
    setActiveLayer,
    setSelectedLocation,
    isLayerActive,
  };
}
