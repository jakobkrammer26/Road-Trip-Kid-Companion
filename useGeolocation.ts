import { useState, useEffect, useCallback, useRef } from 'react';

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy: number;
  speedKmH: number;
  heading: number | null;
  locationSource: 'wifi-browser' | 'wifi-ip' | 'gps';
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaLambda = (lng2 - lng1) * rad;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return Math.round(((theta * 180) / Math.PI + 360) % 360);
}

export function useGeolocation() {
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const prevPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  // Fetch location from IP / Wi-Fi network API as reliable fallback
  const fetchWifiIpLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setCoords({
            lat: data.latitude,
            lng: data.longitude,
            accuracy: 1000,
            speedKmH: 0,
            heading: 0,
            locationSource: 'wifi-ip',
          });
          setGpsError(null);
          return true;
        }
      }
    } catch (err) {
      console.warn('Wi-Fi IP location fallback failed:', err);
    }
    return false;
  };

  useEffect(() => {
    let watchId: number | null = null;

    if (isGpsActive) {
      setGpsError(null);

      // Use HTML5 Geolocation with high accuracy (uses Apple CoreLocation Wi-Fi positioning on iPads)
      if ('geolocation' in navigator) {
        // First get current position immediately
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude, accuracy, speed, heading } = position.coords;
            setCoords({
              lat: latitude,
              lng: longitude,
              accuracy: accuracy || 10,
              speedKmH: speed ? Math.round(speed * 3.6) : 0,
              heading: heading ?? 0,
              locationSource: 'wifi-browser',
            });
          },
          err => {
            console.warn('Initial location lookup failed:', err);
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );

        // Then watch position for continuous updates
        watchId = navigator.geolocation.watchPosition(
          position => {
            const { latitude, longitude, accuracy, speed, heading } = position.coords;
            const now = Date.now();

            let calculatedHeading = heading;
            let calculatedSpeed = speed ? Math.round(speed * 3.6) : 0;

            if (prevPosRef.current) {
              const prev = prevPosRef.current;
              const distMeters = Math.hypot(
                (latitude - prev.lat) * 111000,
                (longitude - prev.lng) * 111000 * Math.cos((latitude * Math.PI) / 180)
              );
              const timeSecs = (now - prev.time) / 1000;

              if (distMeters > 5 && (calculatedHeading === null || calculatedHeading === undefined)) {
                calculatedHeading = calculateBearing(prev.lat, prev.lng, latitude, longitude);
              }

              if (timeSecs > 0 && calculatedSpeed === 0) {
                calculatedSpeed = Math.round((distMeters / timeSecs) * 3.6);
              }
            }

            prevPosRef.current = { lat: latitude, lng: longitude, time: now };

            setCoords({
              lat: latitude,
              lng: longitude,
              accuracy: accuracy || 10,
              speedKmH: calculatedSpeed,
              heading: calculatedHeading ?? 0,
              locationSource: 'wifi-browser',
            });
          },
          error => {
            console.warn('Geolocation browser warning:', error);
            let errMsg = 'Standort-Zugriff im Browser prüfen.';
            if (error.code === error.PERMISSION_DENIED) {
              errMsg = 'Bitte Standort-Zugriff im iPad/Browser erlauben, damit dein echter Standort geladen werden kann!';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errMsg = 'Standort derzeit nicht verfügbar. Stelle sicher, dass WLAN & Ortungsdienste aktiviert sind.';
            } else if (error.code === error.TIMEOUT) {
              errMsg = 'Standort-Abfrage hat zu lange gedauert.';
            }
            setGpsError(errMsg);
          },
          {
            enableHighAccuracy: true, // TRUE so Apple Safari uses CoreLocation Wi-Fi positioning (same as Apple Maps)
            timeout: 25000,
            maximumAge: 2000,
          }
        );
      } else {
        setGpsError('Browser unterstützt keine Standortabfrage.');
      }
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isGpsActive]);

  // Handle iPad gyroscope device orientation for live compass heading
  useEffect(() => {
    if (!isGpsActive) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.alpha !== undefined) {
        // alpha is 0-360 compass direction
        const compassHeading = Math.round(360 - e.alpha);
        setCoords(prev => (prev ? { ...prev, heading: compassHeading } : prev));
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, [isGpsActive]);

  const enableGps = useCallback(() => {
    setIsGpsActive(true);
    // Request device orientation permission on iOS if required
    if (
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((response: string) => {
          console.log('DeviceOrientation permission response:', response);
        })
        .catch(console.error);
    }
  }, []);

  const disableGps = useCallback(() => {
    setIsGpsActive(false);
  }, []);

  return {
    isGpsActive,
    coords,
    gpsError,
    enableGps,
    disableGps,
  };
}

