import React, { useState } from 'react';
import { MapPin, Navigation, Search, Sparkles, Car, Compass, CheckCircle2 } from 'lucide-react';
import { PlaceLocation, VehicleAvatar, TripState } from '../types';
import { POPULAR_DESTINATIONS } from '../data/mockData';

interface DestinationSelectorProps {
  tripState: TripState;
  onSelectDestination: (place: PlaceLocation) => void;
  selectedVehicle: VehicleAvatar;
  onOpenCarCustomizer: () => void;
  onOpenAreWeThereYet: () => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  tripState,
  onSelectDestination,
  selectedVehicle,
  onOpenCarCustomizer,
  onOpenAreWeThereYet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-place?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const newPlace: PlaceLocation = {
          id: `custom-${Date.now()}`,
          name: item.name,
          stateOrCountry: item.stateOrCountry || 'Road Destination',
          lat: item.lat,
          lng: item.lng,
          funFact: item.funFact || `An incredible journey destination to ${item.name}!`,
          imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80'
        };
        onSelectDestination(newPlace);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      console.warn('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Top Banner: Where We Are Driving To */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedVehicle.color} flex items-center justify-center text-3xl shadow-lg border border-white/20`}>
            {selectedVehicle.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Aktuelle Route
              </span>
              <button
                onClick={onOpenCarCustomizer}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
              >
                Auto ändern ({selectedVehicle.name})
              </button>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2 mt-0.5">
              <span>Fahrt nach:</span>
              <span className="text-amber-400 font-extrabold">{tripState.destination.name}</span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{tripState.destination.stateOrCountry}</span>
            </p>
          </div>
        </div>

        {/* Big "SIND WIR SCHON DA?!" Button */}
        <button
          onClick={onOpenAreWeThereYet}
          className="w-full md:w-auto bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-300 hover:to-red-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
        >
          <span className="text-2xl">🚗</span>
          <span className="text-base sm:text-lg uppercase tracking-wide">SIND WIR SCHON DA?!</span>
        </button>
      </div>

      {/* Place Search Box */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Zielort eingeben (z.B. Europa-Park, Neuschwanstein, Berlin, Omas Haus)..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-slate-100 placeholder-slate-500 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none transition shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-2xl text-sm transition shadow cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {isSearching ? <Compass className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span>Route starten</span>
          </button>
        </div>
      </form>

      {/* Quick Select Popular Kid Trips */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5 px-1 font-semibold">
          <span>⚡ Beliebte Reiseziele für Familien:</span>
          <span>Tippen zum Wählen</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {POPULAR_DESTINATIONS.map(place => {
            const isSelected = tripState.destination.id === place.id;
            return (
              <button
                key={place.id}
                onClick={() => onSelectDestination(place)}
                className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 text-slate-100'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-2 right-2" />
                )}
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-100 leading-tight group-hover:text-amber-300 transition line-clamp-1">
                    {place.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {place.stateOrCountry}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
