import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Play, Pause, Compass, Zap, WifiOff, Navigation, Sparkles, MapPin, Locate, ArrowUp, CornerUpLeft, CornerUpRight, RotateCw, Flag } from 'lucide-react';
import { TripState, VehicleAvatar, RouteData } from '../types';
import { interpolateLatLng } from '../utils/geo';
import { fetchRealRoute } from '../utils/navigation';

interface MapViewProps {
  tripState: TripState;
  onUpdateTripProgress: (progress: number) => void;
  selectedVehicle: VehicleAvatar;
  isOfflineMode: boolean;
  onSelectTownFact: (townName: string, fact: string) => void;
  isGpsActive?: boolean;
  onToggleGps?: () => void;
  onOpenLeoAssistant?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  tripState,
  onUpdateTripProgress,
  selectedVehicle,
  isOfflineMode,
  onSelectTownFact,
  isGpsActive = false,
  onToggleGps,
  onOpenLeoAssistant,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [mapStyle, setMapStyle] = useState<'osm' | 'dark' | 'satellite'>('dark');
  const [isPlayingDrive, setIsPlayingDrive] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const { origin, destination, progressPercent } = tripState;

  // Calculate current vehicle coordinates (either real GPS or interpolated simulated route)
  const currentPos = isGpsActive
    ? { lat: tripState.currentLat, lng: tripState.currentLng }
    : routeData && routeData.coordinates.length > 0
    ? (() => {
        const idx = Math.min(
          Math.floor((progressPercent / 100) * (routeData.coordinates.length - 1)),
          routeData.coordinates.length - 1
        );
        const [lat, lng] = routeData.coordinates[idx];
        return { lat, lng };
      })()
    : interpolateLatLng(origin.lat, origin.lng, destination.lat, destination.lng, progressPercent / 100);

