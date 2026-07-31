import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Send, Sparkles, Volume2, HelpCircle, MapPin } from 'lucide-react';
import { LeoMessage, PlaceLocation, TripState } from '../types';
import { speakText } from '../utils/speech';
import { OpenStreetMapEmbed } from './OpenStreetMapEmbed';

interface LeoAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripState: TripState;
  vehicleEmoji: string;
  onSelectDestination?: (place: PlaceLocation) => void;
}

const FAMOUS_OSM_PLACES: Record<string, { lat: number; lng: number; name: string; description: string }> = {
  'europa-park': { lat: 48.2689, lng: 7.7217, name: 'Europa-Park Rust', description: 'Deutschlands größter Freizeitpark' },
  'europapark': { lat: 48.2689, lng: 7.7217, name: 'Europa-Park Rust', description: 'Deutschlands größter Freizeitpark' },
  'neuschwanstein': { lat: 47.5576, lng: 10.7498, name: 'Schloss Neuschwanstein', description: 'Märchenschloss in Bayern' },
  'berlin': { lat: 52.5200, lng: 13.4050, name: 'Berlin Fernsehturm', description: 'Hauptstadt von Deutschland' },
  'münchen': { lat: 48.1351, lng: 11.5820, name: 'München Marienplatz', description: 'Landeshauptstadt von Bayern' },
  'hamburg': { lat: 53.5511, lng: 9.9937, name: 'Hamburg Hafen & Speicherstadt', description: 'Berühmte Hafenstadt' },
  'paris': { lat: 48.8566, lng: 2.3522, name: 'Eiffelturm Paris', description: 'Hauptstadt von Frankreich' },
  'wien': { lat: 48.2082, lng: 16.3738, name: 'Wien Prater Riesenrad', description: 'Hauptstadt von Österreich' },
  'disneyland': { lat: 33.8121, lng: -117.9190, name: 'Disneyland Park', description: 'Magischer Vergnügungspark' },
};

async function findOsmLocation(query: string, reply: string, tripState: TripState) {
  const combined = (query + ' ' + reply).toLowerCase();

  if (combined.includes('wo sind wir') || combined.includes('aktuell') || combined.includes('standort') || combined.includes('hier')) {
    return {
      name: tripState.origin.name || 'Aktueller Standort (iPad)',
      lat: tripState.currentLat || tripState.origin.lat,
      lng: tripState.currentLng || tripState.origin.lng,
      description: 'Aktuelle Position auf der OpenStreetMap-Karte',
    };
  }

  if (combined.includes('ziel') || combined.includes('wohin fahren') || combined.includes('wie weit')) {
    return {
      name: tripState.destination.name,
      lat: tripState.destination.lat,
      lng: tripState.destination.lng,
      description: `Reiseziel: ${tripState.destination.stateOrCountry}`,
    };
  }

  for (const [key, val] of Object.entries(FAMOUS_OSM_PLACES)) {
    if (combined.includes(key)) {
      return val;
    }
  }

  // Fallback: try OpenStreetMap Nominatim Geocoding API if a place name is mentioned
  const words = query.replace(/(hi leo|hallo|wo liegt|wo ist|zeige mir|auf der karte|open street map|openstreetmap)/gi, '').trim();
  if (words.length > 2) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(words)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          name: data[0].display_name.split(',')[0],
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          description: 'Gefunden via OpenStreetMap Geocoding',
        };
      }
    } catch (e) {
      console.warn('OSM Nominatim lookup error:', e);
    }
  }

  return null;
}

