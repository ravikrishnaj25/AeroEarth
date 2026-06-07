/**
 * CesiumVR - WebXR VR integration for CesiumJS using Three.js
 * 
 * This utility enables WebXR VR support by:
 * 1. Sharing Cesium's canvas and WebGL context with Three.js
 * 2. Using Three.js only for WebXR enablement
 * 3. Keeping Cesium as the main renderer
 */
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Cesium from 'cesium';

export interface CesiumVRResult {
    vrButton: HTMLElement;
    dispose: () => void;
    isVRSupported: boolean;
}
