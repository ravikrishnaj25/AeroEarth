import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TourStep } from './useTour';

interface TourOverlayProps {
  isActive: boolean;
  isWelcomeScreen: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  /** App title for the welcome screen */
  appTitle?: string;
  /** Subtitle for the welcome screen */
  welcomeSubtitle?: string;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TourOverlay: React.FC<TourOverlayProps> = ({
  isActive,
  isWelcomeScreen,
  currentStep,
  totalSteps,
  currentStepData,
  onNext,
  onPrev,
  onSkip,
  appTitle = 'AEROEARTH',
  welcomeSubtitle = 'Welcome to the AQI Dashboard! Let us walk you through the key features — wind effects, pollution layers, and eco tools.',
}) => {
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate highlight position when step changes (viewport-relative / fixed)
  useEffect(() => {
    if (!isActive || isWelcomeScreen || !currentStepData) {
      setHighlightRect(null);
      return;
    }

    const findAndHighlight = () => {
      const el =
        document.querySelector(`[data-tour="${currentStepData.target}"]`) ||
        document.querySelector(currentStepData.target);

      if (el) {
        const rect = el.getBoundingClientRect();
        const padding = 12;
        const newRect = {
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        };
        setHighlightRect(newRect);

        // Calculate tooltip position (viewport-relative)
        const tooltipWidth = 380;
        const tooltipHeight = 280; // account for full tooltip content
        const gap = 20;
        let tTop = 0;
        let tLeft = 0;

        // Detect if the highlighted element covers most of the viewport (e.g. full-screen map)
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        const isFullScreen =
          rect.width >= viewW * 0.8 && rect.height >= viewH * 0.8;

        if (isFullScreen) {
          // Center the tooltip in the viewport
          tTop = viewH / 2 - tooltipHeight / 2;
          tLeft = viewW / 2 - tooltipWidth / 2;
        } else {
          // Helper to check if tooltip overlaps with the highlighted element
          const overlapsHighlight = (tt: number, tl: number) => {
            const hLeft = rect.left - padding;
            const hTop = rect.top - padding;
            const hRight = rect.right + padding;
            const hBottom = rect.bottom + padding;
            const tRight = tl + tooltipWidth;
            const tBottom = tt + tooltipHeight;
            return !(tl >= hRight || tRight <= hLeft || tt >= hBottom || tBottom <= hTop);
          };

          // Try placements in order of preference, falling back if there's not enough space or overlap
          const placements = [currentStepData.placement || 'bottom', 'right', 'bottom', 'left', 'top'];
          const tried = new Set<string>();
          let placed = false;
          for (const pl of placements) {
            if (tried.has(pl)) continue;
            tried.add(pl);

            switch (pl) {
              case 'bottom':
                tTop = rect.bottom + padding + gap;
                tLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
              case 'top':
                tTop = rect.top - padding - tooltipHeight - gap;
                tLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
              case 'left':
                tTop = rect.top + rect.height / 2 - tooltipHeight / 2;
                tLeft = rect.left - padding - tooltipWidth - gap;
                break;
              case 'right':
                tTop = rect.top + rect.height / 2 - tooltipHeight / 2;
                tLeft = rect.right + padding + gap;
                break;
            }

            // Clamp to viewport first
            tLeft = Math.max(16, Math.min(tLeft, viewW - tooltipWidth - 16));
            tTop = Math.max(16, Math.min(tTop, viewH - tooltipHeight - 16));

            // Check if it fits without overlapping the highlighted area
            const fitsViewport =
              tLeft >= 8 &&
              tLeft + tooltipWidth <= viewW - 8 &&
              tTop >= 8 &&
              tTop + tooltipHeight <= viewH - 8;

            if (fitsViewport && !overlapsHighlight(tTop, tLeft)) {
              placed = true;
              break;
            }
          }

          // If no placement worked without overlap, center in viewport
          if (!placed) {
            tTop = viewH / 2 - tooltipHeight / 2;
            tLeft = viewW / 2 - tooltipWidth / 2;
          }
        }

        // Final clamp
        tLeft = Math.max(16, Math.min(tLeft, viewW - tooltipWidth - 16));
        tTop = Math.max(16, Math.min(tTop, viewH - tooltipHeight - 16));

        setTooltipPos({ top: tTop, left: tLeft });
      }
    };

    // Small delay to wait for elements to render/animate
    const timer = setTimeout(findAndHighlight, 350);
    window.addEventListener('resize', findAndHighlight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findAndHighlight);
    };
  }, [isActive, isWelcomeScreen, currentStepData, currentStep]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
        >
          {/* Welcome Screen */}
          {isWelcomeScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
              }}
            >
              {/* Backdrop */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(8px)',
                }}
              />

              {/* Welcome Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'linear-gradient(135deg, rgba(10, 20, 15, 0.98) 0%, rgba(5, 15, 10, 0.99) 100%)',
                  border: '1px solid rgba(0, 255, 85, 0.3)',
                  borderRadius: '28px',
                  padding: '3.5rem 4rem',
                  maxWidth: '540px',
                  width: '90vw',
                  textAlign: 'center',
                  boxShadow: '0 0 120px rgba(0, 255, 85, 0.12), 0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Decorative glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '120px',
                    height: '120px',
                    background: 'radial-gradient(circle, rgba(0, 255, 85, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }}
                />

                {/* Globe icon */}
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  style={{
                    fontSize: '3.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  🌍
                </motion.div>

                <h2
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    color: '#00ff55',
                    margin: '0 0 0.75rem 0',
                    letterSpacing: '0.05em',
                    textShadow: '0 0 40px rgba(0, 255, 85, 0.3)',
                  }}
                >
                  {appTitle}
                </h2>

                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.05rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.7,
                    margin: '0 0 2.5rem 0',
                  }}
                >
                  {welcomeSubtitle}
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onSkip}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.5)',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '14px',
                      padding: '0.85rem 2rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Skip Tour
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(0, 255, 85, 0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onNext}
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#000',
                      background: 'linear-gradient(135deg, #00ff55 0%, #00cc44 100%)',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '0.85rem 2.5rem',
                      cursor: 'pointer',
                      letterSpacing: '0.03em',
                      boxShadow: '0 0 20px rgba(0, 255, 85, 0.2)',
                    }}
                  >
                    Let's Go →
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step Highlight View */}
          {!isWelcomeScreen && currentStepData && (
            <>
              {/* SVG overlay with cutout for highlighted element */}
              <svg
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  zIndex: 9999,
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  <mask id="tour-spotlight-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {highlightRect && (
                      <rect
                        x={highlightRect.left}
                        y={highlightRect.top}
                        width={highlightRect.width}
                        height={highlightRect.height}
                        rx="12"
                        ry="12"
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.75)"
                  mask="url(#tour-spotlight-mask)"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </svg>

              {/* Highlight border glow */}
              {highlightRect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'fixed',
                    top: highlightRect.top,
                    left: highlightRect.left,
                    width: highlightRect.width,
                    height: highlightRect.height,
                    borderRadius: '12px',
                    border: '2px solid rgba(0, 255, 85, 0.6)',
                    boxShadow: '0 0 30px rgba(0, 255, 85, 0.15), inset 0 0 30px rgba(0, 255, 85, 0.05)',
                    zIndex: 10000,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Tooltip */}
              <motion.div
                ref={tooltipRef}
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                style={{
                  position: 'fixed',
                  top: tooltipPos.top,
                  left: tooltipPos.left,
                  width: '380px',
                  zIndex: 10001,
                  background: 'linear-gradient(135deg, rgba(10, 20, 15, 0.98) 0%, rgba(5, 15, 10, 0.99) 100%)',
                  border: '1px solid rgba(0, 255, 85, 0.3)',
                  borderRadius: '20px',
                  padding: '1.75rem 2rem',
                  boxShadow: '0 0 60px rgba(0, 255, 85, 0.1), 0 10px 40px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Step indicator label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.7rem',
                      color: '#00ff55',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Step {currentStep + 1} of {totalSteps}
                  </span>

                  {/* Step dots */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: i === currentStep ? '16px' : '6px',
                          height: '6px',
                          borderRadius: '3px',
                          background: i === currentStep ? '#00ff55' : i < currentStep ? 'rgba(0, 255, 85, 0.4)' : 'rgba(255, 255, 255, 0.15)',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    margin: '0 0 0.5rem 0',
                  }}
                >
                  {currentStepData.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.6,
                    margin: '0 0 1.5rem 0',
                  }}
                >
                  {currentStepData.description}
                </p>

                {/* Navigation buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onSkip}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.85rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem 0',
                    }}
                  >
                    Skip Tour
                  </motion.button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {currentStep > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPrev}
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: 'rgba(255, 255, 255, 0.6)',
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          padding: '0.6rem 1.25rem',
                          cursor: 'pointer',
                        }}
                      >
                        ← Back
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 85, 0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onNext}
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: '#000',
                        background: 'linear-gradient(135deg, #00ff55 0%, #00cc44 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.6rem 1.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 0 15px rgba(0, 255, 85, 0.15)',
                      }}
                    >
                      {currentStep === totalSteps - 1 ? 'Finish ✓' : 'Next →'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TourOverlay;
