import { TreePine, Droplets, Sun, Search, Link, Check } from 'lucide-react';
import React from 'react';
import type { NFTRecord } from '../engine/types';

interface BlockchainLogProps { nfts: NFTRecord[]; }

export const BlockchainLog: React.FC<BlockchainLogProps> = ({ nfts }) => {
  const actionIcon = (t: string) => {
    if (t === 'PLANT_TREES')       return <TreePine size={12} className="inline mr-1 text-emerald-400" />;
    if (t === 'WATER_CONSERVATION')return <Droplets size={12} className="inline mr-1 text-sky-400" />;
    if (t === 'SOLAR_ADOPTION')    return <Sun size={12} className="inline mr-1 text-amber-400" />;
    return <Search size={12} className="inline mr-1 text-amber-200/50" />;
  };

  return (
    <div className="w-full glass-panel p-5 flex flex-col h-[480px] shadow-lg">
      <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(180,145,60,0.1)' }}>
        <div className="flex items-center gap-2">
          <Link size={13} className="text-amber-400/70" />
          <h3 className="text-amber-200/80 font-semibold text-sm tracking-wider uppercase">
            On-Chain Notarization Ledger
          </h3>
        </div>
        <span
          className="text-[9px] text-purple-400 uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
        >
          Polygon Amoy Testnet
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {nfts.length === 0 ? (
          <div className="text-amber-900/60 text-center py-24 italic text-xs">
            No smart contracts triggered yet. Ledger is empty.
          </div>
        ) : (
          <div className="space-y-3">
            {nfts.map(nft => (
              <div
                key={nft.tokenId}
                className="rounded-xl p-3.5 transition-colors hover:border-purple-500/20"
                style={{ background: 'rgba(255,235,180,0.03)', border: '1px solid rgba(180,145,60,0.12)' }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono text-purple-400/80 px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}
                    >
                      ID: #{nft.tokenId}
                    </span>
                    <span className="text-xs text-amber-100/80 font-bold">{nft.zoneName}</span>
                  </div>
                  <span
                    className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}
                  >
                    Minted <Check size={10} />
                  </span>
                </div>

                <p className="text-xs text-amber-200/55 mb-3 leading-relaxed font-medium">
                  {actionIcon(nft.actionType)}<span>{nft.details}</span>
                </p>

                <div className="flex flex-col gap-1.5 text-[10px] font-semibold pt-2.5" style={{ borderTop: '1px solid rgba(180,145,60,0.08)' }}>
                  <div className="flex justify-between">
                    <span className="text-amber-900/70 uppercase tracking-wider font-bold">IPFS Metadata:</span>
                    <span className="font-mono text-amber-200/45 select-all">{nft.metadataUrl.slice(0, 22)}...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-900/70 uppercase tracking-wider font-bold">Tx Hash:</span>
                    <a
                      href="#"
                      onClick={e => e.preventDefault()}
                      className="text-purple-400 hover:text-purple-300 font-mono select-all hover:underline"
                    >
                      {nft.txHash.slice(0, 10)}...{nft.txHash.slice(-8)}
                    </a>
                  </div>
                  <div className="text-right text-amber-900/50 font-medium mt-0.5">
                    Confirmed: {new Date(nft.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
