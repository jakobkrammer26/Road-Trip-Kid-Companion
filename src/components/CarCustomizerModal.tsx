import React from 'react';
import { X, Check } from 'lucide-react';
import { VehicleAvatar } from '../types';
import { VEHICLE_AVATARS } from '../data/mockData';

interface CarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: VehicleAvatar;
  onSelectVehicle: (v: VehicleAvatar) => void;
}

export const CarCustomizerModal: React.FC<CarCustomizerModalProps> = ({
  isOpen,
  onClose,
  selectedVehicle,
  onSelectVehicle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-slate-100 mb-1 flex items-center gap-2">
          <span>Wähle dein Auto-Avatar</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Wähle das Fahrzeug, das über deine iPad-Karte fährt!
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {VEHICLE_AVATARS.map(v => {
            const isSelected = v.id === selectedVehicle.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  onSelectVehicle(v);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center text-2xl shadow shrink-0`}>
                  {v.emoji}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-100">{v.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{v.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-2xl text-sm transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
