import { RouteData, RouteStep } from '../types';

// Fetch real turn-by-turn driving route from OSRM (Open Source Routing Machine)
export async function fetchRealRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<RouteData> {
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(osrmUrl);
    if (!response.ok) {
      throw new Error(`OSRM HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      const coordsGeoJson = primaryRoute.geometry.coordinates; // [lng, lat]
      
      // Convert to [lat, lng] for Leaflet
      const coordinates: [number, number][] = coordsGeoJson.map(
        (pt: [number, number]) => [pt[1], pt[0]]
      );

      const distanceKm = Math.round((primaryRoute.distance / 1000) * 10) / 10;
      const durationMinutes = Math.round(primaryRoute.duration / 60);

      // Parse turn-by-turn steps
      const steps: RouteStep[] = [];
      if (primaryRoute.legs && primaryRoute.legs[0] && primaryRoute.legs[0].steps) {
        primaryRoute.legs[0].steps.forEach((st: any) => {
          let germanInstruction = st.maneuver?.type || 'Geradeaus fahren';
          const streetName = st.name || '';
          const streetSuffix = streetName ? ` auf ${streetName}` : '';
          let stepType: RouteStep['type'] = 'straight';

          if (st.maneuver?.type === 'turn') {
            if (st.maneuver.modifier?.includes('right')) {
              germanInstruction = `Rechts abbiegen${streetSuffix}`;
              stepType = 'turn-right';
            } else if (st.maneuver.modifier?.includes('left')) {
              germanInstruction = `Links abbiegen${streetSuffix}`;
              stepType = 'turn-left';
            } else {
              germanInstruction = `Abbiegen${streetSuffix}`;
              stepType = 'turn-right';
            }
          } else if (st.maneuver?.type === 'new name' || st.maneuver?.type === 'continue') {
            germanInstruction = `Weiterfahren${streetSuffix}`;
            stepType = 'straight';
          } else if (st.maneuver?.type === 'roundabout') {
            germanInstruction = `Im Kreisverkehr ${st.maneuver.exit || 2}. Ausfahrt nehmen${streetSuffix}`;
            stepType = 'roundabout';
          } else if (st.maneuver?.type === 'depart') {
            germanInstruction = `Fahrt starten${streetSuffix}`;
            stepType = 'depart';
          } else if (st.maneuver?.type === 'arrive') {
            germanInstruction = `Ziel erreicht! 🏁`;
            stepType = 'arrive';
          }

          const location: [number, number] | undefined = st.maneuver?.location
            ? [st.maneuver.location[1], st.maneuver.location[0]]
            : undefined;

          steps.push({
            instruction: germanInstruction,
            streetName: streetName || undefined,
            type: stepType,
            distanceKm: Math.round((st.distance / 1000) * 10) / 10,
            durationMins: Math.round(st.duration / 60),
            location,
          });
        });
      }

      return {
        coordinates,
        distanceKm,
        durationMinutes,
        steps: steps.length > 0 ? steps : [
          { instruction: 'Dem Straßenverlauf folgen', distanceKm, durationMins: durationMinutes }
        ]
      };
    }
  } catch (err) {
    console.warn('OSRM routing API unavailable or error, using calculated route polyline:', err);
  }

  // Fallback route interpolation
  const numPoints = 25;
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const frac = i / numPoints;
    const lat = startLat + (destLat - startLat) * frac;
    const lng = startLng + (destLng - startLng) * frac;
    // Add small realistic curvature bend
    const bend = Math.sin(frac * Math.PI) * 0.08;
    coordinates.push([lat + bend, lng - bend * 0.5]);
  }

  // Approx straight distance
  const R = 6371; // Earth radius in km
  const dLat = ((destLat - startLat) * Math.PI) / 180;
  const dLng = ((destLng - startLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((startLat * Math.PI) / 180) *
      Math.cos((destLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c * 1.2 * 10) / 10;
  const durationMinutes = Math.round((distanceKm / 100) * 60);

  return {
    coordinates,
    distanceKm,
    durationMinutes,
    steps: [
      { instruction: 'Dem Straßenverlauf auf der Autobahn folgen', distanceKm: distanceKm * 0.8, durationMins: durationMinutes * 0.8 },
      { instruction: 'Ausfahrt in Richtung Ziel nehmen', distanceKm: distanceKm * 0.2, durationMins: durationMinutes * 0.2 },
      { instruction: 'Ankunft am Zielort 🏁', distanceKm: 0, durationMins: 0 }
    ]
  };
}

// Reverse Geocoding helper (OSM Nominatim) to get current street name
export async function getStreetNameFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'iPadRoadTripApp/1.0' } });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const road = addr.road || addr.pedestrian || addr.suburb || addr.city || addr.town || addr.village;
        const city = addr.city || addr.town || addr.village || addr.county;
        if (road && city) return `${road}, ${city}`;
        if (road) return road;
        if (city) return city;
      }
    }
  } catch (e) {
    console.warn('Reverse geocode failed:', e);
  }
  return 'Autobahn Route';
}
