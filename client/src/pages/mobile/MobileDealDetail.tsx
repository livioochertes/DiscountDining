import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { ArrowLeft, Star, MapPin, Store } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MobileDealDetail() {
  const [, params] = useRoute('/m/deal/:id');
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const dealId = params?.id;

  const { data: deals = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/marketing-deals'],
  });

  const deal = deals.find((d: any) => String(d.id) === dealId);

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!deal) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Deal not found</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const restaurants = deal.restaurants || [];

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="relative bg-gradient-to-br from-orange-400 to-orange-500 px-5 pt-12 pb-8">
          <button
            onClick={() => setLocation('/m')}
            className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 -bottom-12 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative z-10 mt-4">
            <span className="text-4xl mb-2 block">{deal.emoji || '🎉'}</span>
            <span className="inline-block bg-white/20 rounded-full px-4 py-1.5 text-lg font-bold text-white mb-2">
              {deal.discountText}
            </span>
            <h1 className="text-2xl font-bold text-white mb-1">{deal.title}</h1>
            {deal.description && (
              <p className="text-white/80 text-sm">{deal.description}</p>
            )}
          </div>
        </div>

        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {restaurants.length > 0
              ? `${restaurants.length} ${restaurants.length === 1 ? 'restaurant' : 'restaurante'} cu acest deal`
              : 'Niciun restaurant disponibil'}
          </h2>

          <div className="space-y-3">
            {restaurants.map((r: any) => {
              const restaurant = r.restaurant || r;
              return (
                <button
                  key={restaurant.id}
                  onClick={() => setLocation(`/m/restaurant/${restaurant.id}`)}
                  className="w-full bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-left"
                >
                  <div className="flex items-stretch gap-3">
                    <div className="w-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      {restaurant.imageUrl ? (
                        <img
                          src={restaurant.imageUrl}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400/20 to-orange-500/40">
                          <Store className="w-7 h-7 text-orange-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-[15px]">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                        {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
                        {restaurant.location && (
                          <>
                            <span>•</span>
                            <span className="truncate">{restaurant.location}</span>
                          </>
                        )}
                      </div>
                      {restaurant.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-700">
                            {Number(restaurant.rating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {restaurants.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Momentan nu sunt restaurante asociate acestui deal</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
