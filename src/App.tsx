import React, { useState, useEffect } from 'react';
import { IpadFrame } from './components/IpadFrame';
import { AnnouncementCard } from './components/AnnouncementCard';
import { DestinationSelector } from './components/DestinationSelector';
import { MapView } from './components/MapView';
import { OfflineMapManager } from './components/OfflineMapManager';
import { AreWeThereYetModal } from './components/AreWeThereYetModal';
import { LicensePlateGame } from './components/LicensePlateGame';
import { KidSoundboard } from './components/KidSoundboard';
import { CarCustomizerModal } from './components/CarCustomizerModal';
import { LeoAssistantModal } from './components/LeoAssistantModal';

import {
  TripState,
  PlaceLocation,
  AnnouncementItem,
  OfflineMapPack,
  VehicleAvatar,
  LicensePlate
} from './types';

import {
  POPULAR_DESTINATIONS,
  INITIAL_ORIGIN,
  VEHICLE_AVATARS,
  OFFLINE_MAP_PACKS,
  INITIAL_LICENSE_PLATES
} from './data/mockData';

import { calculateDistanceMiles } from './utils/geo';
import { useGeolocation } from './hooks/useGeolocation';
import { getStreetNameFromCoords } from './utils/navigation';
import { Map, HardDrive, Gamepad2, Compass, Radio, Locate, Sparkles, AlertCircle, Bluetooth, Smartphone } from 'lucide-react';
import { BluetoothParentSyncModal } from './components/BluetoothParentSyncModal';
import { ParentPhoneSyncState } from './types';