  // Fetch real OSRM turn-by-turn route whenever origin or destination changes
  useEffect(() => {
    let isMounted = true;
    async function loadRoute() {
      const data = await fetchRealRoute(origin.lat, origin.lng, destination.lat, destination.lng);
      if (isMounted) {
        setRouteData(data);
      }
    }
    loadRoute();
    return () => {
      isMounted = false;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Update current turn step based on proximity to route coordinates
  useEffect(() => {
    if (!routeData || routeData.steps.length === 0) return;

    if (routeData.coordinates && routeData.coordinates.length > 0) {
      let closestIdx = 0;
      let minDistSq = Infinity;
      for (let i = 0; i < routeData.coordinates.length; i++) {
        const dLat = routeData.coordinates[i][0] - currentPos.lat;
        const dLng = routeData.coordinates[i][1] - currentPos.lng;
        const distSq = dLat * dLat + dLng * dLng;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestIdx = i;
        }
      }

      const ratio = closestIdx / Math.max(1, routeData.coordinates.length - 1);
      const stepIdx = Math.min(
        routeData.steps.length - 1,
        Math.floor(ratio * routeData.steps.length)
      );
      setCurrentStepIndex(stepIdx);
    } else {
      const stepIdx = Math.min(
        Math.floor((progressPercent / 100) * routeData.steps.length),
        routeData.steps.length - 1
      );
      setCurrentStepIndex(stepIdx);
    }
  }, [currentPos.lat, currentPos.lng, progressPercent, routeData]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([currentPos.lat, currentPos.lng], 7);

      L.control.zoom({ position: 'topright' }).addTo(map);
      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Tile layer updater based on map style & offline mode
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (mapStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO';
    } else if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      tileAttr = 'Tiles &copy; Esri, OpenStreetMap contributors';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: tileAttr,
    }).addTo(map);
  }, [mapStyle, isOfflineMode]);

  // Update Route Polyline and Markers
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }

    const latLngs: [number, number][] = routeData && routeData.coordinates.length > 0
      ? routeData.coordinates
      : [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ];

    const polyline = L.polyline(latLngs, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.85,
    }).addTo(map);
    polylineRef.current = polyline;

    // Custom car avatar marker icon
    const carIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-12 h-12 rounded-full bg-gradient-to-r ${selectedVehicle.color} flex items-center justify-center text-2xl shadow-xl ring-4 ring-amber-400 border-2 border-slate-900 animate-bounce">
          ${selectedVehicle.emoji}
        </div>
        <div class="absolute -bottom-1 text-[10px] font-black bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500 whitespace-nowrap shadow">
          ${selectedVehicle.name}
        </div>
      </div>
    `;

    const carIcon = L.divIcon({
      html: carIconHtml,
      className: 'vehicle-marker-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
      vehicleMarkerRef.current.setIcon(carIcon);
    } else {
      const marker = L.marker([currentPos.lat, currentPos.lng], { icon: carIcon }).addTo(map);
      vehicleMarkerRef.current = marker;
    }

    // Start and Destination Pin Markers
    const startIcon = L.divIcon({
      html: `<div class="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-xl shadow-lg border-2 border-white text-xs whitespace-nowrap">🚩 Start: ${origin.name}</div>`,
      className: 'start-icon',
      iconAnchor: [30, 15],
    });

    const destIcon = L.divIcon({
      html: `<div class="bg-red-500 text-white font-black px-2.5 py-1 rounded-xl shadow-lg border-2 border-white text-xs whitespace-nowrap animate-pulse">🏁 Ziel: ${destination.name}</div>`,
      className: 'dest-icon',
      iconAnchor: [30, 15],
    });

    L.marker([origin.lat, origin.lng], { icon: startIcon }).addTo(map);
    L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map);

    // Intermediate Rest Stop
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;
    const poiIcon = L.divIcon({
      html: `<div class="bg-purple-600 text-amber-200 font-extrabold px-2 py-0.5 rounded-lg shadow text-[11px] border border-purple-400">✨ Raststätte Sonnental</div>`,
      className: 'poi-icon',
      iconAnchor: [40, 10]
    });
    
    const poiMarker = L.marker([midLat, midLng], { icon: poiIcon }).addTo(map);
    poiMarker.bindPopup(`
      <div class="p-2 text-slate-900">
        <strong class="text-sm font-bold">✨ Raststätte Sonnental</strong>
        <p class="text-xs mt-1 font-medium">Berühmt für das leckerste Riesen-Eis und Dino-Figuren am Straßenrand!</p>
      </div>
    `);

  }, [origin, destination, selectedVehicle, routeData]);

  // Update vehicle marker position and map auto-follow whenever currentPos or isGpsActive updates (e.g. Wi-Fi positioning)
  useEffect(() => {
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
    }
    if (isGpsActive && leafletMapRef.current) {
      leafletMapRef.current.panTo([currentPos.lat, currentPos.lng], { animate: true });
    }
  }, [currentPos.lat, currentPos.lng, isGpsActive]);

  // Animate driving position update continuously
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animateDrive = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlayingDrive && !isGpsActive) {
        const step = 0.5 * speedMultiplier * delta;
        onUpdateTripProgress((progressPercent + step) % 100);
      }

      animationFrame = requestAnimationFrame(animateDrive);
    };

    animationFrame = requestAnimationFrame(animateDrive);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlayingDrive, speedMultiplier, progressPercent, isGpsActive]);

  // Recenter map to vehicle
  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.panTo([currentPos.lat, currentPos.lng], { animate: true });
    }
  };

  const currentStep = routeData?.steps[currentStepIndex];

  const renderTurnIcon = (type?: string) => {
    if (type === 'turn-left') return <CornerUpLeft className="w-5 h-5 text-amber-300" />;
    if (type === 'turn-right') return <CornerUpRight className="w-5 h-5 text-amber-300" />;
    if (type === 'roundabout') return <RotateCw className="w-5 h-5 text-cyan-300" />;
    if (type === 'arrive') return <Flag className="w-5 h-5 text-emerald-400" />;
    return <ArrowUp className="w-5 h-5 text-blue-300" />;
  };

  return (
    <div className="relative w-full h-[340px] sm:h-[440px] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      {/* Top Turn-by-Turn Navigation Header Banner */}
      <div className="absolute top-3 left-3 right-14 z-10 bg-slate-950/90 border border-slate-700/80 p-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center justify-between text-slate-100 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-lg border border-blue-400/30">
            {currentStep ? renderTurnIcon(currentStep.type) : <Navigation className="w-5 h-5 animate-pulse" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
              <span>{isGpsActive ? 'Live WLAN Navigation' : 'GPS Route'}</span>
              {currentStep && (
                <span className="text-amber-300 font-bold">• In {currentStep.distanceKm} km</span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-black truncate text-slate-100">
              {currentStep?.instruction || `Navigiere nach ${destination.name}`}
            </p>
          </div>
        </div>

        {/* GPS Live Mode Switcher */}
        {onToggleGps && (
          <button
            onClick={onToggleGps}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              isGpsActive
                ? 'bg-emerald-500 text-slate-950 shadow-lg ring-2 ring-emerald-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
            }`}
          >
            <Locate className={`w-3.5 h-3.5 ${isGpsActive ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isGpsActive ? 'WLAN Ortung Aktiv' : 'WLAN Ortung An'}</span>
          </button>
        )}
      </div>

      {/* Floating Assistant "Leo" 🦁 Trigger Button */}
      {onOpenLeoAssistant && (
        <button
          onClick={onOpenLeoAssistant}
          className="absolute bottom-16 right-4 z-20 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="text-2xl animate-bounce">🦁</span>
          <div className="text-left leading-none">
            <span className="text-xs font-black block">"Hi Leo!"</span>
            <span className="text-[9px] font-extrabold text-amber-950 opacity-90 uppercase">Co-Pilot Fragen</span>
          </div>
        </button>
      )}

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* OpenStreetMap Brand Badge Overlay */}
      <div className="absolute top-16 left-3 z-10 flex items-center gap-2">
        <div className="bg-slate-950/90 border border-slate-700 text-amber-300 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xl backdrop-blur-md">
          <span className="text-sm">🗺️</span>
          <span>OpenStreetMap Live</span>
        </div>

        {isOfflineMode && (
          <div className="bg-amber-950/90 border border-amber-500/50 text-amber-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline-Karten</span>
          </div>
        )}
      </div>

      {/* Map Control Bar Overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          {!isGpsActive && (
            <button
              onClick={() => setIsPlayingDrive(!isPlayingDrive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isPlayingDrive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                  : 'bg-emerald-600 text-white font-bold'
              }`}
            >
              {isPlayingDrive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlayingDrive ? 'Simulation pausieren' : 'Simulation starten'}</span>
            </button>
          )}

          {!isGpsActive && (
            <button
              onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 5 : 1)}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tempo {speedMultiplier}x</span>
            </button>
          )}
        </div>

        {/* Map Layer Switcher & Recenter */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecenter}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auto zentrieren</span>
          </button>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setMapStyle('osm')}
              className={`px-2.5 py-1 rounded-lg transition ${mapStyle === 'osm' || mapStyle === 'standard' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              OSM Standard
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1 rounded-lg transition ${mapStyle === 'dark' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              OSM Dark
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg transition ${mapStyle === 'satellite' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Satellit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

