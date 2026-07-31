export interface PlaceLocation {
  id: string;
  name: string;
  stateOrCountry: string;
  lat: number;
  lng: number;
  funFact: string;
  imageUrl?: string;
}

export interface AnnouncementItem {
  id: string;
  text: string;
  type: 'joke' | 'fact' | 'banter' | 'trivia';
  locationName?: string;
  timestamp: number;
  liked?: boolean;
}

export interface RouteStep {
  instruction: string;
  streetName?: string;
  type?: 'turn-left' | 'turn-right' | 'straight' | 'roundabout' | 'depart' | 'arrive';
  distanceKm: number;
  durationMins: number;
  location?: [number, number]; // [lat, lng]
}

export interface RouteData {
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMinutes: number;
  steps: RouteStep[];
}

export interface LeoMessage {
  id: string;
  sender: 'user' | 'leo';
  text: string;
  timestamp: number;
  locationMarker?: {
    name: string;
    lat: number;
    lng: number;
    zoom?: number;
    description?: string;
  };
}

export interface TripState {
  origin: PlaceLocation;
  destination: PlaceLocation;
  currentLat: number;
  currentLng: number;
  progressPercent: number; // 0 to 100
  totalDistanceMiles: number;
  remainingMiles: number;
  speedMph: number;
  estimatedMinutesLeft: number;
  isDriving: boolean;
  driveSpeedMultiplier: number; // for simulation
  isRealGpsActive?: boolean;
  currentStreetName?: string;
  routeData?: RouteData | null;
  currentTurnInstruction?: string;
}

export interface OfflineMapPack {
  id: string;
  name: string;
  region: string;
  sizeMb: number;
  tileCount: number;
  isDownloaded: boolean;
  downloadProgress: number; // 0 to 100
  description: string;
}

export interface VehicleAvatar {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export interface ParentPhoneSyncState {
  isConnected: boolean;
  deviceName: string;
  deviceType: 'iphone' | 'android' | 'car_bluetooth';
  batteryPercent: number;
  connectionType: 'bluetooth' | 'hotspot' | 'google_maps_share';
  isSharingGps: boolean;
  isSharingGoogleMaps: boolean;
  syncedDestinationName?: string;
  syncedLat?: number;
  syncedLng?: number;
  syncedSpeedKmH?: number;
  syncedHeading?: number;
  lastSyncTimestamp: number;
}

export interface LicensePlate {
  id: string;
  state: string;
  code: string;
  spotted: boolean;
  flagEmoji: string;
}
