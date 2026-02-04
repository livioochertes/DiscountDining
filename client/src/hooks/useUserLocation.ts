import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// Check if running in native app
const isNativePlatform = Capacitor.isNativePlatform();

// Map of coordinates to cities in Romania
const CITY_COORDINATES: { name: string; lat: number; lng: number; radius: number }[] = [
  { name: 'București', lat: 44.4268, lng: 26.1025, radius: 30 },
  { name: 'Cluj-Napoca', lat: 46.7712, lng: 23.6236, radius: 20 },
  { name: 'Timișoara', lat: 45.7489, lng: 21.2087, radius: 20 },
  { name: 'Iași', lat: 47.1585, lng: 27.6014, radius: 20 },
  { name: 'Constanța', lat: 44.1598, lng: 28.6348, radius: 20 },
  { name: 'Craiova', lat: 44.3302, lng: 23.7949, radius: 15 },
  { name: 'Brașov', lat: 45.6427, lng: 25.5887, radius: 15 },
  { name: 'Galați', lat: 45.4353, lng: 28.0080, radius: 15 },
  { name: 'Ploiești', lat: 44.9462, lng: 26.0306, radius: 15 },
  { name: 'Oradea', lat: 47.0722, lng: 21.9217, radius: 15 },
  { name: 'Sibiu', lat: 45.7983, lng: 24.1256, radius: 15 },
  { name: 'Arad', lat: 46.1866, lng: 21.3123, radius: 15 },
  { name: 'Pitești', lat: 44.8565, lng: 24.8692, radius: 15 },
  { name: 'Bacău', lat: 46.5671, lng: 26.9148, radius: 15 },
  { name: 'Târgu Mureș', lat: 46.5386, lng: 24.5514, radius: 15 },
  { name: 'Baia Mare', lat: 47.6567, lng: 23.5850, radius: 15 },
  { name: 'Buzău', lat: 45.1500, lng: 26.8166, radius: 15 },
  { name: 'Satu Mare', lat: 47.7927, lng: 22.8855, radius: 15 },
  { name: 'Suceava', lat: 47.6635, lng: 26.2732, radius: 15 },
  { name: 'Piatra Neamț', lat: 46.9275, lng: 26.3706, radius: 15 },
];

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find the closest city to given coordinates
function findClosestCity(lat: number, lng: number): string | null {
  let closestCity: string | null = null;
  let minDistance = Infinity;

  for (const city of CITY_COORDINATES) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < city.radius && distance < minDistance) {
      minDistance = distance;
      closestCity = city.name;
    }
  }

  return closestCity;
}

export interface UseUserLocationResult {
  city: string | null;
  isLoading: boolean;
  error: string | null;
  isGpsEnabled: boolean;
  manualCity: string | null;
  setManualCity: (city: string | null) => void;
  requestGpsLocation: () => void;
  clearLocation: () => void;
}

const LOCATION_STORAGE_KEY = 'eatoff_user_location';
const GPS_CITY_STORAGE_KEY = 'eatoff_gps_city';