export const LeoAssistantModal: React.FC<LeoAssistantModalProps> = ({
  isOpen,
  onClose,
  tripState,
  vehicleEmoji,
  onSelectDestination,
}) => {
  const [messages, setMessages] = useState<LeoMessage[]>([
    {
      id: 'leo-welcome',
      sender: 'leo',
      text: 'Hallo! Ich bin Leo, dein Reise-Assistent! 🦁 Frag mich nach dem Standort, unserem Ziel oder Städten – ich zeige sie dir direkt auf OpenStreetMap!',
      timestamp: Date.now(),
      locationMarker: {
        name: tripState.destination.name,
        lat: tripState.destination.lat,
        lng: tripState.destination.lng,
        description: `Euer Urlaubsziel (${tripState.destination.stateOrCountry}) auf OpenStreetMap`,
      },
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech Recognition setup for "Hi Leo" hotword
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'de-DE';

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript.toLowerCase();
            console.log('Speech input:', transcript);

            if (transcript.includes('hi leo') || transcript.includes('hallo leo') || transcript.includes('hey leo')) {
              setWakeWordDetected(true);
              // Extract text after hotword
              let query = transcript
                .replace(/.*(hi leo|hallo leo|hey leo)/i, '')
                .trim();

              if (event.results[i].isFinal) {
                if (!query) query = 'Hallo Leo! Was machst du?';
                handleSendMessage(query);
                setWakeWordDetected(false);
              }
            } else if (event.results[i].isFinal && isListening) {
              handleSendMessage(transcript.trim());
            }
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition init failed:', e);
      }
    }
  }, [tripState.destination.name]);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      alert('Spracherkennung wird in diesem Browser leider nicht unterstützt. Bitte benutze das Textfeld!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Start speech error:', e);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputValue.trim();
    if (!messageText) return;

    const userMsg: LeoMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/leo-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          tripInfo: {
            destination: tripState.destination.name,
            remainingMiles: tripState.remainingMiles,
            vehicleName: vehicleEmoji,
          },
        }),
      });

      const data = await res.json();
      const leoReply = data.reply || 'Roar! Da ist wohl etwas schiefgegangen, aber wir fahren munter weiter! 🦁';

      // Find OpenStreetMap location associated with query / reply
      const osmLoc = await findOsmLocation(messageText, leoReply, tripState);

      const leoMsg: LeoMessage = {
        id: `leo-${Date.now()}`,
        sender: 'leo',
        text: leoReply,
        timestamp: Date.now(),
        locationMarker: osmLoc || undefined,
      };

      setMessages(prev => [...prev, leoMsg]);
      // Speak Leo's reply automatically out loud in German!
      speakText(leoReply);
    } catch (err) {
      console.warn('Error talking to Leo:', err);
      const fallbackMsg: LeoMessage = {
        id: `leo-err-${Date.now()}`,
        sender: 'leo',
        text: 'Ich bin Leo, dein Reise-Löwe! Wir sind gleich an unserem fantastischen Ziel! 🦁✨',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
      speakText(fallbackMsg.text);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full h-[620px] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 p-4 flex items-center justify-between text-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-3xl shadow-inner border border-amber-300">
              🦁
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-black text-slate-950">Leo Co-Pilot</h2>
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-400">
                  OpenStreetMap Live
                </span>
              </div>
              <p className="text-xs font-extrabold text-amber-950/90 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Sag "Hi Leo!" für OpenStreetMap Ortsfragen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 p-2 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        {isListening && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Leo hört zu... Sag "Hi Leo" oder sprich deine Frage!</span>
            </span>
            {wakeWordDetected && (
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md font-black text-[10px]">
                "Hi Leo" Erkannt!
              </span>
            )}
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60">
          {messages.map(msg => {
            const isLeo = msg.sender === 'leo';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[90%] ${isLeo ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {isLeo && (
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg shrink-0">
                    🦁
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-sm font-medium leading-relaxed ${
                    isLeo
                      ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-xs shadow'
                      : 'bg-amber-500 text-slate-950 font-bold rounded-tr-xs shadow-md'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* OpenStreetMap Embedded Widget if locationMarker is present */}
                  {isLeo && msg.locationMarker && (
                    <OpenStreetMapEmbed
                      lat={msg.locationMarker.lat}
                      lng={msg.locationMarker.lng}
                      locationName={msg.locationMarker.name}
                      description={msg.locationMarker.description}
                      onCenterOnMainMap={(lat, lng, name) => {
                        if (onSelectDestination) {
                          onSelectDestination({
                            id: `osm-${Date.now()}`,
                            name: name,
                            stateOrCountry: 'OpenStreetMap Standort',
                            lat,
                            lng,
                            funFact: 'Via Leo OpenStreetMap Assistent geladen!',
                          });
                        }
                        onClose();
                      }}
                    />
                  )}

                  {isLeo && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Vorlesen
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg shrink-0 animate-bounce">
                🦁
              </div>
              <div className="bg-slate-800 border border-slate-700 text-slate-300 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Leo sucht Standort & Infos auf OpenStreetMap...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <span className="text-slate-400 shrink-0 text-[11px] flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-400" /> Fragen:
          </span>
          <button
            onClick={() => handleSendMessage('Hi Leo! Wo sind wir gerade auf der OpenStreetMap Karte?')}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border border-slate-700"
          >
            🗺️ Wo sind wir auf OSM?
          </button>
          <button
            onClick={() => handleSendMessage('Hi Leo! Wo liegt der Europa-Park auf der Karte?')}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border border-slate-700"
          >
            🎢 Europa-Park zeigen
          </button>
          <button
            onClick={() => handleSendMessage('Hi Leo! Wo liegt Schloss Neuschwanstein?')}
            className="bg-slate-800 hover:bg-slate-700 text-pink-300 px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border border-slate-700"
          >
            🏰 Schloss Neuschwanstein
          </button>
          <button
            onClick={() => handleSendMessage('Hi Leo! Erzähl mir einen super lustigen Kinderwitz!')}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border border-slate-700"
          >
            😂 Kinderwitz
          </button>
          <button
            onClick={() => handleSendMessage('Hi Leo! Wie weit ist es noch und wie lange fahren wir noch?')}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border border-slate-700"
          >
            ⏱️ Wie weit noch?
          </button>
        </div>

        {/* Input area */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleVoiceListening}
            className={`p-3 rounded-2xl font-bold transition flex items-center justify-center shrink-0 cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
            }`}
            title={isListening ? 'Mikrofon ausschalten' : 'Spracheingabe starten ("Hi Leo")'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder='Sag "Hi Leo" oder tippe eine Frage...'
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 text-slate-100 placeholder-slate-500 rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black p-3 rounded-2xl transition cursor-pointer shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
