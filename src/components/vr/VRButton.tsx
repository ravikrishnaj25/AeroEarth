import React, { useState, useEffect } from 'react';

interface VRButtonProps {
  className?: string;
  onEnterVR?: () => void;
  onExitVR?: () => void;
}

export const VRButton: React.FC<VRButtonProps> = ({ className = '', onEnterVR, onExitVR }) => {
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);

  useEffect(() => {
    // Check WebXR support
    const checkVRSupport = async () => {
      if ('xr' in navigator) {
        try {
          const xr = (navigator as Navigator & { xr: XRSystem }).xr;
          const supported = await xr.isSessionSupported('immersive-vr');
          setIsVRSupported(supported);
        } catch {
          setIsVRSupported(false);
        }
      }
    };
    checkVRSupport();

    // Listen for VR mode exit to sync button state
    const handleVRModeExit = () => {
      setIsInVR(false);
    };
    window.addEventListener('vr-mode-exit', handleVRModeExit);
    
    return () => {
      window.removeEventListener('vr-mode-exit', handleVRModeExit);
    };
  }, []);

  const handleClick = () => {
    if (isInVR) {
      setIsInVR(false);
      if (onExitVR) onExitVR();
    } else {
      setIsInVR(true);
      if (onEnterVR) onEnterVR();
    }
  };

  if (!isVRSupported) {
    return (
      <button
        disabled
        className={`px-4 py-2 rounded-lg bg-gray-600 text-gray-400 cursor-not-allowed opacity-50 ${className}`}
        title="WebXR not supported on this device"
      >
        🥽 VR Not Supported
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
        isInVR
          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:scale-105'
          : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-105 hover:shadow-purple-500/30'
      } ${className}`}
    >
      {isInVR ? '🚪 Exit VR' : '🥽 Enter VR'}
    </button>
  );
};

export default VRButton;
