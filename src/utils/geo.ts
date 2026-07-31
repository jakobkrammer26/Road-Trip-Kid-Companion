// Haversine distance in miles
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Calculate interpolated coordinates along a line
export function interpolateLatLng(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  fraction: number // 0 to 1
): { lat: number; lng: number } {
  const safeFraction = Math.max(0, Math.min(1, fraction));
  return {
    lat: lat1 + (lat2 - lat1) * safeFraction,
    lng: lng1 + (lng2 - lng1) * safeFraction,
  };
}

// Format minutes into human readable "1 Std. 24 Min."
export function formatMinutesLeft(minutes: number): string {
  if (minutes <= 0) return 'Angekommen!';
  if (minutes < 60) return `${Math.ceil(minutes)} Min.`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.ceil(minutes % 60);
  return `${hours} Std. ${mins} Min.`;
}