export default function App() {
  // Real GPS Geolocation Hook
  const { isGpsActive, coords, gpsError, enableGps, disableGps } = useGeolocation();

  // Trip State
  const [tripState, setTripState] = useState<TripState>(() => {
    const dest = POPULAR_DESTINATIONS[0]; // Disneyland default
    const totalDist = calculateDistanceMiles(
      INITIAL_ORIGIN.lat,
      INITIAL_ORIGIN.lng,
      dest.lat,
      dest.lng
    );
    const initialProgress = 35; // 35% along route
    const remaining = Math.round(totalDist * (1 - initialProgress / 100));
    const estMins = Math.round((remaining / 65) * 60);

    return {
      origin: INITIAL_ORIGIN,
      destination: dest,
      currentLat: INITIAL_ORIGIN.lat,
      currentLng: INITIAL_ORIGIN.lng,
      progressPercent: initialProgress,
      totalDistanceMiles: totalDist,
      remainingMiles: remaining,
      speedMph: 65,
      estimatedMinutesLeft: estMins,
      isDriving: true,
      driveSpeedMultiplier: 1,
      isRealGpsActive: false,
    };
  });

  // Leo Assistant Modal State
  const [isLeoAssistantOpen, setIsLeoAssistantOpen] = useState<boolean>(false);

  // Bluetooth Parent Phone Sync State
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState<boolean>(false);
  const [parentSyncState, setParentSyncState] = useState<ParentPhoneSyncState>({
    isConnected: true,
    deviceName: 'Papas iPhone 15 Pro',
    deviceType: 'iphone',
    batteryPercent: 88,
    connectionType: 'bluetooth',
    isSharingGps: true,
    isSharingGoogleMaps: true,
    syncedDestinationName: 'Europa-Park Rust',
    lastSyncTimestamp: Date.now(),
  });

  // Sync real GPS position when GPS is active
  useEffect(() => {
    if (isGpsActive && coords) {
      const realDistMiles = calculateDistanceMiles(
        coords.lat,
        coords.lng,
        tripState.destination.lat,
        tripState.destination.lng
      );
      const estMins = Math.round((realDistMiles / Math.max(20, coords.speedKmH || 60)) * 60);

      setTripState(prev => {
        // Only set origin once when live GPS is activated
        const isFirstGpsActivation = !prev.isRealGpsActive;
        const totalDist = isFirstGpsActivation ? Math.max(realDistMiles, 1) : (prev.totalDistanceMiles || realDistMiles);
        const progress = Math.min(99, Math.max(0, Math.round(((totalDist - realDistMiles) / totalDist) * 100)));

        const newOrigin = isFirstGpsActivation
          ? {
              id: 'live-origin',
              name: 'Mein Standort (iPad Live)',
              stateOrCountry: 'Deutschland',
              lat: coords.lat,
              lng: coords.lng,
              funFact: 'Dein Standort von Apple Safari Ortungsdienst',
            }
          : prev.origin;

        return {
          ...prev,
          origin: newOrigin,
          currentLat: coords.lat,
          currentLng: coords.lng,
          totalDistanceMiles: totalDist,
          remainingMiles: Math.round(realDistMiles),
          progressPercent: progress,
          estimatedMinutesLeft: estMins,
          isRealGpsActive: true,
          speedMph: coords.speedKmH || prev.speedMph,
        };
      });

      // Fetch reverse geocode street name
      getStreetNameFromCoords(coords.lat, coords.lng).then(street => {
        setTripState(prev => ({
          ...prev,
          currentStreetName: street,
        }));
      });
    } else {
      setTripState(prev => ({ ...prev, isRealGpsActive: false }));
    }
  }, [isGpsActive, coords, tripState.destination.lat, tripState.destination.lng]);

  // Announcements & Timer (2-5 minute interval)
  const [timerIntervalMinutes, setTimerIntervalMinutes] = useState<number>(3);
  const [nextAnnouncementSecondsLeft, setNextAnnouncementSecondsLeft] = useState<number>(180);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState<boolean>(false); // Totally quiet by default as requested!

  // Settings & Navigation Tabs
  const [activeTab, setActiveTab] = useState<'drive' | 'offline' | 'games'>('drive');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlinePacks, setOfflinePacks] = useState<OfflineMapPack[]>(OFFLINE_MAP_PACKS);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleAvatar>(VEHICLE_AVATARS[0]);
  const [licensePlates, setLicensePlates] = useState<LicensePlate[]>(INITIAL_LICENSE_PLATES);

  // Modals
  const [isAreWeThereYetOpen, setIsAreWeThereYetOpen] = useState<boolean>(false);
  const [isCarCustomizerOpen, setIsCarCustomizerOpen] = useState<boolean>(false);

  // Fetch initial announcement on mount
  useEffect(() => {
    fetchAnnouncement('joke');
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setNextAnnouncementSecondsLeft(prev => {
        if (prev <= 1) {
          // Trigger next announcement
          fetchAnnouncement();
          return timerIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerIntervalMinutes, tripState.destination.name]);

  // Handler for timer interval update
  const handleSetTimerInterval = (mins: number) => {
    setTimerIntervalMinutes(mins);
    setNextAnnouncementSecondsLeft(mins * 60);
  };

  // Fetch Announcement from Backend API with Gemini / Offline Fallback
  const fetchAnnouncement = async (requestedType?: 'joke' | 'fact') => {
    try {
      const res = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextPlace: 'Raststätte Sonnental',
          destination: tripState.destination.name,
          type: requestedType || (Math.random() > 0.5 ? 'joke' : 'fact'),
        }),
      });

      const data = await res.json();
      const newItem: AnnouncementItem = {
        id: `ann-${Date.now()}`,
        text: data.text,
        type: requestedType || 'joke',
        locationName: tripState.destination.name,
        timestamp: Date.now(),
      };
      setCurrentAnnouncement(newItem);
    } catch (err) {
      console.warn('Error fetching announcement:', err);
    }
  };

  // Select new destination
  const handleSelectDestination = (dest: PlaceLocation) => {
    const totalDist = calculateDistanceMiles(
      tripState.origin.lat,
      tripState.origin.lng,
      dest.lat,
      dest.lng
    );
    const initialProgress = 5;
    const remaining = Math.round(totalDist * (1 - initialProgress / 100));
    const estMins = Math.round((remaining / 65) * 60);

    setTripState(prev => ({
      ...prev,
      destination: dest,
      progressPercent: initialProgress,
      totalDistanceMiles: totalDist,
      remainingMiles: remaining,
      estimatedMinutesLeft: estMins,
    }));

    // Trigger immediate announcement for new destination!
    fetchAnnouncement('fact');
  };

  // Update trip progress continuously with hands-free auto destination loop when 100% reached
  const handleUpdateTripProgress = (newProgress: number) => {
    if (newProgress >= 99.5) {
      // Auto-switch to next destination in list hands-free!
      const currentIndex = POPULAR_DESTINATIONS.findIndex(d => d.id === tripState.destination.id);
      const nextIndex = (currentIndex + 1) % POPULAR_DESTINATIONS.length;
      const nextDest = POPULAR_DESTINATIONS[nextIndex];
      handleSelectDestination(nextDest);
      return;
    }

    const remaining = Math.round(tripState.totalDistanceMiles * (1 - newProgress / 100));
    const estMins = Math.round((remaining / tripState.speedMph) * 60);

    setTripState(prev => ({
      ...prev,
      progressPercent: newProgress,
      remainingMiles: remaining,
      estimatedMinutesLeft: estMins,
    }));
  };

  // Toggle download offline map pack simulator
  const handleToggleDownloadPack = (packId: string) => {
    setOfflinePacks(prev =>
      prev.map(p => {
        if (p.id === packId) {
          if (p.isDownloaded) {
            return { ...p, isDownloaded: false, downloadProgress: 0 };
          }
          // Simulate step progress download
          return { ...p, downloadProgress: 10 };
        }
        return p;
      })
    );

    // Simulate animated download
    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 30;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setOfflinePacks(prev =>
          prev.map(p => (p.id === packId ? { ...p, isDownloaded: true, downloadProgress: 100 } : p))
        );
      } else {
        setOfflinePacks(prev =>
          prev.map(p => (p.id === packId ? { ...p, downloadProgress: currentProgress } : p))
        );
      }
    }, 400);
  };

  // License plate spot toggle
  const handleToggleSpotPlate = (id: string) => {
    setLicensePlates(prev =>
      prev.map(p => (p.id === id ? { ...p, spotted: !p.spotted } : p))
    );
  };

  return (
    <IpadFrame isOfflineMode={isOfflineMode}>
      {/* Top iPad Tab Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${selectedVehicle.color} flex items-center justify-center text-xl shadow border border-white/20`}>
            {selectedVehicle.emoji}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-100 leading-none">
              Kinder-Autofahrt Auto-Pilot
            </h1>
            <p className="text-[11px] text-amber-400 font-bold mt-0.5">
              iPad Fahr-App • {tripState.destination.name}
            </p>
          </div>
        </div>

        {/* Navigation View Tabs & Leo Assistant Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsLeoAssistantOpen(true)}
            className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:scale-105 active:scale-95 text-slate-950 font-black px-3.5 py-1.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg border border-amber-300 transition cursor-pointer"
          >
            <span className="text-base animate-pulse">🦁</span>
            <span>Hi Leo!</span>
          </button>

          <button
            onClick={() => setIsBluetoothModalOpen(true)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border ${
              parentSyncState.isConnected
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Bluetooth className={`w-3.5 h-3.5 ${parentSyncState.isConnected ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{parentSyncState.isConnected ? 'Eltern BT Sync Active' : 'Bluetooth Handy Verbinden'}</span>
          </button>

          <button
            onClick={isGpsActive ? disableGps : enableGps}
            className={`px-3 py-1.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border ${
              isGpsActive
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Locate className={`w-3.5 h-3.5 ${isGpsActive ? 'animate-spin text-slate-950' : 'text-amber-400'}`} />
            <span>{isGpsActive ? 'WLAN Ortung Aktiv' : 'WLAN Ortung An'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-extrabold">
            <button
              onClick={() => setActiveTab('drive')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'drive'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Fahr-Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('offline')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'offline'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Offline-Karten</span>
            </button>

            <button
              onClick={() => setActiveTab('games')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'games'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Reise-Spiele</span>
            </button>
          </div>
        </div>
      </div>

      {/* GPS Error Alert if permission denied */}
      {gpsError && (
        <div className="bg-red-950/90 border-b border-red-500/40 text-red-200 text-xs px-4 py-2 font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{gpsError}</span>
          </span>
          <button onClick={enableGps} className="underline hover:text-white cursor-pointer">Erneut versuchen</button>
        </div>
      )}

      {/* Main Content Body */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col gap-5 max-w-6xl mx-auto w-full">
        {activeTab === 'drive' && (
          <>
            {/* 1. Feature 1: 2-5 min Auto Joke & Fact Announcement Card */}
            <AnnouncementCard
              currentAnnouncement={currentAnnouncement}
              onFetchNewAnnouncement={fetchAnnouncement}
              timerIntervalMinutes={timerIntervalMinutes}
              onSetTimerInterval={handleSetTimerInterval}
              nextAnnouncementSecondsLeft={nextAnnouncementSecondsLeft}
              isSpeechEnabled={isSpeechEnabled}
              onToggleSpeech={() => setIsSpeechEnabled(!isSpeechEnabled)}
              nextPlaceName={tripState.destination.name}
            />

            {/* 2. Feature 2: Destination & Route Info ("Where we are driving to & how long to get there") */}
            <DestinationSelector
              tripState={tripState}
              onSelectDestination={handleSelectDestination}
              selectedVehicle={selectedVehicle}
              onOpenCarCustomizer={() => setIsCarCustomizerOpen(true)}
              onOpenAreWeThereYet={() => setIsAreWeThereYetOpen(true)}
            />

            {/* 3. Feature 3: Interactive Leaflet Map with real OSRM routing & car marker */}
            <MapView
              tripState={tripState}
              onUpdateTripProgress={handleUpdateTripProgress}
              selectedVehicle={selectedVehicle}
              isOfflineMode={isOfflineMode}
              isGpsActive={isGpsActive}
              onToggleGps={isGpsActive ? disableGps : enableGps}
              onOpenLeoAssistant={() => setIsLeoAssistantOpen(true)}
              onSelectTownFact={(name, fact) => {
                setCurrentAnnouncement({
                  id: `town-${Date.now()}`,
                  text: fact,
                  type: 'fact',
                  locationName: name,
                  timestamp: Date.now(),
                });
              }}
            />

            {/* Quick soundboard bar on dashboard */}
            <KidSoundboard />
          </>
        )}

        {activeTab === 'offline' && (
          <OfflineMapManager
            packs={offlinePacks}
            onToggleDownloadPack={handleToggleDownloadPack}
            isOfflineMode={isOfflineMode}
            onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
          />
        )}

        {activeTab === 'games' && (
          <div className="flex flex-col gap-5">
            <LicensePlateGame
              plates={licensePlates}
              onToggleSpotPlate={handleToggleSpotPlate}
            />
            <KidSoundboard />
          </div>
        )}
      </div>

      {/* Are We There Yet Modal */}
      <AreWeThereYetModal
        isOpen={isAreWeThereYetOpen}
        onClose={() => setIsAreWeThereYetOpen(false)}
        tripState={tripState}
      />

      {/* Car Customizer Modal */}
      <CarCustomizerModal
        isOpen={isCarCustomizerOpen}
        onClose={() => setIsCarCustomizerOpen(false)}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
      />

      {/* Assistant Leo AI Modal */}
      <LeoAssistantModal
        isOpen={isLeoAssistantOpen}
        onClose={() => setIsLeoAssistantOpen(false)}
        tripState={tripState}
        vehicleEmoji={selectedVehicle.emoji}
        onSelectDestination={handleSelectDestination}
      />

      {/* Bluetooth Parent Phone Sync Modal */}
      <BluetoothParentSyncModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        syncState={parentSyncState}
        onUpdateSyncState={newState =>
          setParentSyncState(prev => ({ ...prev, ...newState }))
        }
        onSyncDestinationFromPhone={handleSelectDestination}
        destinationsList={POPULAR_DESTINATIONS}
      />
    </IpadFrame>
  );
}
