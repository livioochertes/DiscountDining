import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { getImageUrl } from '@/lib/queryClient';

export default function MobileCart() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { marketplace } = useMarketplace();
  const cs = marketplace?.currencySymbol || '€';
  const { user } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems, getRestaurantId, restaurantName } = useCart();

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const restaurantId = getRestaurantId();

  const handleCheckout = () => {
    if (restaurantId) {
      setLocation(`/menu-checkout?restaurantId=${restaurantId}`);
    }
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg text-gray-900">{t.viewCart}</h1>
              {restaurantName && (
                <p className="text-xs text-gray-500">{restaurantName}</p>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 text-sm font-medium"
            >
              {t.clear || 'Clear'}
            </button>
          )}
        </div>

        <div className="px-4 pt-4 pb-32">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 mt-4">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">{t.emptyCart || 'Your cart is empty'}</p>
              <button
                onClick={() => setLocation('/m/explore')}
                className="text-primary font-medium text-sm mt-2"
              >
                {t.browseRestaurants || 'Browse restaurants'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const price = parseFloat(item.menuItem.price.toString());
                const lineTotal = price * item.quantity;

                return (
                  <div key={item.menuItem.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex gap-3">
                      {item.menuItem.imageUrl && (
                        <img
                          src={getImageUrl(item.menuItem.imageUrl)}
                          alt={item.menuItem.name}
                          className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900 truncate pr-2">{item.menuItem.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.menuItem.id)}
                            className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.specialRequests && (
                          <p className="text-xs text-blue-600 mt-0.5">{item.specialRequests}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-primary">{cs} {lineTotal.toFixed(2)}</span>
                          <div className="flex items-center gap-0 bg-gray-100 rounded-full">
                            <button
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-200"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-200"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="fixed bottom-20 left-0 right-0 bg-white border-t px-4 py-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
              <span className="font-bold text-lg">{cs} {totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary text-white rounded-2xl py-4 font-semibold text-base active:scale-[0.98] transition-transform shadow-lg shadow-primary/30"
            >
              {t.proceedToCheckout || 'Proceed to Checkout'}
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
