import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = isNativePlatform ? 'https://eatoff.app' : '';

export interface Marketplace {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  currencyCode: string;
  currencySymbol: string;
  isActive: boolean;
  isDefault: boolean;
}

interface MarketplaceContextType {
  marketplace: Marketplace | null;
  isLoading: boolean;
  error: string | null;
  detectedCountry: string | null;
  detectedCountryCode: string | null;
  setMarketplaceManually: (marketplace: Marketplace) => void;
  refreshLocation: () => void;
  allMarketplaces: Marketplace[];
}

const MarketplaceContext = createContext<MarketplaceContextType | null>(null);

const MARKETPLACE_STORAGE_KEY = 'eatoff_marketplace';
const COUNTRY_STORAGE_KEY = 'eatoff_detected_country';
const LOCATION_CHECK_INTERVAL = 10 * 60 * 1000;

async function reverseGeocode(lat: number, lng: number): Promise<{ country: string; countryCode: string } | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/reverse-geocode?lat=${lat}&lng=${lng}`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const country = data.country;
    const countryCode = data.countryCode;
    
    if (country && countryCode) {
      return { country, countryCode };
    }
    
    return null;
  } catch {
    return null;
  }
}

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [marketplace, setMarketplace] = useState<Marketplace | null>(() => {
    const stored = localStorage.getItem(MARKETPLACE_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });
  
  const [allMarketplaces, setAllMarketplaces] = useState<Marketplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(() => {
    const stored = localStorage.getItem(COUNTRY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.countryCode || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const initializedRef = useRef(false);
  const lastLocationCheckRef = useRef(0);

  const fetchMarketplaces = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/marketplaces`);
      if (response.ok) {
        const data = await response.json();
        setAllMarketplaces(data);
        return data as Marketplace[];
      }
    } catch (err) {
      console.error('[Marketplace] Failed to fetch marketplaces:', err);
    }
    return [];
  }, []);

  const findMarketplaceByCountry = useCallback((countryCode: string, marketplaces: Marketplace[]): Marketplace | null => {
    const active = marketplaces.filter(m => m.isActive);
    const match = active.find(m => m.countryCode.toUpperCase() === countryCode.toUpperCase());
    
    if (match) {
      return match;
    }
    
    const defaultMarketplace = active.find(m => m.isDefault);
    return defaultMarketplace || active[0] || null;
  }, []);

  const detectLocationAndSetMarketplace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const marketplaces = await fetchMarketplaces();
      
      if (marketplaces.length === 0) {
        setError('No marketplaces available');
        setIsLoading(false);
        return;
      }

      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        if (isNativePlatform) {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 600000
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } else if ('geolocation' in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 600000
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      } catch {
      }

      let selectedMarketplace: Marketplace | null = null;

      if (latitude !== null && longitude !== null) {
        const geoResult = await reverseGeocode(latitude, longitude);
        
        if (geoResult) {
          setDetectedCountry(geoResult.country);
          setDetectedCountryCode(geoResult.countryCode);
          localStorage.setItem(COUNTRY_STORAGE_KEY, JSON.stringify(geoResult));
          
          selectedMarketplace = findMarketplaceByCountry(geoResult.countryCode, marketplaces);
        }
      }

      if (!selectedMarketplace) {
        const storedCountry = localStorage.getItem(COUNTRY_STORAGE_KEY);
        if (storedCountry) {
          try {
            const parsed = JSON.parse(storedCountry);
            if (parsed.countryCode) {
              selectedMarketplace = findMarketplaceByCountry(parsed.countryCode, marketplaces);
            }
          } catch {}
        }
      }

      if (!selectedMarketplace) {
        selectedMarketplace = marketplaces.find(m => m.isDefault && m.isActive) || 
                              marketplaces.find(m => m.isActive) || 
                              marketplaces[0];
      }

      if (selectedMarketplace) {
        setMarketplace(selectedMarketplace);
        localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(selectedMarketplace));
      }

    } catch (err) {
      console.error('[Marketplace] Detection error:', err);
      setError('Failed to detect marketplace');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMarketplaces, findMarketplaceByCountry]);

  const setMarketplaceManually = useCallback((mp: Marketplace) => {
    setMarketplace(mp);
    localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(mp));
  }, []);

  const refreshLocation = useCallback(() => {
    localStorage.removeItem(MARKETPLACE_STORAGE_KEY);
    localStorage.removeItem(COUNTRY_STORAGE_KEY);
    lastLocationCheckRef.current = 0;
    initializedRef.current = false;
    detectLocationAndSetMarketplace();
  }, [detectLocationAndSetMarketplace]);

  const checkLocationMismatch = useCallback(async (currentMarketplace: Marketplace, marketplaces: Marketplace[]) => {
    const now = Date.now();
    if (now - lastLocationCheckRef.current < LOCATION_CHECK_INTERVAL) {
      return;
    }
    lastLocationCheckRef.current = now;

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (isNativePlatform) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      if (latitude !== null && longitude !== null) {
        const geoResult = await reverseGeocode(latitude, longitude);
        if (geoResult) {
          setDetectedCountry(geoResult.country);
          setDetectedCountryCode(geoResult.countryCode);
          localStorage.setItem(COUNTRY_STORAGE_KEY, JSON.stringify(geoResult));

          if (geoResult.countryCode.toUpperCase() !== currentMarketplace.countryCode.toUpperCase()) {
            const newMarketplace = findMarketplaceByCountry(geoResult.countryCode, marketplaces);
            if (newMarketplace && newMarketplace.id !== currentMarketplace.id) {
              setMarketplace(newMarketplace);
              localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(newMarketplace));
            }
          }
        }
      }
    } catch {
    }
  }, [findMarketplaceByCountry]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const storedMarketplace = localStorage.getItem(MARKETPLACE_STORAGE_KEY);
    
    if (storedMarketplace) {
      try {
        const parsed = JSON.parse(storedMarketplace);
        setMarketplace(parsed);
        setIsLoading(false);
        fetchMarketplaces();
      } catch {
        detectLocationAndSetMarketplace();
      }
    } else {
      detectLocationAndSetMarketplace();
    }
  }, [detectLocationAndSetMarketplace, fetchMarketplaces]);

  return (
    <MarketplaceContext.Provider value={{
      marketplace,
      isLoading,
      error,
      detectedCountry,
      detectedCountryCode,
      setMarketplaceManually,
      refreshLocation,
      allMarketplaces
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
