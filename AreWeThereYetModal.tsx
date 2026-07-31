import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Volume2, Sparkles, Car, Clock, Navigation } from 'lucide-react';
import { TripState } from '../types';
import { formatMinutesLeft } from '../utils/geo';
import { speakText } from '../utils/speech';

interface AreWeThereYetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripState: TripState;
}

export const AreWeThereYetModal: React.FC<AreWeThereYetModalProps> = ({
  isOpen,
  onClose,
  tripState,
}) => {
  if (!isOpen) return null;

  const { progressPercent, remainingMiles, estimatedMinutesLeft, destination } = tripState;

  // Funny comparison facts
  const episodeCount = (estimatedMinutesLeft / 22).toFixed(1);
  const snackCount = Math.max(1, Math.round(estimatedMinutesLeft / 15));

  const funnyAnswers = [
    `Wir sind schon zu ${Math.round(progressPercent)}% auf dem Weg nach ${destination.name}!`,
    `Nur noch ${formatMinutesLeft(estimatedMinutesLeft)}! Das ist genauso lang wie ${episodeCount} Zeichentrick-Folgen!`,
    `Noch ${remainingMiles} Kilometer! Genug Zeit für ${snackCount} Fruchtsaft-Tüten und 3 lustige Lieder!`
  ];

  const fullText = funnyAnswers.join(" ");

  useEffect(() => {
    // Speak automatically when modal opens if triggered
    speakText(`Sind wir schon da? ${fullText}`);

    // Trigger confetti if close or arrived
    if (progressPercent >= 80) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-4 border-amber-400 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden text-center text-slate-100">
        {/* Background sparkles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot Icon */}
        <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-orange-500/30 mb-4 animate-bounce">
          🚗
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-amber-300 bg-amber-950/90 px-3 py-1 rounded-full border border-amber-500/40">
          Rücksitz-Antworten Generator
        </span>

        <h2 className="text-3xl font-black text-slate-100 mt-2">
          SIND WIR SCHON DA?!
        </h2>

        {/* Big Progress Dial */}
        <div className="my-5 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-inner">
          <div className="text-5xl font-black text-amber-400 mb-1">
            {Math.round(progressPercent)}%
          </div>
          <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-semibold">
            Noch {remainingMiles} km bis nach {destination.name}
          </p>
        </div>

        {/* Funny Comparison Card */}
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 text-left space-y-2 mb-6">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Verbleibende Zeit: {formatMinutesLeft(estimatedMinutesLeft)}</span>
          </div>
          <p className="text-slate-200 text-base font-semibold leading-relaxed">
            "{funnyAnswers[1]}"
          </p>
          <p className="text-slate-300 text-sm font-medium">
            💡 {funnyAnswers[2]}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => speakText(`Sind wir schon da? ${fullText}`)}
            className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Laut vorlesen</span>
          </button>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-3 rounded-2xl text-sm transition cursor-pointer"
          >
            Alles klar!
          </button>
        </div>
      </div>
    </div>
  );
};
