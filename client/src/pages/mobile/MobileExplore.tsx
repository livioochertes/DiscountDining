import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { CategoryChips } from '@/components/mobile/CategoryChips';
import { RestaurantCard } from '@/components/mobile/RestaurantCard';

export default function MobileExplore() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: restaurants = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/restaurants'],
  });

  const filteredRestaurants = restaurants.filter((r: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return r.name?.toLowerCase().includes(query) || 
             r.cuisine?.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Bucharest</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="p-3.5 bg-gray-100 rounded-2xl">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Categories */}
        <CategoryChips
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredRestaurants.length} restaurants found
          </p>
          <button className="text-sm text-primary font-medium">
            Sort by: Best deals
          </button>
        </div>

        {/* Restaurant List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-3xl h-56 animate-pulse" />
            ))}
          </div>
        ) : (
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
          </div>
        )}

        {filteredRestaurants.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No restaurants found</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 text-primary font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
