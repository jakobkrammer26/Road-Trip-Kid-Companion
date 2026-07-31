import React, { useState } from 'react';
import { Download, CheckCircle, Wifi, WifiOff, HardDrive, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { OfflineMapPack } from '../types';

interface OfflineMapManagerProps {
  packs: OfflineMapPack[];
  onToggleDownloadPack: (packId: string) => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
}

export const OfflineMapManager: React.FC<OfflineMapManagerProps> = ({
  packs,
  onToggleDownloadPack,
  isOfflineMode,
  onToggleOfflineMode,
}) => {
  const totalDownloadedMb = packs
    .filter(p => p.isDownloaded)
    .reduce((sum, p) => sum + p.sizeMb, 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Offline-Karten System
            </span>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500/30">
              Bereit für die lange Autoreise
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-100 mt-1 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <span>iPad Offline-Routenkarten</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Lade regionale Kartenpakete auf das iPad, damit die Navigation auch ohne Handynetz klappt!
          </p>
        </div>

        {/* Offline Mode Switcher */}
        <button
          onClick={onToggleOfflineMode}
          className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer border shadow-lg ${
            isOfflineMode
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/20'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {isOfflineMode ? <WifiOff className="w-4 h-4 text-slate-950" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
          <span>{isOfflineMode ? 'OFFLINE-MODUS AKTIV' : 'IN OFFLINE-MODUS WECHSELN'}</span>
        </button>
      </div>

      {/* Storage Summary Bar */}
      <div className="flex items-center justify-between bg-indigo-950/40 p-3 rounded-2xl border border-indigo-500/30 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-indigo-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>iPad Saved Tile Storage: <strong>{totalDownloadedMb} MB</strong> / 512 MB reserved</span>
        </div>
        <div className="text-slate-400 text-xs font-mono">
          {packs.filter(p => p.isDownloaded).length} Regions Downloaded
        </div>
      </div>

      {/* Map Pack Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {packs.map(pack => (
          <div
            key={pack.id}
            className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
              pack.isDownloaded
                ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                : 'bg-slate-950/80 border-slate-800 text-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                  {pack.region}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {pack.sizeMb} MB ({pack.tileCount} tiles)
                </span>
              </div>
              <h4 className="font-extrabold text-base text-slate-100 mt-2">
                {pack.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {pack.description}
              </p>
            </div>

            {/* Download Action button or Progress */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              {pack.isDownloaded ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Ready for Offline Use</span>
                </div>
              ) : pack.downloadProgress > 0 && pack.downloadProgress < 100 ? (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-indigo-300 mb-1 font-bold">
                    <span>Downloading tiles...</span>
                    <span>{pack.downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${pack.downloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Not stored locally</span>
              )}

              <button
                onClick={() => onToggleDownloadPack(pack.id)}
                disabled={pack.downloadProgress > 0 && pack.downloadProgress < 100}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                  pack.isDownloaded
                    ? 'bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                }`}
              >
                {pack.isDownloaded ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Map</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
