import { TreePine, Droplets, Sun, Search, Link, Check } from 'lucide-react';
import React from 'react';
import type { NFTRecord } from '../engine/types';

interface BlockchainLogProps {
  nfts: NFTRecord[];
}

export const BlockchainLog: React.FC<BlockchainLogProps> = ({ nfts }) => {
  const getActionEmoji = (actionType: string) => {
    switch (actionType) {
      case 'PLANT_TREES':
        return <TreePine size={12} />;
      case 'WATER_CONSERVATION':
        return <Droplets size={12} />;
      case 'SOLAR_ADOPTION':
        return <Sun size={12} />;
      default:
        return <Search size={12} />;
    }
  };

  return (
    <div className="w-full bg-[#0a0f0d] border border-[rgba(0,255,85,0.15)] rounded-2xl p-5 shadow-[0_0_20px_rgba(0,255,85,0.02)] flex flex-col h-[480px]">
      <div className="flex justify-between items-center mb-4 border-b border-[rgba(0,255,85,0.1)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm"><Link size={12} /></span>
          <h3 className="text-[#00ff55] font-mono text-sm tracking-wider uppercase font-semibold">
            On-Chain Notarization Ledger
          </h3>
        </div>
        <span className="text-xs font-mono bg-purple-900/30 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
          Polygon Amoy Testnet
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {nfts.length === 0 ? (
          <div className="text-slate-600 text-center py-20 italic font-mono text-xs">
            No smart contracts triggered yet. Ledger is empty.
          </div>
        ) : (
          <div className="space-y-3">
            {nfts.map((nft) => (
              <div 
                key={nft.tokenId}
                className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-purple-950/40 text-purple-400 p-1.5 rounded-lg border border-purple-500/10">
                      ID: #{nft.tokenId}
                    </span>
                    <span className="text-xs font-mono text-slate-300 font-semibold">{nft.zoneName}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Minted <Check size={12} />
                  </span>
                </div>

                <p className="text-xs font-mono text-slate-400 mb-3 leading-normal">
                  <span className="mr-1">{getActionEmoji(nft.actionType)}</span>
                  {nft.details}
                </p>

                <div className="border-t border-slate-900/80 pt-2.5 flex flex-col gap-1 text-xs font-mono text-slate-500">
                  <div className="flex justify-between">
                    <span>IPFS Metadata:</span>
                    <span className="text-slate-400 select-all">{nft.metadataUrl.slice(0, 22)}...</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span>Tx Hash:</span>
                    <a 
                      href="#" 
                      onClick={(e) => e.preventDefault()}
                      className="text-purple-400 hover:text-purple-300 select-all hover:underline"
                      title="Polygonscan simulation link"
                    >
                      {nft.txHash.slice(0, 10)}...{nft.txHash.slice(-8)}
                    </a>
                  </div>
                  <div className="text-right text-xs text-slate-600 mt-1">
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
