import { useRef, useEffect, useState, useCallback } from 'react';

interface VRModeState {
  isVRSupported: boolean;
  isInVR: boolean;
  enterVR: () => Promise<void>;
  exitVR: () => void;
}

export function useVRMode(): VRModeState {
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);
  const sessionRef = useRef<XRSession | null>(null);

  useEffect(() => {
    // Check WebXR support
    const checkVRSupport = async () => {
      if ('xr' in navigator) {
        try {
          const supported = await (navigator as Navigator & { xr: XRSystem }).xr.isSessionSupported('immersive-vr');
          setIsVRSupported(supported);
        } catch {
          setIsVRSupported(false);
        }
      }
    };
    checkVRSupport();
  }, []);

  const enterVR = useCallback(async () => {
    if (!isVRSupported) return;
    
    try {
      const xr = (navigator as Navigator & { xr: XRSystem }).xr;
      const session = await xr.requestSession('immersive-vr', {
        // Only request minimal features for Quest compatibility
        optionalFeatures: ['local-floor']
      });
      
      sessionRef.current = session;
      setIsInVR(true);

      session.addEventListener('end', () => {
        sessionRef.current = null;
        setIsInVR(false);
      });
    } catch (error) {
      console.error('Failed to enter VR:', error);
    }
  }, [isVRSupported]);

  const exitVR = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.end();
    }
  }, []);

  return { isVRSupported, isInVR, enterVR, exitVR };
}

export default useVRMode;
