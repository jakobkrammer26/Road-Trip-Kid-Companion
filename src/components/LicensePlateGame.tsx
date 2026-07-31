import React from 'react';
import { Award, Check, Search, Trophy } from 'lucide-react';
import { LicensePlate } from '../types';

interface LicensePlateGameProps {
  plates: LicensePlate[];
  onToggleSpotPlate: (id: string) => void;
}

export const LicensePlateGame: React.FC<LicensePlateGameProps> = ({
  plates,
  onToggleSpotPlate,
}) => {
  const spottedCount = plates.filter(p => p.spotted).length;
  const totalCount = plates.length;
  const progressPercent = Math.round((spottedCount / totalCount) * 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
              Autokennzeichen-Finder Spiel
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Schau aus dem Autofenster und tippe auf die Kennzeichen der Autos, die du siehst!
          </p>
        </div>

        <div className="bg-slate-950 px-3.5 py-1.5 rounded-2xl border border-slate-800 text-right">
          <span className="text-xs text-slate-400 font-medium">Gesehen: </span>
          <span className="text-base font-black text-amber-400">
            {spottedCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Plates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
        {plates.map(plate => (
          <button
            key={plate.id}
            onClick={() => onToggleSpotPlate(plate.id)}
            className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
              plate.spotted
                ? 'bg-amber-500/20 border-amber-400 text-slate-100 ring-2 ring-amber-400/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-100">
                <span>{plate.flagEmoji}</span>
                <span>{plate.code}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[80px]">
                {plate.state}
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-xl flex items-center justify-center font-bold text-xs ${
                plate.spotted
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-600'
              }`}
            >
              {plate.spotted ? <Check className="w-4 h-4" /> : '+'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
