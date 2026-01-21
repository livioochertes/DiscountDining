import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, X, Navigation, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeliveryMapProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  onClose: () => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  inline?: boolean;
}

export default function DeliveryMap({ onLocationSelect, onClose, initialLocation, inline = false }: DeliveryMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(initialLocation ? { ...initialLocation } : null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    lat: initialLocation?.latitude || 46.2276,
    lng: initialLocation?.longitude || 2.2137
  });

  // Get current user location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      alert('Geolocation is not supported by your browser. Please enter your address manually or search for a location.');
      return;
    }

    setIsLoadingLocation(true);
    console.log('Requesting geolocation permission...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Geolocation success:', position.coords);
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        
        // Get address for current location
        setIsLoadingAddress(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          console.log('Reverse geocoding result:', data);
          
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setSelectedLocation({
            latitude,
            longitude,
            address
          });
          setIsLoadingLocation(false);
          setIsLoadingAddress(false);
        } catch (error) {
          console.error('Error getting address:', error);
          setSelectedLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          });
          setIsLoadingLocation(false);
          setIsLoadingAddress(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoadingLocation(false);
        
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location permissions in your browser and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please try searching for your address instead.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or search for your address manually.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please try searching for your address manually.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  // Search for address
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoadingAddress(true);
    console.log('Searching for address:', searchQuery);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      console.log('Search results:', data);
      
      if (data && data.length > 0) {
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        console.log('Found location:', { latitude, longitude, address: result.display_name });
        
        setMapCenter({ lat: latitude, lng: longitude });
        setSelectedLocation({
          latitude,
          longitude,
          address: result.display_name
        });
      } else {
        alert('Address not found. Please try a different search term or be more specific (e.g., include city and country).');
      }
      setIsLoadingAddress(false);
    } catch (error) {
      console.error('Error searching address:', error);
      alert('Error searching for address. Please check your internet connection and try again.');
      setIsLoadingAddress(false);
    }
  }, [searchQuery]);

  // Confirm location selection
  const handleConfirmLocation = useCallback(() => {
    if (selectedLocation && selectedLocation.address) {
      onLocationSelect({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedLocation.address
      });
    }
  }, [selectedLocation, onLocationSelect]);

  const mapContent = (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search Controls */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={getCurrentLocation}
            size="sm"
            disabled={isLoadingLocation}
            className="flex items-center space-x-2"
          >
            <Navigation className="h-4 w-4" />
            <span>{isLoadingLocation ? 'Getting Location...' : 'Use My Location'}</span>
          </Button>
        </div>
            
        <div className="space-y-2">
          <Label htmlFor="address-search">Search for an address</Label>
          <div className="flex space-x-2">
            <Input
              id="address-search"
              placeholder="Try: Cluj-Napoca, Romania or your address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoadingAddress || !searchQuery.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {isLoadingAddress && (
            <p className="text-sm text-gray-500">Searching for address...</p>
          )}
          {!selectedLocation && (
            <p className="text-xs text-gray-500">
              After searching, click "Select This Address" to use this location for delivery
            </p>
          )}
        </div>
      </div>

      {/* Map Display */}
      <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng-0.01},${mapCenter.lat-0.01},${mapCenter.lng+0.01},${mapCenter.lat+0.01}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`}
          width="100%"
          height={inline ? "250" : "400"}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Delivery Location Map"
        ></iframe>
        
        {selectedLocation && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-start space-x-2">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Selected Location</p>
                <p className="text-xs text-gray-600 mt-1">
                  {isLoadingAddress ? 'Loading address...' : selectedLocation.address}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button for inline mode */}
      {inline && selectedLocation && (
        <Button 
          onClick={handleConfirmLocation}
          disabled={!selectedLocation || isLoadingAddress}
          className="w-full"
        >
          Select This Address
        </Button>
      )}
    </div>
  );

  if (inline) {
    return mapContent;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Select Delivery Location</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 p-4">
          {mapContent}
          
          {/* Location Details */}
          {selectedLocation && (
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Delivery Address</h3>
              <p className="text-sm text-gray-600 mb-3">
                {selectedLocation.address || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
              </p>
              <p className="text-xs text-gray-500">
                Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="text-sm text-gray-600">
              {!selectedLocation ? "Search for an address or use your location first" : "Ready to save this location"}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmLocation}
                disabled={!selectedLocation || isLoadingAddress}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6"
              >
                Save This Address
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}