import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, RefreshCw, Radio, ThumbsUp, MapPin, Clock } from 'lucide-react';
import { AnnouncementItem } from '../types';
import { speakText, stopSpeech } from '../utils/speech';

interface AnnouncementCardProps {
  currentAnnouncement: AnnouncementItem | null;
  onFetchNewAnnouncement: (type?: 'joke' | 'fact') => void;
  timerIntervalMinutes: number;
  onSetTimerInterval: (minutes: number) => void;
  nextAnnouncementSecondsLeft: number;
  isSpeechEnabled: boolean;
  onToggleSpeech: () => void;
  nextPlaceName: string;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  currentAnnouncement,
  onFetchNewAnnouncement,
  timerIntervalMinutes,
  onSetTimerInterval,
  nextAnnouncementSecondsLeft,
  isSpeechEnabled,
  onToggleSpeech,
  nextPlaceName
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Auto-speak when a new announcement text arrives if speech is enabled
  useEffect(() => {
    if (currentAnnouncement && isSpeechEnabled) {
      setIsSpeaking(true);
      speakText(currentAnnouncement.text, {
        onEnd: () => setIsSpeaking(false)
      });
    }
  }, [currentAnnouncement?.id, isSpeechEnabled]);

  const handleManualSpeak = () => {
    if (!currentAnnouncement) return;
    setIsSpeaking(true);
    speakText(currentAnnouncement.text, {
      onEnd: () => setIsSpeaking(false)
    });
  };

  const handleToggleMute = () => {
    if (isSpeechEnabled) {
      stopSpeech();
      setIsSpeaking(false);
    }
    onToggleSpeech();
  };

  const minutesRemaining = Math.floor(nextAnnouncementSecondsLeft / 60);
  const secondsRemaining = nextAnnouncementSecondsLeft % 60;
  const timeFormatted = `${minutesRemaining}:${secondsRemaining < 10 ? '0' : ''}${secondsRemaining}`;

  // Progress percentage for timer circle
  const totalSeconds = timerIntervalMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - nextAnnouncementSecondsLeft) / totalSeconds) * 100));

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/15 to-purple-500/10 border-2 border-amber-400/40 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative ambient background flares */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header bar: Kid Radio Mascot & Timer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-900 font-extrabold text-2xl animate-pulse-slow">
            📻
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                Rücksitz Kinder-Radio
              </span>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                ✨ Hands-Free Auto-Pilot
              </span>
              {currentAnnouncement?.type === 'fact' ? (
                <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  📍 Ort-Fakt
                </span>
              ) : (
                <span className="text-[11px] font-bold text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded-full border border-pink-500/30">
                  😂 Kinderwitz
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 mt-0.5 flex items-center gap-1.5">
              <span>Nächste automatische Durchsage in {timeFormatted}</span>
            </h2>
          </div>
        </div>

        {/* Speech Mute & Timer Selector Controls */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1 text-xs text-slate-400 px-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-medium">Intervall:</span>
          </div>
          {[1, 2, 3, 5].map(mins => (
            <button
              key={mins}
              onClick={() => onSetTimerInterval(mins)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                timerIntervalMinutes === mins
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {mins}m
            </button>
          ))}
          <div className="h-4 w-px bg-slate-800 my-auto mx-1"></div>
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              isSpeechEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title={isSpeechEnabled ? 'Ton stumm schalten' : 'Sprachausgabe aktivieren'}
          >
            {isSpeechEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-amber-400" />}
            <span className="hidden md:inline">{isSpeechEnabled ? 'Stimme AN' : 'Stumm (Quiet)'}</span>
          </button>
        </div>
      </div>

      {/* Main Announcement Box (1 Sentence displayed prominently) */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 relative shadow-inner">
        {/* Progress Bar under card */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {currentAnnouncement ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-amber-400/90 font-medium mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Nächster Zwischenhalt: <strong className="text-slate-200">{nextPlaceName || 'Autobahn'}</strong></span>
                {isSpeaking && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold ml-2 animate-pulse">
                    <Volume2 className="w-3.5 h-3.5" /> Liest vor...
                  </span>
                )}
              </div>
              <p className="text-lg sm:text-2xl font-extrabold text-slate-100 tracking-wide leading-snug font-sans">
                "{currentAnnouncement.text}"
              </p>
            </div>

            {/* Read Aloud Button */}
            <button
              onClick={handleManualSpeak}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-3 rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Volume2 className="w-5 h-5" />
              <span>Vorlesen</span>
            </button>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400">
            <Radio className="w-8 h-8 text-amber-400 mx-auto animate-spin mb-2" />
            <p className="font-semibold text-slate-200">Lade nächsten Kinderwitz & Fakt auf Deutsch...</p>
          </div>
        )}
      </div>

      {/* Bottom Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFetchNewAnnouncement('joke')}
            className="bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 border border-pink-500/40 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>😂 Neuen Witz erzählen</span>
          </button>
          <button
            onClick={() => onFetchNewAnnouncement('fact')}
            className="bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>💡 Ort-Fakt abrufen</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onFetchNewAnnouncement()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Jetzt Durchsage testen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
