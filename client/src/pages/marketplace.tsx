import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, ChefHat, Star, ArrowRight, Store, Brain, Ticket, MapPin, Filter, User, Clock, Percent, X, Navigation, Search, Loader2, Heart, SlidersHorizontal, Flame, LogIn } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import RestaurantCard from "@/components/restaurant-card";
import RestaurantModal from "@/components/restaurant-modal";
import { AIAssistant } from "@/components/AIAssistant";
import { AIRecommendations } from "@/components/AIRecommendations";

import { api, type RestaurantFilters } from "@/lib/api";
import type { Restaurant } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { imageCache } from "@/lib/imageCache";
import { optimizeImageUrl } from "@/lib/imageOptimizer";
import { instantImageLoader } from "@/lib/instantImageLoader";

function FeaturedChefsSection() {
  const { t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const { data: featuredChefs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/chef-profiles/featured"],
  });

  // Triplicăm lista pentru loop infinit
  const infiniteChefs = useMemo(() => {
    if (featuredChefs.length === 0) return [];
    return [...featuredChefs, ...featuredChefs, ...featuredChefs];
  }, [featuredChefs]);

  // Setează scroll-ul la mijloc la încărcare
  useEffect(() => {
    if (scrollContainerRef.current && featuredChefs.length > 0) {
      const container = scrollContainerRef.current;
      const singleSetWidth = (container.scrollWidth / 3);
      container.scrollLeft = singleSetWidth;
    }
  }, [featuredChefs.length]);

  // Auto-scroll every 3 seconds cu loop infinit
  useEffect(() => {
    if (isPaused || featuredChefs.length === 0) return;
    
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const cardWidth = 140;
        const singleSetWidth = container.scrollWidth / 3;
        
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
        
        // După animație, verifică dacă trebuie să resetăm
        setTimeout(() => {
          if (container.scrollLeft >= singleSetWidth * 2) {
            container.scrollLeft = singleSetWidth;
          } else if (container.scrollLeft <= 0) {
            container.scrollLeft = singleSetWidth;
          }
        }, 350);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isPaused, featuredChefs.length]);

  // Handler pentru scroll manual - resetează poziția când ajunge la capete
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || featuredChefs.length === 0) return;
    const container = scrollContainerRef.current;
    const singleSetWidth = container.scrollWidth / 3;
    
    if (container.scrollLeft >= singleSetWidth * 2 - 50) {
      container.scrollLeft = singleSetWidth;
    } else if (container.scrollLeft <= 50) {
      container.scrollLeft = singleSetWidth;
    }
  }, [featuredChefs.length]);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Featured Chefs
          </h2>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="w-[130px] h-24 bg-gray-100 animate-pulse rounded-lg flex-shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (featuredChefs.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          Featured Chefs
        </h2>
        <Link href="/chefs">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs">
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
        onScroll={handleScroll}
      >
        {infiniteChefs.map((item, index) => {
          const chef = item.profile || item;
          const restaurant = item.restaurant;
          return (
            <Link key={`${chef.id}-${index}`} href={`/chef/${chef.id}`} className="flex-shrink-0">
              <div className="group cursor-pointer transition-transform hover:scale-[1.02] w-[130px]">
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 h-24 shadow-sm hover:shadow-md transition-shadow">
                  {chef.coverImage && (
                    <img 
                      src={chef.coverImage} 
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-6 h-6 rounded-full border border-white bg-white overflow-hidden flex-shrink-0">
                        {chef.profileImage ? (
                          <img src={chef.profileImage} alt={chef.chefName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ChefHat className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-[10px] truncate leading-tight">{chef.chefName}</p>
                        {restaurant && (
                          <p className="text-white/70 text-[9px] truncate leading-tight">{restaurant.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1 right-1">
                    <Badge className="bg-yellow-500 text-[8px] px-1 py-0">
                      <Star className="h-2 w-2 fill-current" />
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [filters, setFilters] = useState<RestaurantFilters>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [displayCount, setDisplayCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Tab state for Restaurants / AI Menu / Vouchers
  const [activeTab, setActiveTab] = useState<'restaurants' | 'ai-menu' | 'vouchers'>(() => {
    // Read initial tab from URL parameter
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'ai-menu' || tabParam === 'vouchers' || tabParam === 'restaurants') {
      return tabParam;
    }
    return 'restaurants';
  });

  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['/api/restaurants', filters],
    queryFn: () => api.getRestaurants(filters)
  });

  // Fetch AI recommendations when user is authenticated
  const { data: aiRecommendations } = useQuery({
    queryKey: ['/api/dietary/recommendations'],
    queryFn: () => api.getDietaryRecommendations(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours cache
  });

  // AI recommendations data for the AI Menu tab
  const authRecommendations = aiRecommendations?.recommendations || [];
  
  // Generate basic recommendations from restaurants for non-authenticated users
  const guestRecommendations = useMemo(() => {
    if (isAuthenticated || !restaurants || restaurants.length === 0) return [];
    const topRestaurants = [...restaurants]
      .sort((a: any, b: any) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 6);
    return topRestaurants.map((r: any, idx: number) => ({
      id: r.id || idx,
      type: 'restaurant' as const,
      targetId: r.id,
      restaurantId: r.id,
      title: r.name,
      recommendationScore: (parseFloat(r.rating) || 4) / 5,
      recommendationText: `Popular ${r.cuisine || ''} restaurant with great reviews.`,
      reasoningFactors: [],
      nutritionalMatch: 0,
      preferenceMatch: 0,
      healthGoalAlignment: 0,
      nutritionalHighlights: [],
      cautionaryNotes: [],
      reason: `Top-rated ${r.cuisine || ''} restaurant`,
      score: parseFloat(r.rating) || 4,
      restaurant: {
        id: r.id,
        name: r.name,
        cuisine: r.cuisine || '',
        location: r.location || '',
        priceRange: r.priceRange || '',
        rating: r.rating || 0,
        imageUrl: r.imageUrl || ''
      },
      dietaryTags: r.dietaryTags || []
    }));
  }, [isAuthenticated, restaurants]);

  const allRecommendations = isAuthenticated ? authRecommendations : guestRecommendations;
  
  // State for recommendation type filter
  const [recommendationType, setRecommendationType] = useState<string>('both');
  const [selectedMealType, setSelectedMealType] = useState<string>('any');
  
  // State for "Use My Dietary Profile" toggle in AI Menu
  const [useDietaryProfile, setUseDietaryProfile] = useState(true);
  
  // State for manual AI Menu filters (when dietary profile toggle is off)
  const [manualDietType, setManualDietType] = useState<string>('all');
  const [manualCalories, setManualCalories] = useState<string>('all');
  const [manualRating, setManualRating] = useState<string>('all');
  
  // Fetch user's dietary profile
  const { data: userDietaryProfile } = useQuery<any>({
    queryKey: ['/api/dietary/profile'],
    enabled: isAuthenticated,
  });
  
  // State for recommendation modal
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  
  // State for location modal with Google Places
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const placesContainerRef = useRef<HTMLDivElement>(null);

  // Load Google Maps script dynamically
  useEffect(() => {
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) return;
    
    // Check if already loaded
    if ((window as any).google?.maps?.places) {
      setGoogleMapsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkLoaded = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          setGoogleMapsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Simple modal close - no scroll manipulation
  const handleCloseModal = useCallback(() => {
    console.log('Modal close requested');
    setShowRecommendationModal(false);
    setSelectedRecommendation(null);
  }, []);

  // Initialize Google Places API
  useEffect(() => {
    if (googleMapsLoaded && (window as any).google?.maps?.places) {
      autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
      if (placesContainerRef.current) {
        placesServiceRef.current = new (window as any).google.maps.places.PlacesService(placesContainerRef.current);
      }
    }
  }, [showLocationModal, googleMapsLoaded]);

  // Search places with debounce
  useEffect(() => {
    if (!addressSearchQuery || addressSearchQuery.length < 3 || !autocompleteServiceRef.current || !googleMapsLoaded) {
      setPlaceSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsSearchingPlaces(true);
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: addressSearchQuery,
          types: ['geocode'],
          componentRestrictions: { country: ['ro', 'es', 'fr', 'de', 'it', 'gb'] },
        },
        (predictions: any, status: any) => {
          setIsSearchingPlaces(false);
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPlaceSuggestions(predictions);
          } else {
            setPlaceSuggestions([]);
          }
        }
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [addressSearchQuery, googleMapsLoaded]);

  // Filter change handler - defined early for use in location callbacks
  const handleFilterChange = useCallback((key: keyof RestaurantFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle place selection - fetch Place Details for accurate city extraction
  const handleSelectPlace = useCallback(async (place: any) => {
    const address = place.description;
    setSelectedAddress(address);
    setAddressSearchQuery('');
    setPlaceSuggestions([]);
    setShowLocationModal(false);
    setAutoDetectLocation(false);
    
    // Use Place Details API for accurate city extraction
    try {
      const response = await fetch(`/api/places/details?place_id=${encodeURIComponent(place.place_id)}`);
      if (response.ok) {
        const details = await response.json();
        const city = details.city || details.locality || address.split(',')[0].trim();
        console.log('[Marketplace] Place Details city:', city, 'from:', address);
        setDetectedLocation(city);
        handleFilterChange('location', city);
      } else {
        // Fallback to first term
        const city = address.split(',')[0].trim();
        setDetectedLocation(city);
        handleFilterChange('location', city);
      }
    } catch (error) {
      console.error('[Marketplace] Place Details error:', error);
      const city = address.split(',')[0].trim();
      setDetectedLocation(city);
      handleFilterChange('location', city);
    }
  }, [handleFilterChange]);

  // Handle GPS location detection with correct city priority
  const handleGPSDetect = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Use Google Geocoder to get address from coordinates
        if (googleMapsLoaded && (window as any).google?.maps?.Geocoder) {
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: any, status: any) => {
              setIsDetectingLocation(false);
              if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address;
                const components = results[0].address_components || [];
                
                // Extract city with correct priority: locality > postal_town > sublocality > admin_level_2
                const getComponent = (types: string[]) => {
                  for (const type of types) {
                    const comp = components.find((c: any) => c.types?.includes(type));
                    if (comp) return comp.long_name;
                  }
                  return null;
                };
                
                const city = getComponent(['locality', 'postal_town', 'sublocality_level_1', 'administrative_area_level_2']) 
                  || address.split(',')[0].trim();
                
                console.log('[Marketplace GPS] City:', city, 'from:', address);
                setSelectedAddress(address);
                setDetectedLocation(city);
                setShowLocationModal(false);
                setAutoDetectLocation(true);
                handleFilterChange('location', city);
              }
            }
          );
        } else {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [googleMapsLoaded, handleFilterChange]);
  
  // Filter recommendations based on selected type and manual filters
  const filteredRecommendations = allRecommendations.filter((rec: any) => {
    // Filter by recommendation type
    if (recommendationType === 'restaurants' && rec.type !== 'restaurant') {
      return false;
    }
    if (recommendationType === 'menu_items' && rec.type !== 'menu_item') {
      return false;
    }
    
    // When not using dietary profile, apply manual preference filters
    if (!useDietaryProfile || !isAuthenticated) {
      if (filters.cuisine && rec.restaurant?.cuisine !== filters.cuisine) {
        return false;
      }
      if (manualDietType !== 'all') {
        const dietaryTags = rec.dietaryTags || rec.restaurant?.dietaryTags || [];
        if (!dietaryTags.some((tag: string) => tag.toLowerCase().includes(manualDietType.toLowerCase()))) {
          return false;
        }
      }
      if (manualCalories !== 'all') {
        const cal = rec.calories || rec.estimatedCalories || 0;
        if (cal > 0) {
          if (manualCalories === 'low' && cal >= 1500) return false;
          if (manualCalories === 'medium' && (cal < 1500 || cal > 2000)) return false;
          if (manualCalories === 'high' && (cal < 2000 || cal > 2500)) return false;
          if (manualCalories === 'very-high' && cal < 2500) return false;
        }
      }
    }

    // Apply filter-section filters (Prices & Rating) always
    if (filters.priceRange) {
      const recPrice = rec.restaurant?.priceRange || '';
      if (recPrice !== filters.priceRange) return false;
    }
    if (manualRating !== 'all') {
      const recRating = parseFloat(rec.restaurant?.rating) || 0;
      const minRating = parseFloat(manualRating);
      if (recRating < minRating) return false;
    }
    
    return true;
  });
  
  console.log('AI recommendations data:', { 
    allRecommendations: allRecommendations.length, 
    filteredRecommendations: filteredRecommendations.length,
    showRecommendationModal 
  });

  // Portal-based modal effect - no page interference
  useEffect(() => {
    if (showRecommendationModal) {
      console.log('Portal modal opened - focus only');
      
      // Focus modal
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    }
  }, [showRecommendationModal]);

  // Helper function to enhance recommendation with restaurant data
  const enhanceRecommendation = (rec: any) => {
    let restaurantId: number;
    let restaurantData: Restaurant | undefined;
    
    if (rec.type === 'restaurant') {
      restaurantId = rec.restaurantId || rec.targetId;
      restaurantData = restaurants.find((r: Restaurant) => r.id === restaurantId);
    } else if (rec.type === 'menu_item') {
      restaurantId = 101; // Wing Stop ID
      restaurantData = restaurants.find((r: Restaurant) => r.id === 101);
    } else {
      restaurantId = rec.restaurantId || rec.targetId;
      restaurantData = restaurants.find((r: Restaurant) => r.id === restaurantId);
    }
    
    return {
      ...rec,
      restaurant: {
        ...rec.restaurant,
        name: rec.restaurant?.name || rec.restaurantName || restaurantData?.name || `Restaurant #${restaurantId}`,
        cuisine: rec.restaurant?.cuisine || rec.cuisine || restaurantData?.cuisine || '',
        location: rec.restaurant?.location || rec.location || restaurantData?.location || '',
        priceRange: rec.restaurant?.priceRange || restaurantData?.priceRange || '',
        rating: rec.restaurant?.rating || restaurantData?.rating || 0
      }
    };
  };

  // Enhanced recommendations for AI Menu tab (all)
  const allEnhancedRecommendations = filteredRecommendations.map(enhanceRecommendation);

  // Ultra-aggressive batch preloading for visible restaurants
  useEffect(() => {
    if (restaurants.length > 0) {
      const visibleRestaurants = restaurants.slice(0, displayCount);
      const imageUrls = visibleRestaurants.map((restaurant: Restaurant) => {
        const defaultImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";
        return optimizeImageUrl(restaurant.imageUrl || defaultImage, 320, 192);
      });
      
      // Use both systems for maximum preloading speed
      Promise.all([
        imageCache.preloadBatch(imageUrls).catch(() => {}),
        instantImageLoader.batchUltraPreload(imageUrls).catch(() => {})
      ]);
    }
  }, [restaurants, displayCount]);

  const handleCuisineChange = useCallback((cuisine: string, checked: boolean) => {
    // For simplicity, we'll only support one cuisine filter at a time
    if (checked) {
      handleFilterChange('cuisine', cuisine);
    } else {
      handleFilterChange('cuisine', undefined);
    }
  }, [handleFilterChange]);

  // Fetch cuisine values from API (independent of current filters)
  const { data: availableCuisines = [], isLoading: cuisinesLoading } = useQuery<string[]>({
    queryKey: ['/api/cuisine-values'],
  });

  // Fetch location values from API (independent of current filters)
  const { data: availableLocations = [], isLoading: locationsLoading } = useQuery<string[]>({
    queryKey: ['/api/location-values'],
  });

  // Auto-detect location state
  const [autoDetectLocation, setAutoDetectLocation] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [autoDetectAttempt, setAutoDetectAttempt] = useState(0);

  // Auto-detect location using browser geolocation
  useEffect(() => {
    if (!autoDetectLocation || availableLocations.length === 0 || isDetectingLocation) return;
    if (detectedLocation) return; // Already detected
    
    if (!navigator.geolocation) {
      setLocationError("Location not supported by browser");
      setAutoDetectLocation(false);
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          
          if (!response.ok) {
            throw new Error("Geocoding service unavailable");
          }
          
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.village;
          
          if (city) {
            const matchedLocation = availableLocations.find(loc => 
              loc.toLowerCase().includes(city.toLowerCase()) || 
              city.toLowerCase().includes(loc.toLowerCase())
            );
            
            if (matchedLocation) {
              setDetectedLocation(matchedLocation);
              handleFilterChange('location', matchedLocation);
            } else {
              setLocationError(`No restaurants in ${city}`);
              handleFilterChange('location', undefined);
            }
          } else {
            setLocationError("Could not determine city");
            handleFilterChange('location', undefined);
          }
        } catch (error) {
          console.error("Error detecting location:", error);
          setLocationError("Location detection failed");
          handleFilterChange('location', undefined);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetectingLocation(false);
        handleFilterChange('location', undefined);
        setDetectedLocation(null);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied");
        } else if (error.code === error.TIMEOUT) {
          setLocationError("Location request timed out");
        } else {
          setLocationError("Could not get location");
        }
        setAutoDetectLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [autoDetectLocation, availableLocations, autoDetectAttempt, detectedLocation, handleFilterChange, isDetectingLocation]);

  const sortedRestaurants = useMemo(() => {
    return [...restaurants].sort((a, b) => {
      switch (sortBy) {
        case 'highest-discount':
          // Sort by maxDiscount field if available
          return (b.maxDiscount || 0) - (a.maxDiscount || 0);
        case 'lowest-price':
          // Sort by price range as rough approximation until packages load
          const priceOrder = { '€': 1, '€€': 2, '€€€': 3 };
          return (priceOrder[a.priceRange as keyof typeof priceOrder] || 0) - 
                 (priceOrder[b.priceRange as keyof typeof priceOrder] || 0);
        case 'best-rating':
          return parseFloat(b.rating) - parseFloat(a.rating);
        case 'expiring-soon':
          // For vouchers: prioritize restaurants with vouchers (maxDiscount > 0)
          // then by highest discount as a proxy for "active vouchers"
          const aHasVouchers = (a.maxDiscount || 0) > 0 ? 1 : 0;
          const bHasVouchers = (b.maxDiscount || 0) > 0 ? 1 : 0;
          if (bHasVouchers !== aHasVouchers) return bHasVouchers - aHasVouchers;
          return (b.maxDiscount || 0) - (a.maxDiscount || 0);
        default:
          return 0; // Keep original order for "featured"
      }
    });
  }, [restaurants, sortBy]);

  const openRestaurantModal = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
  }, []);

  const closeRestaurantModal = useCallback(() => {
    setSelectedRestaurant(null);
    setIsModalOpen(false);
  }, []);

  const openRestaurantMenu = useCallback((restaurant: Restaurant) => {
    setLocation(`/restaurant/${restaurant.id}/menu`);
  }, [setLocation]);

  const openRestaurantVouchers = useCallback((restaurant: Restaurant) => {
    setLocation(`/restaurant/${restaurant.id}/vouchers`);
  }, [setLocation]);

  const openRestaurantReservations = useCallback((restaurant: Restaurant) => {
    setLocation(`/restaurant/${restaurant.id}/reservations`);
  }, [setLocation]);

  const loadMoreRestaurants = useCallback(async () => {
    setIsLoadingMore(true);
    
    // Progressive loading - add restaurants gradually to prevent overwhelming the server
    const currentCount = displayCount;
    const nextBatch = Math.min(currentCount + 12, restaurants.length); // Smaller batches
    
    // Add restaurants in small groups with delay to stagger API calls
    for (let i = currentCount; i < nextBatch; i += 3) {
      const batchEnd = Math.min(i + 3, nextBatch);
      setDisplayCount(batchEnd);
      
      // Small delay between batches to stagger API calls
      if (batchEnd < nextBatch) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    setIsLoadingMore(false);
  }, [displayCount, restaurants.length]);

  // Ref for infinite scroll sentinel
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset pagination when filters or sorting change
  useEffect(() => {
    setDisplayCount(20);
  }, [filters, sortBy]);

  // Slice restaurants based on display count - optimized with useMemo
  const displayedRestaurants = useMemo(() => 
    sortedRestaurants.slice(0, displayCount), 
    [sortedRestaurants, displayCount]
  );
  
  const hasMoreRestaurants = useMemo(() => 
    sortedRestaurants.length > displayCount, 
    [sortedRestaurants.length, displayCount]
  );

  // Infinite scroll - auto load more when sentinel is visible
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRestaurants && !isLoadingMore) {
          loadMoreRestaurants();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreRestaurants, isLoadingMore, loadMoreRestaurants]);



  // Helper function to clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setAutoDetectLocation(false);
    setDetectedLocation(null);
    setSortBy('featured');
    // Reset AI Menu specific filters
    setManualDietType('all');
    setManualCalories('all');
    setManualRating('all');
    setUseDietaryProfile(true);
    setSelectedMealType('any');
    setRecommendationType('both');
  }, []);

  // Check if any filters are active based on current tab
  const hasActiveFilters = useMemo(() => {
    const baseFilters = filters.cuisine || filters.priceRange || filters.location || filters.minDiscount;
    if (activeTab === 'restaurants') {
      return baseFilters || autoDetectLocation || sortBy !== 'featured';
    }
    if (activeTab === 'ai-menu') {
      return baseFilters || manualDietType !== 'all' || manualCalories !== 'all' || manualRating !== 'all' || !useDietaryProfile || selectedMealType !== 'any' || recommendationType !== 'both';
    }
    if (activeTab === 'vouchers') {
      return baseFilters || sortBy === 'expiring-soon';
    }
    return baseFilters;
  }, [filters, activeTab, autoDetectLocation, sortBy, manualDietType, manualCalories, manualRating, useDietaryProfile, selectedMealType, recommendationType]);

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
      <section className="mb-12">
        {/* Tab Navigation + Location: Restaurants / AI Menu / Vouchers + Location Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 gap-1">
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out ${
                activeTab === 'restaurants'
                  ? 'bg-primary text-white shadow-lg scale-105 transform'
                  : 'bg-white/50 dark:bg-gray-700/50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              <Store className="w-4 h-4" />
              Restaurants
            </button>
            <button
              onClick={() => setActiveTab('ai-menu')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out ${
                activeTab === 'ai-menu'
                  ? 'bg-primary text-white shadow-lg scale-105 transform'
                  : 'bg-white/50 dark:bg-gray-700/50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              <Brain className="w-4 h-4" />
              AI Menu
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out ${
                activeTab === 'vouchers'
                  ? 'bg-primary text-white shadow-lg scale-105 transform'
                  : 'bg-white/50 dark:bg-gray-700/50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Vouchers
            </button>
          </div>

          {/* Global Location Button */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
              {selectedAddress || detectedLocation || t.setLocation || 'Set location'}
            </span>
            {(selectedAddress || detectedLocation) && (
              <X 
                className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAddress('');
                  setDetectedLocation(null);
                  setAutoDetectLocation(false);
                  handleFilterChange('location', undefined);
                }}
              />
            )}
          </button>
        </div>

        {/* Horizontal Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6" data-tour="filters">
          {/* Restaurants Filters */}
          {activeTab === 'restaurants' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Filter className="w-4 h-4" />
                <span>{t.filters}:</span>
              </div>
              
              {/* Cuisine Type Dropdown */}
              <Select 
                value={filters.cuisine || "all"} 
                onValueChange={(value) => handleFilterChange('cuisine', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder={t.cuisineType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allCuisines || 'All Cuisines'}</SelectItem>
                  {cuisinesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : availableCuisines.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {t[cuisine.toLowerCase() as keyof typeof t] || cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Dropdown */}
              <Select 
                value={filters.priceRange || "all"} 
                onValueChange={(value) => handleFilterChange('priceRange', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[130px] h-9 text-sm">
                  <SelectValue placeholder={t.priceRange} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allPrices || 'All Prices'}</SelectItem>
                  <SelectItem value="€">€ - {t.budget}</SelectItem>
                  <SelectItem value="€€">€€ - {t.moderate}</SelectItem>
                  <SelectItem value="€€€">€€€ - {t.upscale}</SelectItem>
                </SelectContent>
              </Select>

              {/* Rating Toggle */}
              <button
                onClick={() => setSortBy(sortBy === 'best-rating' ? 'featured' : 'best-rating')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === 'best-rating'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                Top Rated
              </button>

              {/* Popular Toggle */}
              <button
                onClick={() => setSortBy(sortBy === 'featured' ? 'highest-discount' : 'featured')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === 'featured'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Popular
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}

              {/* Heat Map Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/heat-map")}
                className="ml-auto flex items-center gap-1 text-xs bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:from-orange-100 hover:to-red-100"
              >
                <TrendingUp className="h-3 w-3 text-orange-600" />
                <span className="text-orange-700 font-medium">Heat Map</span>
              </Button>
            </div>
          )}

          {/* AI Menu Title & Badge */}
          {activeTab === 'ai-menu' && (
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                <Brain className="w-6 h-6" />
                AI Menu Recommendations
              </h2>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant="outline" className="px-3 py-1 text-sm border-primary/30">
                  {isAuthenticated && useDietaryProfile && userDietaryProfile ? (
                    <>
                      <User className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      Based on your Profile
                    </>
                  ) : (
                    <>
                      <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      Based on selected Preferences
                    </>
                  )}
                </Badge>
              </div>
            </div>
          )}

          {/* AI Menu Preferences & Filters */}
          {activeTab === 'ai-menu' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* LEFT: Preferences section */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Preferences:</span>
                  </div>

                  {isAuthenticated && userDietaryProfile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                      <User className="w-4 h-4 text-primary" />
                      <Label htmlFor="use-dietary-profile" className="text-sm font-medium text-primary cursor-pointer">
                        Use My Profile
                      </Label>
                      <Switch
                        id="use-dietary-profile"
                        checked={useDietaryProfile}
                        onCheckedChange={setUseDietaryProfile}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  )}

                  {(!isAuthenticated || !useDietaryProfile) && (
                    <>
                      <Select 
                        value={filters.cuisine || "all"} 
                        onValueChange={(value) => handleFilterChange('cuisine', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger className="w-[140px] h-9 text-sm">
                          <SelectValue placeholder={t.cuisineType} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.allCuisines || 'All Cuisines'}</SelectItem>
                          {cuisinesLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : availableCuisines.map((cuisine) => (
                            <SelectItem key={cuisine} value={cuisine}>
                              {t[cuisine.toLowerCase() as keyof typeof t] || cuisine}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={manualDietType} onValueChange={setManualDietType}>
                        <SelectTrigger className="w-[150px] h-9 text-sm">
                          <SelectValue placeholder="Diet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Diets</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                          <SelectItem value="keto">Keto</SelectItem>
                          <SelectItem value="paleo">Paleo</SelectItem>
                          <SelectItem value="dash">DASH</SelectItem>
                          <SelectItem value="low-carb">Low-Carb</SelectItem>
                          <SelectItem value="mediterranean">Mediterranean</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={manualCalories} onValueChange={setManualCalories}>
                        <SelectTrigger className="w-[140px] h-9 text-sm">
                          <SelectValue placeholder="Calories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Calories</SelectItem>
                          <SelectItem value="low">&lt; 1500 kcal</SelectItem>
                          <SelectItem value="medium">1500-2000 kcal</SelectItem>
                          <SelectItem value="high">2000-2500 kcal</SelectItem>
                          <SelectItem value="very-high">&gt; 2500 kcal</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}

                  {isAuthenticated && useDietaryProfile && userDietaryProfile && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                      {userDietaryProfile.dietaryPreferences?.slice(0, 3).map((pref: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {pref}
                        </Badge>
                      ))}
                      {userDietaryProfile.dietaryPreferences?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{userDietaryProfile.dietaryPreferences.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT: Filters section */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters:</span>
                  </div>

                  <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                      <SelectValue placeholder="Meal Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Meal</SelectItem>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={recommendationType} onValueChange={setRecommendationType}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="restaurants">Restaurants</SelectItem>
                      <SelectItem value="menu_items">Menu Items</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filters.priceRange || "all"} 
                    onValueChange={(value) => handleFilterChange('priceRange', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                      <SelectValue placeholder={t.priceRange} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allPrices || 'All Prices'}</SelectItem>
                      <SelectItem value="€">€ - {t.budget}</SelectItem>
                      <SelectItem value="€€">€€ - {t.moderate}</SelectItem>
                      <SelectItem value="€€€">€€€ - {t.upscale}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={manualRating} onValueChange={setManualRating}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="3">⭐ 3+ Stars</SelectItem>
                      <SelectItem value="3.5">⭐ 3.5+ Stars</SelectItem>
                      <SelectItem value="4">⭐ 4+ Stars</SelectItem>
                      <SelectItem value="4.5">⭐ 4.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vouchers Filters */}
          {activeTab === 'vouchers' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Filter className="w-4 h-4" />
                <span>{t.filters}:</span>
              </div>

              {/* Cuisine Type Dropdown */}
              <Select 
                value={filters.cuisine || "all"} 
                onValueChange={(value) => handleFilterChange('cuisine', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder={t.cuisineType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allCuisines || 'All Cuisines'}</SelectItem>
                  {cuisinesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : availableCuisines.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {t[cuisine.toLowerCase() as keyof typeof t] || cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Dropdown */}
              <Select 
                value={filters.priceRange || "all"} 
                onValueChange={(value) => handleFilterChange('priceRange', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[130px] h-9 text-sm">
                  <SelectValue placeholder={t.priceRange} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allPrices || 'All Prices'}</SelectItem>
                  <SelectItem value="€">€ - {t.budget}</SelectItem>
                  <SelectItem value="€€">€€ - {t.moderate}</SelectItem>
                  <SelectItem value="€€€">€€€ - {t.upscale}</SelectItem>
                </SelectContent>
              </Select>

              {/* Discount Range Dropdown */}
              <Select 
                value={filters.minDiscount?.toString() || "0"} 
                onValueChange={(value) => handleFilterChange('minDiscount', value === '0' ? undefined : parseInt(value))}
              >
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5" />
                    <SelectValue placeholder="Discount" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Discount</SelectItem>
                  <SelectItem value="10">10%+ off</SelectItem>
                  <SelectItem value="15">15%+ off</SelectItem>
                  <SelectItem value="20">20%+ off</SelectItem>
                  <SelectItem value="25">25%+ off</SelectItem>
                </SelectContent>
              </Select>

              {/* Expiring Soon Toggle */}
              <button
                onClick={() => setSortBy(sortBy === 'expiring-soon' ? 'featured' : 'expiring-soon')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === 'expiring-soon'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Expiring Soon
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div>

            {/* Tab Content */}
            {activeTab === 'restaurants' && (
              <>
                {/* Featured Chefs Section */}
                <FeaturedChefsSection />
                
                <div className="restaurant-header flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-primary">{t.availableRestaurants}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {t.showingRestaurants.replace('{current}', displayedRestaurants.length.toString()).replace('{total}', sortedRestaurants.length.toString())}
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Sort by: Featured</SelectItem>
                    <SelectItem value="highest-discount">Highest Discount</SelectItem>
                    <SelectItem value="lowest-price">Lowest Price</SelectItem>
                    <SelectItem value="best-rating">Best Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            

            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-gray-500">Loading restaurants...</p>
              </div>
            ) : sortedRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No restaurants found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div 
                  className="restaurant-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                  data-tour="restaurant-grid"
                >
                  {displayedRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onClick={() => openRestaurantVouchers(restaurant)}
                      onMenuClick={() => openRestaurantMenu(restaurant)}
                      onVouchersClick={() => openRestaurantVouchers(restaurant)}
                      onReservationClick={() => openRestaurantReservations(restaurant)}
                    />
                  ))}
                </div>
                
                {/* Infinite scroll sentinel */}
                <div ref={loadMoreRef} className="h-4" />
                {isLoadingMore && (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </>
            )}
              </>
            )}

            {/* AI Menu Tab Content */}
            {activeTab === 'ai-menu' && (
              <div className="py-8">
                {!isAuthenticated && allEnhancedRecommendations.length > 0 ? (
                  <>
                    <AIRecommendations 
                      recommendations={allEnhancedRecommendations.slice(0, 4)}
                      showFilters={true}
                      className="border-0 shadow-none"
                      mealType={selectedMealType}
                      recommendationType={recommendationType}
                    />
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Do you want more recommendations?{' '}
                      <button onClick={() => setLocation('/login')} className="text-primary font-semibold hover:underline">
                        Sign-up now!
                      </button>
                    </p>
                  </>
                ) : !isAuthenticated ? (
                  <Card className="p-8 text-center">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
                    <p className="text-muted-foreground mb-4">
                      Set your preferences above to discover personalized restaurant recommendations, or create an account for a fully tailored experience.
                    </p>
                    <Button onClick={() => setLocation('/login')} className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign Up / Log In
                    </Button>
                  </Card>
                ) : allRecommendations.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Set up your dietary preferences to receive personalized AI recommendations
                    </p>
                    <Button onClick={() => setLocation('/dashboard')}>
                      Set Preferences
                    </Button>
                  </Card>
                ) : (
                  <AIRecommendations 
                    recommendations={allEnhancedRecommendations}
                    showFilters={true}
                    className="border-0 shadow-none"
                    mealType={selectedMealType}
                    recommendationType={recommendationType}
                  />
                )}
              </div>
            )}

            {/* Vouchers Tab Content */}
            {activeTab === 'vouchers' && (
              <div className="py-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                    <Ticket className="w-6 h-6" />
                    Available Vouchers
                  </h2>
                  <p className="text-muted-foreground">
                    Browse all available restaurant vouchers and meal packages
                  </p>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="mt-4 text-gray-500">Loading vouchers...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedRestaurants.filter((r: any) => r.maxDiscount > 0).map((restaurant: any) => (
                      <Card 
                        key={restaurant.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                        onClick={() => openRestaurantModal(restaurant)}
                      >
                        <div className="relative h-32">
                          {restaurant.imageUrl ? (
                            <img 
                              src={restaurant.imageUrl} 
                              alt={restaurant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                              <Store className="w-12 h-12 text-primary/60" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 text-white">
                              -{restaurant.maxDiscount}% OFF
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold truncate">{restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{restaurant.cuisine}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Ticket className="w-4 h-4 text-primary" />
                            <span className="text-sm text-primary font-medium">View Vouchers</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
      </section>

      <RestaurantModal
        restaurant={selectedRestaurant}
        isOpen={isModalOpen}
        onClose={closeRestaurantModal}
      />

      {/* AI Recommendation Details Modal - Portal to document.body */}
      {showRecommendationModal && selectedRecommendation && createPortal(
        <div 
          ref={modalRef}
          className="ai-recommendation-modal"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              handleCloseModal();
            }
          }}
          onClick={(e) => {
            // Close modal when clicking on the background overlay
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              handleCloseModal();
            }
          }}
        >
          <div 
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 id="modal-title" className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Recommendation Details
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Complete information about this AI recommendation
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          {selectedRecommendation && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg">
                {selectedRecommendation.type === 'menu_item' ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedRecommendation.recommendationText?.split('.')[0] || 'Recommended Product'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      from {selectedRecommendation.restaurant.name} • {selectedRecommendation.restaurant.cuisine}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedRecommendation.restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedRecommendation.restaurant.cuisine} • {selectedRecommendation.restaurant.location}
                    </p>
                  </div>
                )}
              </div>

              {/* Restaurant Information */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Restaurant Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Cuisine:</span>
                    <p className="font-medium">{selectedRecommendation.restaurant.cuisine}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                    <p className="font-medium">{selectedRecommendation.restaurant.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Price Range:</span>
                    <p className="font-medium">{selectedRecommendation.restaurant.priceRange}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Rating:</span>
                    <p className="font-medium">⭐ {selectedRecommendation.restaurant.rating}/5</p>
                  </div>
                </div>
                {selectedRecommendation.restaurant.description && (
                  <div className="mt-3">
                    <span className="text-gray-500 dark:text-gray-400">Description:</span>
                    <p className="text-sm mt-1">{selectedRecommendation.restaurant.description}</p>
                  </div>
                )}
              </div>

              {/* AI Analysis */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI Analysis</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Recommendation:</span>
                    <p className="text-sm mt-1">{selectedRecommendation.recommendationText}</p>
                  </div>
                  
                  {selectedRecommendation.reasoningFactors?.length > 0 && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Reasoning:</span>
                      <ul className="text-sm mt-1 space-y-1">
                        {selectedRecommendation.reasoningFactors.map((factor: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Nutritional Highlights */}
              {selectedRecommendation.nutritionalHighlights?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Nutritional Highlights</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.nutritionalHighlights.map((highlight: string, index: number) => (
                      <span key={index} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cautionary Notes */}
              {selectedRecommendation.cautionaryNotes?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Cautionary Notes</h4>
                  <div className="space-y-2">
                    {selectedRecommendation.cautionaryNotes.map((note: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-amber-500">⚠️</span>
                        <span className="text-sm">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Scores */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Compatibility Scores</h4>
                <div className="space-y-3">
                  {selectedRecommendation.recommendationScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Match</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedRecommendation.recommendationScore || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((selectedRecommendation.recommendationScore || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedRecommendation.nutritionalMatch && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nutritional Match</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedRecommendation.nutritionalMatch || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((selectedRecommendation.nutritionalMatch || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedRecommendation.preferenceMatch && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Preference Match</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedRecommendation.preferenceMatch || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((selectedRecommendation.preferenceMatch || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedRecommendation.healthGoalAlignment && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Health Goal Alignment</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedRecommendation.healthGoalAlignment || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((selectedRecommendation.healthGoalAlignment || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    // Navigate to restaurant based on recommendation type
                    if (selectedRecommendation.type === 'restaurant') {
                      const restaurantId = selectedRecommendation.restaurantId || selectedRecommendation.targetId;
                      if (restaurantId) {
                        setLocation(`/restaurant/${restaurantId}/menu?from=ai-recommendations`);
                      }
                    } else if (selectedRecommendation.type === 'menu_item') {
                      setLocation(`/restaurant/101/menu?from=ai-recommendations`);
                    }
                    setShowRecommendationModal(false);
                  }}
                  className="flex-1"
                >
                  Visit Restaurant
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleCloseModal()}
                  className="flex-1"
                >
                  Back to Main Page
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>,
        document.body
      )}

      {/* Location Selection Modal - No backdrop, fixed viewport center */}
      {showLocationModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.setLocation || 'Set Your Location'}
                </h2>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t.locationDescription || 'Enter your address for delivery or browse nearby restaurants'}
            </p>

            <div className="space-y-4">
              {/* GPS Detection Button */}
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-6"
                onClick={handleGPSDetect}
                disabled={isDetectingLocation}
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.detectingLocation || 'Detecting location...'}
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 text-primary" />
                    {t.useMyLocation || 'Use My Location'}
                  </>
                )}
              </Button>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">{t.or || 'or'}</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* Address Search Input */}
              <div className="relative">
                <div className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.enterAddress || 'Enter your address...'}
                    value={addressSearchQuery}
                    onChange={(e) => setAddressSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                  />
                  {isSearchingPlaces && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                </div>

                {/* Place Suggestions Dropdown */}
                {placeSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {placeSuggestions.map((place: any) => (
                      <button
                        key={place.place_id}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 transition-colors"
                        onClick={() => handleSelectPlace(place)}
                      >
                        <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {place.structured_formatting?.main_text || place.description.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {place.structured_formatting?.secondary_text || place.description.split(',').slice(1).join(',')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Selection Display */}
              {(selectedAddress || detectedLocation) && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {selectedAddress || detectedLocation}
                  </span>
                </div>
              )}
            </div>

            {/* Hidden div for PlacesService */}
            <div ref={placesContainerRef} style={{ display: 'none' }} />
          </div>
        </div>,
        document.body
      )}

      <AIAssistant 
        context={{
          restaurants: restaurants,
          customerPreferences: {
            cuisine: filters.cuisine,
            priceRange: filters.priceRange,
            location: filters.location
          }
        }}
      />
    </main>
  );
}
