import { PlaceLocation, OfflineMapPack, VehicleAvatar, LicensePlate } from '../types';

export const POPULAR_DESTINATIONS: PlaceLocation[] = [
  {
    id: 'europapark',
    name: 'Europa-Park Rust',
    stateOrCountry: 'Baden-Württemberg, Deutschland',
    lat: 48.2689,
    lng: 7.7217,
    funFact: 'Deutschlands größter Freizeitpark mit über 100 Attraktionen und Achterbahnen!',
    imageUrl: 'https://images.unsplash.com/photo-1541447271487-09612b3f49f7?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'neuschwanstein',
    name: 'Schloss Neuschwanstein',
    stateOrCountry: 'Bayern, Deutschland',
    lat: 47.5576,
    lng: 10.7498,
    funFact: 'Das echte Märchenschloss mitten in den Alpen – wie aus dem Disney-Film!',
    imageUrl: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'nordsee',
    name: 'Nordsee & Wattenmeer',
    stateOrCountry: 'Schleswig-Holstein, Deutschland',
    lat: 54.3000,
    lng: 8.5000,
    funFact: 'Bei Ebbe zieht sich das Meer komplett zurück und du kannst auf dem Meeresboden laufen!',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'berlin-tv',
    name: 'Berliner Fernsehturm',
    stateOrCountry: 'Berlin, Deutschland',
    lat: 52.5200,
    lng: 13.4050,
    funFact: 'Der Turm ist 368 Meter hoch und seine Kugel dreht sich ganz langsam im Kreis!',
    imageUrl: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'alpen-zugspitze',
    name: 'Zugspitze Alpen',
    stateOrCountry: 'Garmisch-Partenkirchen, Bayern',
    lat: 47.4210,
    lng: 10.9853,
    funFact: 'Der höchste Berg Deutschlands – hier gibt es sogar im Sommer echten Schnee!',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'omas-haus',
    name: 'Omas Keks-Haus',
    stateOrCountry: 'Sonnental, Deutschland',
    lat: 50.1109,
    lng: 8.6821,
    funFact: 'Hier warten unendlich viele selbstgebackene Schokokekse und warme Umarmungen!',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_ORIGIN: PlaceLocation = {
  id: 'muenchen',
  name: 'München Hauptbahnhof',
  stateOrCountry: 'Bayern, Deutschland',
  lat: 48.1351,
  lng: 11.5820,
  funFact: 'Bekannt für die Surfer auf der Eisbach-Welle und den Englischen Garten!'
};

export const VEHICLE_AVATARS: VehicleAvatar[] = [
  { id: 'red-lightning', name: 'Blitz-Flitzer', emoji: '🏎️', color: 'from-red-500 to-orange-500', description: 'Superschneller Rennwagen mit Flammen-Muster!' },
  { id: 'yellow-bus', name: 'Zirkus-Bus', emoji: '🚌', color: 'from-amber-400 to-yellow-500', description: 'Gelber Reisebus voller Musik und guter Laune!' },
  { id: 'blue-camper', name: 'Abenteuer-Camper', emoji: '🚐', color: 'from-blue-500 to-cyan-400', description: 'Gemütlicher Urlaubsbus mit Snack-Vorrat!' },
  { id: 'monster-truck', name: 'Monster-Truck', emoji: '🛻', color: 'from-emerald-500 to-teal-600', description: 'Riesige Reifen, die jedes Schlagloch überrollt!' },
  { id: 'rocket-saucer', name: 'Kosmisches UFO', emoji: '🛸', color: 'from-purple-500 to-indigo-600', description: 'Schwebt 5 cm lautlos über dem Asphalt!' },
  { id: 'pink-convertible', name: 'Sommer-Cabrio', emoji: '🚗', color: 'from-pink-400 to-rose-500', description: 'Cooles rosa Cabrio mit Sonnenbrille!' },
];

export const OFFLINE_MAP_PACKS: OfflineMapPack[] = [
  {
    id: 'deutschland-autobahn',
    name: 'Deutschland Autobahn & Alpen',
    region: 'Mitteleuropa',
    sizeMb: 95,
    tileCount: 520,
    isDownloaded: true,
    downloadProgress: 100,
    description: 'Vollständige Straßenkarten für Deutschland von Hamburg bis München & Neuschwanstein.'
  },
  {
    id: 'alpen-express',
    name: 'Alpen-Pass & Österreich',
    region: 'Alpenregion',
    sizeMb: 110,
    tileCount: 650,
    isDownloaded: false,
    downloadProgress: 0,
    description: 'Offline-Karten für Österreich, die Schweiz & romantische Bergpässe.'
  },
  {
    id: 'europa-freizeitparks',
    name: 'Europa Freizeitpark Route',
    region: 'Westeuropa',
    sizeMb: 140,
    tileCount: 780,
    isDownloaded: false,
    downloadProgress: 0,
    description: 'Karten für Europa-Park, Disneyland Paris, Eiffelturm & Nordsee.'
  },
  {
    id: 'italien-mittelmeer',
    name: 'Italien & Mittelmeer Küste',
    region: 'Südeuropa',
    sizeMb: 125,
    tileCount: 680,
    isDownloaded: false,
    downloadProgress: 0,
    description: 'Küstenstraßen bis Rom, Venedig & Gardasee.'
  }
];

export const INITIAL_LICENSE_PLATES: LicensePlate[] = [
  { id: 'b', state: 'Berlin', code: 'B', spotted: true, flagEmoji: '🐻' },
  { id: 'm', state: 'München', code: 'M', spotted: true, flagEmoji: '🥨' },
  { id: 'hh', state: 'Hamburg', code: 'HH', spotted: false, flagEmoji: '⚓' },
  { id: 'f', state: 'Frankfurt', code: 'F', spotted: false, flagEmoji: '🏙️' },
  { id: 'k', state: 'Köln', code: 'K', spotted: false, flagEmoji: '🏰' },
  { id: 's', state: 'Stuttgart', code: 'S', spotted: false, flagEmoji: '🚗' },
  { id: 'dd', state: 'Dresden', code: 'DD', spotted: false, flagEmoji: '🎨' },
  { id: 'n', state: 'Nürnberg', code: 'N', spotted: false, flagEmoji: '👑' },
  { id: 'w', state: 'Wien (Österreich)', code: 'W', spotted: false, flagEmoji: '🎡' },
  { id: 'zh', state: 'Zürich (Schweiz)', code: 'ZH', spotted: false, flagEmoji: '🏔️' }
];

export const FUNNY_ROAD_JOKES = [
  "Warum tragen Bienen Kämme? Weil sie so viele Waben haben!",
  "Wie nennt man einen schlafenden Dinosaurier? Einen Dino-Schnarcher!",
  "Warum konnte der Teddybär keinen Nachtisch mehr essen? Weil er schon voll war!",
  "Was ist grün und tippt am Computer? Ein Sumpf-Bot!",
  "Warum schläft das Fahrrad an der Wand? Weil es einfach zu müde war!",
  "Wie nennt man einen sauberen Saurier? Einen Picobello-Saurus!",
  "Was macht ein Mathematiker im Garten? Er zieht Wurzeln!",
  "Warum trinken Mäuse keinen Alkohol? Weil sie Angst vor dem Kater haben!",
  "Was ist gelb und kann nicht schwimmen? Ein Bagger!"
];
