export function speakText(
  text: string,
  options?: {
    pitch?: number;
    rate?: number;
    volume?: number;
    onEnd?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser environment.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = options?.pitch ?? 1.2; // slightly higher pitch for fun kid sound
  utterance.rate = options?.rate ?? 1.0;
  utterance.volume = options?.volume ?? 1.0;

  utterance.lang = 'de-DE';

  // Try to find a friendly clear German voice if available
  const voices = window.speechSynthesis.getVoices();
  const germanVoice = voices.find(
    v => (v.lang.startsWith('de') || v.lang.includes('DE'))
  );

  if (germanVoice) {
    utterance.voice = germanVoice;
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
