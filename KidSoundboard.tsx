import React from 'react';
import { Volume2, Music, Sparkles } from 'lucide-react';

export const KidSoundboard: React.FC = () => {
  // Synthesize sound effects using Web Audio API so no external assets are required!
  const playSoundEffect = (type: 'horn' | 'siren' | 'vroom' | 'cheer' | 'rain') => {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    if (type === 'horn') {
      // Car horn dual square wave
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
      osc2.frequency.setValueAtTime(440.0, ctx.currentTime);  // A4

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } else if (type === 'siren') {
      // Police / Emergency vehicle siren sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'vroom') {
      // Engine Rev vroom noise
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.8);
    } else if (type === 'cheer') {
      // Crowd cheer synth chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'rain') {
      // Soft rain on glass
      const bufferSize = ctx.sampleRate * 1.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 1.0);
    }
  };

  const soundButtons = [
    { id: 'horn', name: 'Auto-Hupe', emoji: '📢', color: 'from-amber-400 to-yellow-500' },
    { id: 'vroom', name: 'Motor-Vroom', emoji: '🏎️', color: 'from-red-500 to-orange-500' },
    { id: 'siren', name: 'Polizei-Tatü', emoji: '🚨', color: 'from-blue-500 to-indigo-600' },
    { id: 'cheer', name: 'Jubel-Fanfare', emoji: '🎉', color: 'from-emerald-400 to-teal-500' },
    { id: 'rain', name: 'Regen auf Scheibe', emoji: '🌧️', color: 'from-cyan-500 to-blue-600' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-5 h-5 text-amber-400" />
        <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
          Rücksitz DJ Soundboard
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {soundButtons.map(btn => (
          <button
            key={btn.id}
            onClick={() => playSoundEffect(btn.id as any)}
            className={`p-3 rounded-2xl bg-gradient-to-br ${btn.color} text-slate-950 font-black shadow-lg hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center text-center cursor-pointer border border-white/20`}
          >
            <span className="text-2xl mb-1">{btn.emoji}</span>
            <span className="text-xs uppercase tracking-wider">{btn.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
