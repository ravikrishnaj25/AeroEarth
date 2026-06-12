import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as Cesium from 'cesium';

interface ImmersiveVRSceneProps {
  viewer: Cesium.Viewer | null;
  onExitVR?: () => void;
}

// Store original settings to restore on exit
interface OriginalSettings {
  fov: number;
  resolutionScale: number;
  maximumScreenSpaceError: number;
  useDefaultRenderLoop: boolean;
  targetFrameRate: number;
  requestRenderMode: boolean;
}

/**
 * ImmersiveVRScene - Optimized VR mode for Quest compatibility
 * 
 * Uses a lightweight approach to prevent browser crashes on mobile VR:
 * - Disables Cesium's default render loop
 * - Implements a manual, throttled render loop
 * - Aggressively reduces scene complexity
 * - Yields to browser regularly to prevent "not responding" errors
 */
export const ImmersiveVRScene: React.FC<ImmersiveVRSceneProps> = ({ viewer, onExitVR }) => {
  const [isActive, setIsActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Preparing VR...');
  const xrSessionRef = useRef<XRSession | null>(null);
  const originalSettingsRef = useRef<OriginalSettings | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isRenderingRef = useRef(false);
  const lastRenderTimeRef = useRef(0);

  // Optimize scene for VR performance
  const optimizeForVR = useCallback((v: Cesium.Viewer) => {
    if (v.isDestroyed()) return;

    // Store original settings
    const frustum = v.camera.frustum as Cesium.PerspectiveFrustum;

    originalSettingsRef.current = {
      fov: frustum instanceof Cesium.PerspectiveFrustum ? (frustum.fov ?? Cesium.Math.toRadians(60)) : Cesium.Math.toRadians(60),
      resolutionScale: v.resolutionScale,
      maximumScreenSpaceError: v.scene.globe.maximumScreenSpaceError,
      useDefaultRenderLoop: v.useDefaultRenderLoop,
      targetFrameRate: v.targetFrameRate,
      requestRenderMode: v.scene.requestRenderMode,
    };

    // Apply VR optimizations
    setStatusMessage('Optimizing scene...');

    // CRITICAL: Stop Cesium's default render loop to prevent conflicts
    v.useDefaultRenderLoop = false;

    // 1. Very low resolution for Quest browser (mobile GPU)
    v.resolutionScale = 0.5;

    // 2. Disable ALL post-processing (wind, pollution shaders are GPU intensive)
    v.scene.postProcessStages.removeAll();

    // 3. Aggressively reduce 3D tileset detail
    v.scene.globe.maximumScreenSpaceError = 8;

    // 4. Wider FOV for VR
    if (frustum instanceof Cesium.PerspectiveFrustum) {
      frustum.fov = Cesium.Math.toRadians(100);
    }

    // 5. Disable shadows
    v.shadows = false;

    // 6. Disable fog
    v.scene.fog.enabled = false;

    // 7. Disable atmosphere effects (heavy on GPU)
    if (v.scene.skyAtmosphere) {
      v.scene.skyAtmosphere.show = false;
    }

    // 8. Reduce globe detail
    v.scene.globe.tileCacheSize = 50;
    v.scene.globe.preloadSiblings = false;
    v.scene.globe.preloadAncestors = false;

    // 9. Lower 3D tiles memory budget
    try {
      const primitives = v.scene.primitives as unknown as { length: number; get: (i: number) => unknown };
      for (let i = 0; i < primitives.length; i++) {
        const primitive = primitives.get(i);
        if (primitive && typeof primitive === 'object' && 'maximumMemoryUsage' in primitive) {
          (primitive as { maximumMemoryUsage: number }).maximumMemoryUsage = 128;
        }
      }
    } catch (e) {
      // Ignore if primitives cannot be accessed
    }

    // 10. Enable request render mode (only render when needed)
    v.scene.requestRenderMode = true;

    console.log('[VRScene] Scene optimized for VR');
  }, []);

  // Restore original settings
  const restoreSettings = useCallback((v: Cesium.Viewer) => {
    if (v.isDestroyed() || !originalSettingsRef.current) return;

    const settings = originalSettingsRef.current;

    // Restore render loop FIRST
    v.useDefaultRenderLoop = settings.useDefaultRenderLoop;

    // Restore resolution
    v.resolutionScale = settings.resolutionScale;

    // Restore globe detail
    v.scene.globe.maximumScreenSpaceError = settings.maximumScreenSpaceError;
    v.scene.globe.tileCacheSize = 100;
    v.scene.globe.preloadSiblings = true;
    v.scene.globe.preloadAncestors = true;

    // Restore FOV
    const frustum = v.camera.frustum as Cesium.PerspectiveFrustum;
    if (frustum instanceof Cesium.PerspectiveFrustum) {
      frustum.fov = settings.fov;
      frustum.xOffset = 0;
    }

    // Re-enable fog
    v.scene.fog.enabled = true;

    // Re-enable atmosphere
    if (v.scene.skyAtmosphere) {
      v.scene.skyAtmosphere.show = true;
    }

    // Restore render mode
    v.scene.requestRenderMode = settings.requestRenderMode;

    // Dispatch event so parent can restore post-processing shaders
    window.dispatchEvent(new CustomEvent('vr-mode-exit'));

    v.scene.requestRender();
    console.log('[VRScene] Settings restored');
  }, []);

  const exitVR = useCallback(async () => {
    console.log('[VRScene] Exiting VR mode');
    isRenderingRef.current = false;

    // End XR session if active
    if (xrSessionRef.current) {
      try {
        await xrSessionRef.current.end();
      } catch (e) {
        // Session may already be ended
      }
      xrSessionRef.current = null;
    }

    // Stop any animation loop
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Restore original settings
    if (viewer && !viewer.isDestroyed()) {
      restoreSettings(viewer);
    }

    setIsActive(false);
    if (onExitVR) onExitVR();
  }, [viewer, onExitVR, restoreSettings]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) {
      exitVR();
      return;
    }

    const initVR = async () => {
      try {
        // First optimize the scene for VR
        optimizeForVR(viewer);

        // Wait a frame to let optimizations apply
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if WebXR is available
        if ('xr' in navigator) {
          setStatusMessage('Checking VR support...');
          const xr = (navigator as Navigator & { xr: XRSystem }).xr;
          const supported = await xr.isSessionSupported('immersive-vr');
          
          if (supported) {
            try {
              setStatusMessage('Starting VR session...');
              
              // Request immersive VR session with minimal features for Quest compatibility
              const session: XRSession = await xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor']
              });
              
              xrSessionRef.current = session;

              // Handle session end
              session.addEventListener('end', () => {
                console.log('[VRScene] XR session ended');
                xrSessionRef.current = null;
                exitVR();
              });

              // Start our throttled VR render loop
              isRenderingRef.current = true;
              startVRRenderLoop(viewer, session);
              
              setIsActive(true);
              console.log('[VRScene] VR session started successfully');
              
            } catch (e) {
              console.log('[VRScene] Could not start immersive VR:', e);
              // Fallback: just enable optimized view without XR
              startOptimizedRenderLoop(viewer);
              setIsActive(true);
            }
          } else {
            // Fallback: just enable optimized view
            setStatusMessage('VR not supported, using optimized view');
            startOptimizedRenderLoop(viewer);
            setIsActive(true);
          }
        } else {
          // No WebXR, use simple optimized mode
          setStatusMessage('Entering optimized view...');
          startOptimizedRenderLoop(viewer);
          setIsActive(true);
        }
      } catch (error) {
        console.error('[VRScene] VR initialization error:', error);
        if (viewer && !viewer.isDestroyed()) {
          startOptimizedRenderLoop(viewer);
        }
        setIsActive(true);
      }
    };

    // Throttled render loop for VR - yields to browser frequently
    const startVRRenderLoop = (v: Cesium.Viewer, session: XRSession) => {
      const TARGET_FPS = 30; // Target 30fps for Quest browser stability
      const FRAME_INTERVAL = 1000 / TARGET_FPS;
      let frameCount = 0;

      const onXRFrame = (time: DOMHighResTimeStamp, _frame: XRFrame) => {
        if (!isRenderingRef.current || !xrSessionRef.current || v.isDestroyed()) {
          return;
        }

        // Request next frame FIRST to maintain loop
        session.requestAnimationFrame(onXRFrame);

        // Throttle rendering to reduce GPU load
        const elapsed = time - lastRenderTimeRef.current;
        if (elapsed < FRAME_INTERVAL) {
          return;
        }
        lastRenderTimeRef.current = time;

        // Every 30 frames, yield to browser with a minimal timeout
        // This prevents "browser not responding" on Quest
        frameCount++;
        if (frameCount % 30 === 0) {
          setTimeout(() => {
            if (!v.isDestroyed() && isRenderingRef.current) {
              try {
                v.render();
              } catch (e) {
                console.warn('[VRScene] Render error:', e);
              }
            }
          }, 0);
        } else {
          // Normal render
          try {
            v.render();
          } catch (e) {
            console.warn('[VRScene] Render error:', e);
          }
        }
      };
      
      session.requestAnimationFrame(onXRFrame);
    };

    // Optimized render loop for non-VR fallback
    const startOptimizedRenderLoop = (v: Cesium.Viewer) => {
      const TARGET_FPS = 30;
      const FRAME_INTERVAL = 1000 / TARGET_FPS;

      const render = (time: DOMHighResTimeStamp) => {
        if (!isRenderingRef.current || v.isDestroyed()) {
          return;
        }

        animationIdRef.current = requestAnimationFrame(render);

        const elapsed = time - lastRenderTimeRef.current;
        if (elapsed < FRAME_INTERVAL) {
          return;
        }
        lastRenderTimeRef.current = time;

        try {
          v.render();
        } catch (e) {
          console.warn('[VRScene] Render error:', e);
        }
      };

      isRenderingRef.current = true;
      animationIdRef.current = requestAnimationFrame(render);
    };

    initVR();

    return () => {
      isRenderingRef.current = false;
      if (xrSessionRef.current) {
        xrSessionRef.current.end().catch(() => {});
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [viewer, exitVR, optimizeForVR]);

  if (!isActive) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #333',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>{statusMessage}</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      {/* Exit VR button - visible on screen */}
      <button
        onClick={exitVR}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '16px 32px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 10000,
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'auto'
        }}
      >
        🚪 Exit VR Mode
      </button>
      
      {/* VR Status indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#10b981',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none'
        }}
      >
        <span style={{ 
          width: '10px', 
          height: '10px', 
          background: '#10b981', 
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
        {xrSessionRef.current ? 'VR Active - Look around!' : 'VR Mode - Use touch to navigate'}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// Legacy VRScene export for backwards compatibility
interface VRSceneProps {
  cesiumCanvas: HTMLCanvasElement | null;
  onExitVR?: () => void;
}

export const VRScene: React.FC<VRSceneProps> = ({ onExitVR }) => {
  useEffect(() => {
    console.warn('VRScene with cesiumCanvas prop is deprecated. Use ImmersiveVRScene with viewer prop.');
    if (onExitVR) setTimeout(onExitVR, 100);
  }, [onExitVR]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{ color: 'white', textAlign: 'center' }}>
        <p>Please use the updated VR button.</p>
        <button 
          onClick={onExitVR}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default ImmersiveVRScene;
