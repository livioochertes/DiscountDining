import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, Bell, Store, ChevronRight, Star, MapPin, Loader2, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { WalletCard, ActionRow } from '@/components/mobile/WalletCard';
import { CategoryChips } from '@/components/mobile/CategoryChips';
import { RestaurantCardSmall } from '@/components/mobile/RestaurantCard';
import { DealBanner, SmallDealCard } from '@/components/mobile/DealBanner';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useUserLocation } from '@/hooks/useUserLocation';

interface EatoffVoucher {
  id: number;
  restaurantId?: number;
  name: string;
  description: string;
  mealCount: number;
  totalValue: string;
  bonusPercentage: string;
  discountPercentage: string;
  validityDays: number;
  isActive: boolean;
  isCredit?: boolean;
  voucherType?: string;
}

interface VoucherPackage {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  mealCount: number;
  pricePerMeal: string;
  discountPercentage: string;
  validityMonths: number;
  isActive: boolean;
}

interface RestaurantWithVouchers {
  restaurant: any;
  vouchers: EatoffVoucher[];
}

function VoucherChipHome({ voucher, onClick }: { voucher: EatoffVoucher; onClick: () => void }) {
  const discountPercent = parseFloat(voucher.discountPercentage) || 0;
  const bonusPercent = parseFloat(voucher.bonusPercentage) || 0;
  const totalValue = parseFloat(voucher.totalValue) || 0;
  
  const isPayLater = voucher.voucherType === 'pay_later';
  
  // DEBUG: Log what data VoucherChipHome receives
  console.log('[VoucherChipHome] Rendering:', {
    name: voucher.name,
    voucherType: voucher.voucherType,
    bonusPercentage: voucher.bonusPercentage,
    discountPercentage: voucher.discountPercentage,
    isPayLater,
    bonusPercent,
    discountPercent
  });
  
  let displayPercent: number;
  let prefix: string;
  let bgColor: string;
  
  if (isPayLater) {
    displayPercent = bonusPercent;
    prefix = '+';
    bgColor = 'bg-red-500';
  } else {
    displayPercent = discountPercent;
    prefix = '-';
    bgColor = 'bg-green-500';
  }
  
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 hover:border-primary/50 transition-all"
      title={`DEBUG: voucherType=${voucher.voucherType}, bonus=${voucher.bonusPercentage}, discount=${voucher.discountPercentage}`}
    >
      <span className={`${bgColor} text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap`}>
        {prefix}{displayPercent.toFixed(0)}%
      </span>
      <span className="text-sm font-bold text-primary whitespace-nowrap">{totalValue.toFixed(0)} RON</span>
    </button>
  );
}

