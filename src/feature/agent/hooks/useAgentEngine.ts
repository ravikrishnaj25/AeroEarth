import { useEffect, useState, useCallback, useRef } from 'react';
import { agentEngineInstance } from '../engine/agentEngine';
import type { EngineState } from '../engine/agentEngine';

export const useAgentEngine = (autoRunIntervalMs: number = 45000) => {
  const [state, setState] = useState<EngineState>(agentEngineInstance.getState());
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(true);
  const autoRunTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to engine state changes
  useEffect(() => {
    const unsubscribe = agentEngineInstance.subscribe((newState) => {
      setState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Run a single cycle
  const runCycle = useCallback(async () => {
    return await agentEngineInstance.runCycle();
  }, []);

  // Clear activity log
  const clearLogs = useCallback(() => {
    agentEngineInstance.clearLogs();
  }, []);

  // Setup/Teardown Auto Run Interval
  useEffect(() => {
    if (isAutoRunning) {
      // Trigger immediately on mount if no cycles have run
      if (agentEngineInstance.getState().cycleCount === 0 && agentEngineInstance.getState().status === 'idle') {
        agentEngineInstance.runCycle();
      }

      const tick = async () => {
        const current = agentEngineInstance.getState();
        if (current.status !== 'running') {
          await agentEngineInstance.runCycle();
        }
      };

      autoRunTimerRef.current = setInterval(tick, autoRunIntervalMs);
    } else {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
        autoRunTimerRef.current = null;
      }
    }

    return () => {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
      }
    };
  }, [isAutoRunning, autoRunIntervalMs]);

  const toggleAutoRun = useCallback(() => {
    setIsAutoRunning(prev => !prev);
  }, []);

  return {
    state,
    runCycle,
    clearLogs,
    isAutoRunning,
    toggleAutoRun
  };
};