export function useUserLocation(): UseUserLocationResult {
  const [city, setCity] = useState<string | null>(() => {
    // Try to load from localStorage on init
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.city || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  
  const [manualCity, setManualCityState] = useState<string | null>(() => {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.isManual ? parsed.city : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGpsEnabled, setIsGpsEnabled] = useState(false);

  // Check if GPS is available
  useEffect(() => {
    setIsGpsEnabled('geolocation' in navigator);
  }, []);

  // Save location to localStorage
  const saveLocation = useCallback((cityName: string | null, isManual: boolean) => {
    if (cityName) {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
        city: cityName,
        isManual,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  }, []);

  // Set manual city
  const setManualCity = useCallback((cityName: string | null) => {
    setManualCityState(cityName);
    setCity(cityName);
    saveLocation(cityName, true);
    setError(null);
  }, [saveLocation]);

  // Request GPS location - uses native Capacitor plugin on mobile, browser API on web
  const requestGpsLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('[Location] Starting GPS request, isNativePlatform:', isNativePlatform);

    try {
      let latitude: number;
      let longitude: number;

      if (isNativePlatform) {
        // Use native Capacitor Geolocation plugin - only shows one native permission dialog
        console.log('[Location] Using native Capacitor Geolocation plugin');
        
        // First check/request permissions
        try {
          const permStatus = await Geolocation.checkPermissions();
          console.log('[Location] Permission status:', permStatus.location);
          
          if (permStatus.location === 'denied') {
            console.log('[Location] Permission denied, requesting...');
            const newPerm = await Geolocation.requestPermissions();
            console.log('[Location] New permission status:', newPerm.location);
            if (newPerm.location === 'denied') {
              throw { code: 1, message: 'Location permission denied' };
            }
          }
        } catch (permError) {
          console.error('[Location] Permission check error:', permError);
        }
        
        console.log('[Location] Getting current position...');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 600000
        });
        console.log('[Location] Got position:', position.coords.latitude, position.coords.longitude);
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else {
        // Use browser geolocation API for web
        console.log('[Location] Using browser geolocation');
        if (!navigator.geolocation) {
          setError('GPS not available');
          setIsLoading(false);
          return;
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 600000
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      // Use server-side reverse geocoding for accurate location detection
      console.log('[Location] Reverse geocoding coordinates:', latitude, longitude);
      
      // Determine API base URL for Capacitor
      const API_BASE_URL = isNativePlatform ? 'https://eatoff.app' : '';
      
      try {
        const geoResponse = await fetch(`${API_BASE_URL}/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          console.log('[Location] Reverse geocode result:', geoData);
          
          const detectedCity = geoData.locality;
          
          if (detectedCity) {
            setCity(detectedCity);
            setManualCityState(null);
            saveLocation(detectedCity, false);
            localStorage.setItem(GPS_CITY_STORAGE_KEY, detectedCity);
            setIsLoading(false);
            return;
          }
        }
      } catch (geoError) {
        console.warn('[Location] Reverse geocode failed, using fallback:', geoError);
      }

      // Fallback to static city list if reverse geocoding fails
      const detectedCity = findClosestCity(latitude, longitude);
      
      if (detectedCity) {
        setCity(detectedCity);
        setManualCityState(null);
        saveLocation(detectedCity, false);
        localStorage.setItem(GPS_CITY_STORAGE_KEY, detectedCity);
      } else {
        setError('Could not detect your city');
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('[Location] GPS error:', err);
      if (err?.code === 1 || err?.message?.includes('denied')) {
        setError('Location permission denied');
      } else if (err?.code === 2) {
        setError('Location unavailable');
      } else if (err?.code === 3 || err?.message?.includes('timeout')) {
        setError('Location request timed out');
      } else {
        setError('Could not get location');
      }
      setIsLoading(false);
    }
  }, [saveLocation]);

  // Clear location
  const clearLocation = useCallback(() => {
    setCity(null);
    setManualCityState(null);
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    localStorage.removeItem(GPS_CITY_STORAGE_KEY);
    setError(null);
  }, []);

  // Auto-request GPS on first load if no stored location
  useEffect(() => {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!stored && isGpsEnabled) {
      // Delay slightly to avoid blocking initial render
      const timer = setTimeout(() => {
        requestGpsLocation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGpsEnabled, requestGpsLocation]);

  return {
    city,
    isLoading,
    error,
    isGpsEnabled,
    manualCity,
    setManualCity,
    requestGpsLocation,
    clearLocation
  };
}

// Available cities for manual selection
export const AVAILABLE_CITIES = [
  'București',
  'Cluj-Napoca', 
  'Timișoara',
  'Iași',
  'Constanța',
  'Craiova',
  'Brașov',
  'Galați',
  'Ploiești',
  'Oradea',
  'Sibiu',
  'Arad',
  'Pitești',
  'Bacău',
  'Târgu Mureș',
  'Baia Mare',
  'Buzău',
  'Satu Mare',
  'Suceava',
  'Piatra Neamț',
];
