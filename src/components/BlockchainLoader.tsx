import React, { useEffect, useState } from 'react';

interface BlockchainLoaderProps {
  /** The type of data being fetched */
  dataType?: string;
  /** Whether the actual data/viewer is ready */
  isReady?: boolean;
  /** Minimum time (ms) to show the loader. Default: 3500 */
  minDuration?: number;
}

const BlockchainLoader: React.FC<BlockchainLoaderProps> = ({
  dataType = 'AQI',
  isReady = false,
  minDuration = 3500,
}) => {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  // Hide only when both the data is ready AND minimum time has passed
  if (isReady && minTimeElapsed) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e1a',
        color: '#fff',
        fontFamily: 'monospace',
        zIndex: 50,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 48,
            marginBottom: 20,
            animation: 'pulse 1.5s infinite',
          }}
        >
          ⛓️
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Connecting to Algorand Blockchain
        </h2>
        <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
          Fetching decentralized {dataType} data from the chain...
        </p>
        <div
          style={{
            width: 200,
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: '60%',
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: 2,
              animation: 'loading-bar 1.5s infinite ease-in-out',
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes loading-bar { 0% { width: 20%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 20%; margin-left: 80%; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

export default BlockchainLoader;
