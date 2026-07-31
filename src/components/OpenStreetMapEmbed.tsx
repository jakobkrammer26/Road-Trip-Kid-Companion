import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface OpenStreetMapEmbedProps {
  lat: number;
  lng: number;
  locationName: string;
  description?: string;
  zoom?: number;
  onCenterOnMainMap?: (lat: number, lng: number, name: string) => void;
}

export const OpenStreetMapEmbed: React.FC<OpenStreetMapEmbedProps> = ({
  lat,
  lng,
  locationName,
  description,
  zoom = 13,
  onCenterOnMainMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize mini Leaflet OpenStreetMap
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], zoom);

      // Add official OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      // Custom Marker with Leo Icon / Pin
      const pinIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-amber-400 border-2 border-slate-900 shadow-lg flex items-center justify-center text-sm font-bold animate-bounce">
              🦁
            </div>
          </div>
        `,
        className: 'osm-embed-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([lat, lng], { icon: pinIcon }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lng], zoom);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, zoom]);

  return (
    <div className="mt-2.5 rounded-2xl border-2 border-amber-400/40 bg-slate-900 overflow-hidden shadow-lg space-y-0">
      {/* Mini Map Canvas Container */}
      <div className="relative w-full h-[160px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Top OSM Badge */}
        <div className="absolute top-2 left-2 z-[400] bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700 text-[10px] font-black text-amber-300 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>OpenStreetMap Live</span>
        </div>

        {/* Bottom OSM Copyright Credit */}
        <div className="absolute bottom-1 right-2 z-[400] bg-slate-950/70 text-[9px] text-slate-400 px-1.5 py-0.5 rounded">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-white">OpenStreetMap</a>
        </div>
      </div>

      {/* Info & Action Bar */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="min-w-0">
          <h4 className="font-extrabold text-white truncate text-xs flex items-center gap-1">
            <span>📍 {locationName}</span>
          </h4>
          {description && <p className="text-[10px] text-slate-400 truncate mt-0.5">{description}</p>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onCenterOnMainMap && (
            <button
              onClick={() => onCenterOnMainMap(lat, lng, locationName)}
              className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] flex items-center gap-1 transition shadow cursor-pointer active:scale-95"
            >
              <Navigation className="w-3 h-3" />
              Auf Hauptkarte
            </button>
          )}

          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Auf OpenStreetMap.org öffnen"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
