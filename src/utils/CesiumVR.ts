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

/**
 * Sets up WebXR VR support for a Cesium Viewer
 * Works on Meta Quest Browser and other WebXR-capable browsers
 * Falls back gracefully on unsupported browsers
 * 
 * @param viewer - Cesium Viewer instance (must have useDefaultRenderLoop: false)
 * @returns VRButton element, dispose function, and VR support status
 */
export function setupCesiumVR(viewer: Cesium.Viewer): CesiumVRResult {
    // Get Cesium's canvas
    const canvas = viewer.scene.canvas as HTMLCanvasElement;

    // Create Three.js renderer using Cesium's canvas
    // Note: We don't share the WebGL context as it can cause conflicts
    // Instead, Three.js only handles WebXR session management
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
    });

    // Enable WebXR on the Three.js renderer
    renderer.xr.enabled = true;

    // Create a minimal Three.js scene (required by Three.js for XR)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 10000);

    // Track VR support status
    let vrSupported = false;

    // Check WebXR support
    if ('xr' in navigator) {
        (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
            vrSupported = supported;
            if (supported) {
                console.log('[CesiumVR] WebXR VR is supported');
            } else {
                console.log('[CesiumVR] WebXR VR not supported - VR button will be disabled');
            }
        }).catch(() => {
            console.log('[CesiumVR] Could not check WebXR support');
        });
    }

    // Create VRButton - it handles the "not supported" state automatically
    const vrButton = VRButton.createButton(renderer);

    // Track XR session state
    let inXRSession = false;

    renderer.xr.addEventListener('sessionstart', () => {
        inXRSession = true;
        console.log('[CesiumVR] XR session started');
    });

    renderer.xr.addEventListener('sessionend', () => {
        inXRSession = false;
        console.log('[CesiumVR] XR session ended');
    });

    // Standard render loop using requestAnimationFrame
    // This ensures Cesium renders even when WebXR is not available
    let animationFrameId: number;

    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        // Always render Cesium
        viewer.render();

        // If in XR session, also render Three.js for XR frame submission
        if (inXRSession) {
            renderer.render(scene, camera);
        }
    }

    // Start the render loop
    animate();

    // Dispose function for cleanup
    const dispose = () => {
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        if (vrButton.parentElement) {
            vrButton.parentElement.removeChild(vrButton);
        }
    };

    return { vrButton, dispose, isVRSupported: vrSupported };
}

/**
 * Checks if WebXR VR is supported in this browser
 */
export async function isVRSupported(): Promise<boolean> {
    if ('xr' in navigator) {
        try {
            return await (navigator as any).xr.isSessionSupported('immersive-vr');
        } catch {
            return false;
        }
    }
    return false;
}