function RestaurantVoucherRowHome({ data, onVoucherClick }: { 
  data: RestaurantWithVouchers; 
  onVoucherClick: (restaurantId: number, voucherId: number, isCredit: boolean) => void;
}) {
  const { restaurant, vouchers } = data;
  const sortedVouchers = [...vouchers]
    .sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      const aPriority = (a as any).priority ?? 3;
      const bPriority = (b as any).priority ?? 3;
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then by position within same priority
      const aPosition = (a as any).position ?? 0;
      const bPosition = (b as any).position ?? 0;
      if (aPosition !== bPosition) return aPosition - bPosition;
      
      const aIsPayLater = a.voucherType === 'pay_later';
      const bIsPayLater = b.voucherType === 'pay_later';
      
      // Discount vouchers first, pay_later at the end
      if (!aIsPayLater && bIsPayLater) return -1;
      if (aIsPayLater && !bIsPayLater) return 1;
      
      // Both discount: sort by discount descending
      const aDiscount = parseFloat(a.discountPercentage) || 0;
      const bDiscount = parseFloat(b.discountPercentage) || 0;
      if (!aIsPayLater && !bIsPayLater) return bDiscount - aDiscount;
      
      // Both pay_later: sort by bonus ascending
      const aBonus = parseFloat(a.bonusPercentage) || 0;
      const bBonus = parseFloat(b.bonusPercentage) || 0;
      return aBonus - bBonus;
    });
  
  const googleRating = parseFloat(restaurant.googleRating) || 0;
  const eatoffRating = parseFloat(restaurant.rating) || 0;
  const googleCount = restaurant.googleReviewCount || 0;
  const eatoffCount = restaurant.reviewCount || 0;
  const totalReviews = googleCount + eatoffCount;
  const combinedRating = totalReviews > 0 
    ? (googleRating * googleCount + eatoffRating * eatoffCount) / totalReviews
    : (googleRating || eatoffRating);
  
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
          {restaurant.imageUrl ? (
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
              <Store className="w-7 h-7 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate text-[15px]">{restaurant.name}</h3>
            {combinedRating > 0 && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-700">{combinedRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
            {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
            {restaurant.address && (
              <>
                <span>•</span>
                <span className="truncate">{restaurant.address}</span>
              </>
            )}
          </div>
          <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
            {sortedVouchers.map((voucher) => (
              <VoucherChipHome 
                key={voucher.isCredit ? `credit-${voucher.id}` : `discount-${voucher.id}`} 
                voucher={voucher}
                onClick={() => onVoucherClick(restaurant.id, voucher.id, voucher.isCredit || false)}
              />
            ))}
            {vouchers.length > 3 && (
              <span className="flex-shrink-0 flex items-center text-xs text-gray-400 pl-1">
                •••
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');

export default function MobileHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState<{ filterType?: string; filterValues?: string[] } | null>(null);
  const [showGreeting, setShowGreeting] = useState(true);
  const greetingRef = useRef<HTMLParagraphElement>(null);
  const hasScrolledPast = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const addressInputRef = useRef<HTMLInputElement>(null);
  
  // Hide greeting when it scrolls out of viewport
  useEffect(() => {
    if (!showGreeting || hasScrolledPast.current) return;
    
    const setupObserver = () => {
      if (!greetingRef.current) return;
      
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting && !hasScrolledPast.current) {
            hasScrolledPast.current = true;
            setShowGreeting(false);
          }
        },
        { threshold: 0 }
      );
      
      observerRef.current.observe(greetingRef.current);
    };
    
    const timeoutId = setTimeout(setupObserver, 50);
    
    return () => {
      clearTimeout(timeoutId);
      observerRef.current?.disconnect();
    };
  }, [showGreeting]);
  
  // Get greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t.goodMorning;
    if (hour >= 12 && hour < 18) return t.goodAfternoon;
    return t.goodEvening;
  };
  
  // GPS location hook - single source of truth for location
  const { 
    city: gpsCity, 
    isLoading: isDetectingLocation,
    error: gpsError,
    requestGpsLocation,
    manualCity,
    manualAddress,
    setManualCity,
    setManualAddress
  } = useUserLocation();

  // Current location to display (manual takes priority over GPS)
  const displayCity = manualCity || gpsCity;
  
  // Display address for the location bar - show formatted address if available, otherwise city
  const displayAddress = manualAddress?.formattedAddress || manualCity || gpsCity;

  // No need to load Google Maps script - using server-side proxy for Capacitor compatibility

  // Focus input when modal opens
  useEffect(() => {
    if (showLocationModal && addressInputRef.current) {
      setTimeout(() => {
        addressInputRef.current?.focus();
        console.log('[MobileHome Places] Input focused');
      }, 100);
    }
  }, [showLocationModal]);

  // Search places with debounce - using server-side proxy for Capacitor compatibility
  useEffect(() => {
    console.log('[MobileHome Places] Query:', addressSearchQuery);
    
    if (!addressSearchQuery || addressSearchQuery.length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingPlaces(true);
      console.log('[MobileHome Places] Searching via server proxy for:', addressSearchQuery);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(addressSearchQuery)}`);
        const data = await response.json();
        
        setIsSearchingPlaces(false);
        console.log('[MobileHome Places] Server results:', data.predictions?.length || 0, 'suggestions');
        
        if (data.predictions) {
          setPlaceSuggestions(data.predictions);
        } else {
          setPlaceSuggestions([]);
        }
      } catch (error) {
        console.error('[MobileHome Places] Server error:', error);
        setIsSearchingPlaces(false);
        setPlaceSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [addressSearchQuery]);

  // Handle GPS detection from modal
  const handleModalGPSDetect = useCallback(() => {
    console.log('[MobileHome] GPS detection requested, clearing manual location');
    // Clear manual location to allow GPS to work
    setManualAddress(null, null);
    setSelectedAddress('');
    requestGpsLocation();
    setShowLocationModal(false);
  }, [requestGpsLocation, setManualAddress]);

  // Handle place selection - fetches detailed address components from Google
  const handleSelectPlace = useCallback(async (place: any) => {
    console.log('[MobileHome] Place selected:', place.description, 'place_id:', place.place_id);
    
    // Immediately update UI with description
    setSelectedAddress(place.description);
    setAddressSearchQuery('');
    setPlaceSuggestions([]);
    setShowLocationModal(false);
    
    // Fetch structured address components
    if (place.place_id) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/places/details?place_id=${encodeURIComponent(place.place_id)}`);
        if (response.ok) {
          const details = await response.json();
          console.log('[MobileHome] Place details:', details);
          
          // Save structured address - city will be extracted automatically
          setManualAddress(details, details.city || details.locality);
          return;
        }
      } catch (error) {
        console.error('[MobileHome] Failed to fetch place details:', error);
      }
    }
    
    // Fallback: try to extract city from structured_formatting or terms
    let city = null;
    if (place.structured_formatting?.secondary_text) {
      // Secondary text usually contains "City, Region, Country"
      const parts = place.structured_formatting.secondary_text.split(',');
      city = parts[0]?.trim() || null;
    } else if (place.terms && place.terms.length >= 2) {
      // Terms array: [street, city, region, country]
      // Usually city is at index 1 or 2
      city = place.terms[1]?.value || place.terms[0]?.value || null;
    } else {
      // Last resort: split description
      const parts = place.description.split(',');
      city = parts.length > 1 ? parts[1]?.trim() : parts[0]?.trim();
    }
    
    console.log('[MobileHome] Fallback city extracted:', city);
    setManualCity(city);
  }, [setManualAddress, setManualCity]);
  
  // Marketplace for filtering restaurants
  const { marketplace, detectedCountry } = useMarketplace();

  const { data: restaurants = [], isLoading: restaurantsLoading, error: restaurantsError } = useQuery<any[]>({
    queryKey: ['/api/restaurants', displayCity, marketplace?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (displayCity) params.append('location', displayCity);
      if (marketplace?.id) params.append('marketplaceId', marketplace.id.toString());
      
      const url = params.toString() 
        ? `${API_BASE_URL}/api/restaurants?${params.toString()}`
        : `${API_BASE_URL}/api/restaurants`;
      console.log('[MobileHome] Fetching restaurants from:', url, 'Marketplace:', marketplace?.name);
      try {
        const res = await fetch(url);
        console.log('[MobileHome] Response status:', res.status);
        if (!res.ok) {
          const text = await res.text();
          console.error('[MobileHome] Error response:', text);
          throw new Error('Failed to fetch restaurants');
        }
        const data = await res.json();
        console.log('[MobileHome] Restaurants loaded:', data.length, 'for marketplace:', marketplace?.name);
        return data;
      } catch (err) {
        console.error('[MobileHome] Fetch error:', err);
        throw err;
      }
    }
  });

  console.log('[MobileHome] State:', {
    API_BASE_URL,
    restaurantsLoading,
    restaurantsCount: restaurants.length,
    error: restaurantsError?.message
  });

  const { data: creditVouchers = [] } = useQuery<any[]>({
    queryKey: ['/api/eatoff-vouchers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/eatoff-vouchers`);
      if (!res.ok) throw new Error('Failed to fetch credit vouchers');
      return res.json();
    }
  });

  const { data: discountPackages = [] } = useQuery<VoucherPackage[]>({
    queryKey: ['/api/voucher-packages'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/voucher-packages`);
      if (!res.ok) throw new Error('Failed to fetch discount packages');
      return res.json();
    }
  });

  const vouchers: EatoffVoucher[] = useMemo(() => {
    const mappedDiscountPackages = discountPackages.filter(p => p.isActive).map(p => ({
      id: p.id,
      restaurantId: p.restaurantId,
      name: p.name,
      description: p.description || '',
      mealCount: p.mealCount,
      totalValue: String(parseFloat(p.pricePerMeal) * p.mealCount),
      bonusPercentage: '0',
      discountPercentage: p.discountPercentage,
      validityDays: (p.validityMonths || 1) * 30,
      isActive: p.isActive,
      isCredit: false,
      voucherType: 'discount' as const
    }));
    
    const mappedCreditVouchers = creditVouchers.filter(v => v.isActive).map(v => ({
      id: v.id,
      restaurantId: 0,
      name: v.name,
      description: v.description || '',
      mealCount: 0,
      totalValue: String(v.totalValue),
      bonusPercentage: v.bonusPercentage ? String(v.bonusPercentage) : '0',
      discountPercentage: v.discountPercentage ? String(v.discountPercentage) : '0',
      validityDays: v.validityDays || (v.validityMonths ? v.validityMonths * 30 : 30),
      isActive: v.isActive,
      isCredit: true,
      voucherType: v.voucherType || 'immediate'
    }));
    
    console.log('[MobileHome] Credit vouchers mapped:', mappedCreditVouchers.map(v => ({
      name: v.name, voucherType: v.voucherType, bonus: v.bonusPercentage, discount: v.discountPercentage
    })));
    console.log('[MobileHome] Discount packages mapped:', mappedDiscountPackages.map(v => ({
      name: v.name, voucherType: v.voucherType, discount: v.discountPercentage
    })));
    
    return [...mappedDiscountPackages, ...mappedCreditVouchers];
  }, [discountPackages, creditVouchers]);

  const { data: favoriteRestaurants = [] } = useQuery<any[]>({
    queryKey: ['/api/customers', user?.id, 'favorite-restaurants'],
    queryFn: async () => {
      const url = `${API_BASE_URL}/api/customers/${user?.id}/favorite-restaurants`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json();
    },
    enabled: !!user?.id
  });

  const { data: userStats } = useQuery<any>({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });

  const activeVouchers = vouchers
    .filter(v => v.isActive)
    .sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      const aPriority = (a as any).priority ?? 3;
      const bPriority = (b as any).priority ?? 3;
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then by position within same priority
      const aPosition = (a as any).position ?? 0;
      const bPosition = (b as any).position ?? 0;
      if (aPosition !== bPosition) return aPosition - bPosition;
      
      // Then voucher type (discount first, pay_later last)
      const aIsPayLater = a.voucherType === 'pay_later';
      const bIsPayLater = b.voucherType === 'pay_later';
      if (!aIsPayLater && bIsPayLater) return -1;
      if (aIsPayLater && !bIsPayLater) return 1;
      
      // Both are discount vouchers: sort by discount descending (biggest first)
      const aDiscount = parseFloat(a.discountPercentage) || 0;
      const bDiscount = parseFloat(b.discountPercentage) || 0;
      if (!aIsPayLater && !bIsPayLater) return bDiscount - aDiscount;
      
      // Both are pay_later: sort by bonus ascending (smallest cost first)
      const aBonus = parseFloat(a.bonusPercentage) || 0;
      const bBonus = parseFloat(b.bonusPercentage) || 0;
      return aBonus - bBonus;
    });

  // Get restaurant IDs that have their own voucher packages
  const restaurantIdsWithOwnVouchers = new Set(
    activeVouchers.filter(v => !v.isCredit && v.restaurantId).map(v => v.restaurantId)
  );
  
  // Sort restaurants by: 1) priority (1 = highest), 2) position, 3) own vouchers
  const sortedRestaurants = [...restaurants].sort((a: any, b: any) => {
    // First sort by priority (lower number = higher priority)
    const aPriority = a.priority ?? 3;
    const bPriority = b.priority ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Then by position within same priority
    const aPosition = a.position ?? 0;
    const bPosition = b.position ?? 0;
    if (aPosition !== bPosition) return aPosition - bPosition;
    
    // Finally, prioritize restaurants that have their own vouchers
    const aHasOwn = restaurantIdsWithOwnVouchers.has(a.id);
    const bHasOwn = restaurantIdsWithOwnVouchers.has(b.id);
    if (aHasOwn && !bHasOwn) return -1;
    if (!aHasOwn && bHasOwn) return 1;
    return 0;
  });

  // Apply filter based on selected category
  const filteredRestaurants = activeFilter 
    ? sortedRestaurants.filter((restaurant: any) => {
        const { filterType, filterValues } = activeFilter;
        if (!filterType || !filterValues || filterValues.length === 0) return true;
        
        // Helper function for bidirectional partial matching
        // "Pizza" matches "Pizzeria" and "Pizzeria" matches "Pizza"
        const partialMatch = (fieldValue: string | null | undefined, filterVal: string) => {
          if (!fieldValue) return false;
          const field = fieldValue.toLowerCase();
          const filter = filterVal.toLowerCase();
          return field.includes(filter) || filter.includes(field);
        };
        
        // Helper function to check if any filter value matches in text fields (bidirectional)
        const matchesInText = (filterVal: string) => {
          const name = restaurant.name || '';
          const description = restaurant.description || '';
          const cuisine = restaurant.cuisine || '';
          return partialMatch(name, filterVal) || partialMatch(description, filterVal) || partialMatch(cuisine, filterVal);
        };
        
        console.log('[MobileHome Filter] Checking restaurant:', restaurant.name, 'filterType:', filterType, 'filterValues:', filterValues);
        
        switch (filterType) {
          case 'cuisine': {
            return filterValues.some(v => partialMatch(restaurant.cuisine, v) || matchesInText(v));
          }
          case 'mainProduct': {
            return filterValues.some(v => partialMatch(restaurant.mainProduct, v) || matchesInText(v));
          }
          case 'dietCategory': {
            return filterValues.some(v => partialMatch(restaurant.dietCategory, v) || matchesInText(v));
          }
          case 'conceptType': {
            return filterValues.some(v => partialMatch(restaurant.conceptType, v) || matchesInText(v));
          }
          case 'experienceType': {
            return filterValues.some(v => partialMatch(restaurant.experienceType, v) || matchesInText(v));
          }
          case 'deals': {
            return activeVouchers.some(v => v.restaurantId === restaurant.id);
          }
          default:
            return true;
        }
      })
    : sortedRestaurants;
  
  console.log('[MobileHome Filter] Active filter:', activeFilter, 'Filtered count:', filteredRestaurants.length, 'of', sortedRestaurants.length);
  
  const restaurantsWithVouchers: RestaurantWithVouchers[] = filteredRestaurants
    .slice(0, 4)
    .map((restaurant: any) => ({
      restaurant,
      vouchers: activeVouchers.filter(v => 
        v.isCredit || v.restaurantId === restaurant.id
      )
    }))
    .filter(item => item.vouchers.length > 0);

  console.log('[MobileHome] Restaurants with vouchers:', restaurantsWithVouchers.map(r => ({
    restaurantName: r.restaurant.name,
    restaurantId: r.restaurant.id,
    vouchers: r.vouchers.map(v => ({
      name: v.name,
      voucherType: v.voucherType,
      isCredit: v.isCredit,
      restaurantId: v.restaurantId,
      bonus: v.bonusPercentage,
      discount: v.discountPercentage
    }))
  })));

  const handleVoucherClick = (restaurantId: number, voucherId: number, isCredit: boolean) => {
    if (isCredit) {
      setLocation(`/m/wallet?voucherId=${voucherId}&type=credit`);
    } else {
      setLocation(`/m/restaurant/${restaurantId}?tab=vouchers&voucherId=${voucherId}&from=vouchers`);
    }
  };

  const handleBuyVoucher = () => setLocation('/m/explore?tab=vouchers');
  const handleUseVoucher = () => setLocation('/m/wallet');
  const handleAIMenu = () => setLocation('/m/ai-menu');
  const handleCashback = () => setLocation('/m/wallet');
  const handleCredit = () => setLocation('/m/wallet');
  const handleRestaurants = () => setLocation('/m/explore?tab=restaurants');

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {showGreeting && (
              <p ref={greetingRef} className="text-gray-500 text-sm transition-opacity duration-500">{getGreeting()} 👋</p>
            )}
            <h1 className="text-xl font-bold text-gray-900">
              {user?.name || t.guest}
            </h1>
            {/* Location indicator - opens location modal */}
            <button 
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-1.5 mt-1 text-xs bg-primary/10 hover:bg-primary/15 text-primary px-2 py-1 rounded-full transition-colors"
            >
              {displayCity ? (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>{displayCity}</span>
                  <span className="text-[10px] opacity-70">•</span>
                  <span className="text-[10px] font-medium">{t.changeLocation || 'Change'}</span>
                </>
              ) : isDetectingLocation && !gpsError ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{t.detecting}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>{t.allLocations}</span>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button className="relative p-2 bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Wallet Card Hero */}
        <WalletCard
          balance={userStats?.walletBalance || 0}
          cashback={userStats?.totalCashback || 0}
          activeVouchers={userStats?.activeVouchers || 0}
          creditAvailable={userStats?.creditLimit || 0}
          onBuyVoucher={handleBuyVoucher}
          onUseVoucher={handleUseVoucher}
          isGuest={!user}
          userName={user ? (user.name || user.email) : ''}
          customerCode={user?.customerCode || ''}
          loyaltyTier={(user as any)?.loyaltyTier || 'Bronze'}
        />

        {/* Action Row */}
        <ActionRow
          onBuyVoucher={handleBuyVoucher}
          onAIMenu={handleAIMenu}
          onCashback={handleCashback}
          onCredit={handleCredit}
          onRestaurants={handleRestaurants}
        />

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchRestaurants}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            onFocus={() => setLocation('/m/explore?focus=search')}
          />
        </div>

        {/* Categories - Dynamic filters from API */}
        <CategoryChips
          selected={selectedCategory}
          onSelect={(id, filter) => {
            setSelectedCategory(id);
            if (id === 'all') {
              setActiveFilter(null);
            } else if (filter) {
              setActiveFilter({
                filterType: filter.filterType,
                filterValues: filter.filterValues
              });
            }
          }}
          useDynamicFilters={true}
        />

        {/* Your Favorites - only shown when logged in and has favorites from purchases */}
        {user && favoriteRestaurants.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Your favorites</h2>
              <button 
                onClick={() => setLocation('/m/explore')}
                className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-primary/90 transition-colors"
              >
                {t.seeAll}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3">
                {favoriteRestaurants.slice(0, 4).map((restaurant: any) => (
                  <RestaurantCardSmall
                    key={restaurant.id}
                    name={restaurant.name}
                    image={restaurant.imageUrl}
                    rating={Number(restaurant.rating) || 4.5}
                    cashbackPercent={restaurant.cashbackPercent || 3}
                    onClick={() => setLocation(`/m/restaurant/${restaurant.id}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommended for you */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              {activeFilter ? `${selectedCategory !== 'all' ? '' : ''}Recommended for you` : 'Recommended for you'}
            </h2>
            <button 
              onClick={() => {
                const params = new URLSearchParams({ tab: 'restaurants' });
                if (activeFilter && selectedCategory !== 'all') {
                  params.set('filterId', selectedCategory);
                  params.set('filterType', activeFilter.filterType || '');
                  params.set('filterValues', activeFilter.filterValues?.join(',') || '');
                }
                setLocation(`/m/explore?${params.toString()}`);
              }}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-primary/90 transition-colors"
            >
              {t.seeAll}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3">
              {filteredRestaurants.map((restaurant: any) => (
                <RestaurantCardSmall
                  key={restaurant.id}
                  name={restaurant.name}
                  image={restaurant.imageUrl}
                  rating={restaurant.rating || 4.5}
                  cashbackPercent={restaurant.cashbackPercent || 5}
                  onClick={() => setLocation(`/m/restaurant/${restaurant.id}`)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Today's Deals */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">{t.todaysDeals}</h2>
          
          <DealBanner
            title="Get 20% off your first voucher"
            subtitle="Use code WELCOME20"
            discount="-20%"
            backgroundColor="bg-gradient-to-r from-primary to-primary/80"
          />

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3">
              <SmallDealCard
                title={t.doubleCashback}
                discount="2x"
                icon="💰"
              />
              <SmallDealCard
                title={t.networkVouchers}
                discount="-15%"
                icon="🏪"
              />
              <SmallDealCard
                title={t.weekendSpecial}
                discount="-10%"
                icon="🎉"
              />
            </div>
          </div>
        </section>

        {/* Vouchers Section */}
        {restaurantsWithVouchers.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{t.availableVouchers}</h2>
              <button 
                onClick={() => setLocation('/m/explore?tab=vouchers')}
                className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-primary/90 transition-colors"
              >
                {t.seeAll}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {restaurantsWithVouchers.map((item) => (
                <RestaurantVoucherRowHome
                  key={item.restaurant.id}
                  data={item}
                  onVoucherClick={handleVoucherClick}
                />
              ))}
            </div>
            
            <button
              onClick={() => setLocation('/m/explore?tab=vouchers')}
              className="w-full py-3 bg-primary/10 text-primary font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
            >
              Vezi toate voucherele
              <ChevronRight className="w-5 h-5" />
            </button>
          </section>
        )}
      </div>

      {/* Location Selection Modal */}
      {showLocationModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t.setLocation || 'Set Your Location'}
                </h2>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              {t.locationDescription || 'Enter your address for delivery or browse nearby restaurants'}
            </p>

            <div className="space-y-4">
              {/* GPS Detection Button */}
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-6"
                onClick={handleModalGPSDetect}
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
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">{t.or || 'or'}</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Address Search Input */}
              <div className="relative">
                <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    ref={addressInputRef}
                    type="text"
                    placeholder={t.enterAddress || 'Enter your address...'}
                    value={addressSearchQuery}
                    onChange={(e) => {
                      console.log('[MobileHome Places] Input changed:', e.target.value);
                      setAddressSearchQuery(e.target.value);
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    inputMode="text"
                    enterKeyHint="search"
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-800 placeholder:text-gray-400"
                    style={{ WebkitUserSelect: 'text' } as React.CSSProperties}
                  />
                  {isSearchingPlaces && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                </div>

                {/* Place Suggestions Dropdown */}
                {placeSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                    {placeSuggestions.map((place: any) => (
                      <button
                        key={place.place_id}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors"
                        onClick={() => handleSelectPlace(place)}
                      >
                        <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {place.structured_formatting?.main_text || place.description.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500">
                            {place.structured_formatting?.secondary_text || place.description.split(',').slice(1).join(',')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Selection Display */}
              {(selectedAddress || displayCity) && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {selectedAddress || displayCity}
                  </span>
                </div>
              )}
            </div>

                      </div>
        </div>,
        document.body
      )}
    </MobileLayout>
  );
}
