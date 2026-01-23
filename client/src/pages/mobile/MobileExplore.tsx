import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, SlidersHorizontal, MapPin, Navigation, ChevronDown, Ticket, Store, X } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { CategoryChips } from '@/components/mobile/CategoryChips';
import { RestaurantCard } from '@/components/mobile/RestaurantCard';
import { cn } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const CITIES = [
  'Toate locațiile',
  'Bucharest',
  'Cluj-Napoca',
  'Timișoara',
  'Iași',
  'Constanța',
  'Craiova',
  'Brașov',
  'Galați',
  'Ploiești',
  'Oradea'
];

interface EatoffVoucher {
  id: number;
  name: string;
  description: string;
  mealCount: number;
  pricePerMeal: string;
  totalValue: string;
  bonusPercentage: string;
  validityDays: number;
  isActive: boolean;
}

function VoucherCard({ voucher, onClick }: { voucher: EatoffVoucher; onClick: () => void }) {
  const bonusPercent = parseFloat(voucher.bonusPercentage) || 0;
  const totalValue = parseFloat(voucher.totalValue) || 0;
  const baseValue = totalValue / (1 + bonusPercent / 100);
  
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-4 text-left border border-primary/20 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{voucher.name}</h3>
            <p className="text-xs text-gray-500">{voucher.mealCount} mese incluse</p>
          </div>
        </div>
        {bonusPercent > 0 && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
            +{bonusPercent}% bonus
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{voucher.description}</p>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500">Valoare totală</p>
          <p className="text-xl font-bold text-primary">{totalValue.toFixed(0)} RON</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Plătești doar</p>
          <p className="text-lg font-semibold text-gray-900">{baseValue.toFixed(0)} RON</p>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mt-2">Valid {voucher.validityDays} zile</p>
    </button>
  );
}

export default function MobileExplore() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'restaurants' | 'vouchers'>('restaurants');
  const [selectedCity, setSelectedCity] = useState('Toate locațiile');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery<any[]>({
    queryKey: ['/api/restaurants', selectedCity],
    queryFn: async () => {
      const url = selectedCity === 'Toate locațiile' 
        ? `${API_BASE_URL}/api/restaurants`
        : `${API_BASE_URL}/api/restaurants?location=${encodeURIComponent(selectedCity)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      return res.json();
    }
  });

  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery<EatoffVoucher[]>({
    queryKey: ['/api/eatoff-vouchers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/eatoff-vouchers`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch vouchers');
      return res.json();
    }
  });

  const filteredRestaurants = restaurants.filter((r: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return r.name?.toLowerCase().includes(query) || 
             r.cuisine?.toLowerCase().includes(query);
    }
    return true;
  });

  const filteredVouchers = vouchers.filter((v: EatoffVoucher) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return v.name?.toLowerCase().includes(query) || 
             v.description?.toLowerCase().includes(query);
    }
    return true;
  });

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Localizarea GPS nu este disponibilă');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.municipality || 'Bucharest';
          
          const matchedCity = CITIES.find(c => 
            city.toLowerCase().includes(c.toLowerCase()) || 
            c.toLowerCase().includes(city.toLowerCase())
          );
          
          setSelectedCity(matchedCity || city);
        } catch (error) {
          console.error('Error detecting location:', error);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsDetectingLocation(false);
        alert('Nu am putut detecta locația. Verifică permisiunile GPS.');
      }
    );
  };

  const isLoading = activeTab === 'restaurants' ? restaurantsLoading : vouchersLoading;

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Location Selector */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCityPicker(true)}
            className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">{selectedCity}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          <button
            onClick={detectLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-1.5 text-sm text-primary font-medium disabled:opacity-50"
          >
            <Navigation className={cn("w-4 h-4", isDetectingLocation && "animate-pulse")} />
            {isDetectingLocation ? 'Detectare...' : 'Folosește GPS'}
          </button>
        </div>

        {/* Tabs: Restaurants / Vouchers */}
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('restaurants')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === 'restaurants' 
                ? "bg-white text-primary shadow-sm" 
                : "text-gray-500"
            )}
          >
            <Store className="w-4 h-4" />
            Restaurante
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === 'vouchers' 
                ? "bg-white text-primary shadow-sm" 
                : "text-gray-500"
            )}
          >
            <Ticket className="w-4 h-4" />
            Vouchere
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'restaurants' ? "Caută restaurante..." : "Caută vouchere..."}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="p-3.5 bg-gray-100 rounded-2xl">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Categories (only for restaurants) */}
        {activeTab === 'restaurants' && (
          <CategoryChips
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {activeTab === 'restaurants' 
              ? `${filteredRestaurants.length} restaurante găsite`
              : `${filteredVouchers.length} vouchere disponibile`
            }
          </p>
          <button className="text-sm text-primary font-medium">
            Sortează: {activeTab === 'restaurants' ? 'Cele mai bune' : 'Valoare'}
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-3xl h-48 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'restaurants' ? (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant: any) => (
              <RestaurantCard
                key={restaurant.id}
                id={restaurant.id}
                name={restaurant.name}
                image={restaurant.imageUrl}
                rating={restaurant.rating || 4.5}
                cuisine={restaurant.cuisine || 'Restaurant'}
                deliveryTime={restaurant.deliveryTime || '20-35 min'}
                cashbackPercent={restaurant.cashbackPercent || 5}
                acceptsVoucher={true}
                isRecommended={restaurant.isRecommended}
                onClick={() => setLocation(`/m/restaurant/${restaurant.id}`)}
              />
            ))}
            
            {filteredRestaurants.length === 0 && (
              <div className="text-center py-12">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nu am găsit restaurante în {selectedCity}</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 text-primary font-medium"
                >
                  Șterge filtrele
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                onClick={() => setLocation(`/checkout?eatoffVoucherId=${voucher.id}`)}
              />
            ))}
            
            {filteredVouchers.length === 0 && (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nu sunt vouchere disponibile momentan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* City Picker Modal */}
      {showCityPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-4 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Selectează orașul</h3>
              <button 
                onClick={() => setShowCityPicker(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setShowCityPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl transition-colors",
                    selectedCity === city 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-gray-100"
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
