import { useState, useCallback, useEffect, useRef } from 'react';

export interface TourStep {
  /** CSS selector or data-tour attribute value to highlight */
  target: string;
  /** Title displayed in the tooltip */
  title: string;
  /** Description displayed in the tooltip */
  description: string;
  /** Tooltip placement relative to the highlighted element */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional action to run when this step becomes active */
  onEnter?: () => void;
  /** Optional action to run when leaving this step */
  onLeave?: () => void;
}

interface UseTourOptions {
  steps: TourStep[];
  /** Called when the tour is completed or skipped */
  onComplete?: () => void;
  /** Called when step changes, receives new step index */
  onStepChange?: (stepIndex: number) => void;
}

export const useTour = ({ steps, onComplete, onStepChange }: UseTourOptions) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome screen
  const prevStepRef = useRef(-1);

  const startTour = useCallback(() => {
    setCurrentStep(-1);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Tour complete
      setIsActive(false);
      setCurrentStep(-1);
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else if (currentStep === 0) {
      setCurrentStep(-1); // Go back to welcome
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    // Call onLeave for current step
    if (currentStep >= 0 && steps[currentStep]?.onLeave) {
      steps[currentStep].onLeave!();
    }
    setIsActive(false);
    setCurrentStep(-1);
    onComplete?.();
  }, [onComplete, currentStep, steps]);

  // Run onEnter/onLeave callbacks and notify step changes
  useEffect(() => {
    if (!isActive) return;

    const prevIdx = prevStepRef.current;
    
    // Run onLeave for previous step
    if (prevIdx >= 0 && prevIdx < steps.length && steps[prevIdx]?.onLeave) {
      steps[prevIdx].onLeave!();
    }

    // Run onEnter for new step
    if (currentStep >= 0 && currentStep < steps.length && steps[currentStep]?.onEnter) {
      steps[currentStep].onEnter!();
    }

    if (currentStep >= 0) {
      onStepChange?.(currentStep);
    }

    prevStepRef.current = currentStep;
  }, [isActive, currentStep]); // intentionally minimal deps — steps/callbacks are stable refs

  // Auto-scroll to the target element when step changes (only for scrollable pages)
  useEffect(() => {
    if (!isActive || currentStep < 0) return;

    const step = steps[currentStep];
    if (!step) return;

    const el =
      document.querySelector(`[data-tour="${step.target}"]`) ||
      document.querySelector(step.target);

    if (el) {
      // Only scroll if element is in a scrollable container
      const rect = el.getBoundingClientRect();
      const isOutOfView = rect.top < 0 || rect.bottom > window.innerHeight;
      if (isOutOfView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isActive, currentStep, steps]);

  return {
    isActive,
    currentStep,
    totalSteps: steps.length,
    currentStepData: currentStep >= 0 ? steps[currentStep] : null,
    isWelcomeScreen: currentStep === -1,
    startTour,
    nextStep,
    prevStep,
    skipTour,
  };
};
