import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function MenuCart() {
  const { items, updateQuantity, removeFromCart, clearCart, canAccessCart, isAuthenticated } = useCart();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Use useMemo to ensure immediate reactivity
  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => {
      const price = typeof item.menuItem.price === 'string' 
        ? parseFloat(item.menuItem.price) 
        : item.menuItem.price;
      return total + (price * item.quantity);
    }, 0);
  }, [items]);

  const handleCheckout = () => {
    setIsOpen(false);
    setLocation('/menu-checkout');
  };





  // Don't show cart if user is not authenticated or cart is empty
  if (!canAccessCart || !isAuthenticated || totalItems === 0) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="fixed bottom-6 left-6 z-50">
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="rounded-full w-20 h-20 shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-2 border-white"
                  size="lg"
                >
                  <div className="text-3xl">🛒</div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.tooltipShoppingCart.replace('{count}', totalItems.toString())}</p>
              </TooltipContent>
            </Tooltip>
            {totalItems > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-lg font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-xl border-3 border-white animate-bounce">
                {totalItems}
              </div>
            )}
          </div>
        </div>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Your Cart
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {items.map((item) => (
                  <Card key={item.menuItem.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.menuItem.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.menuItem.description}</p>
                        {item.specialRequests && (
                          <p className="text-xs text-blue-600 mt-1">
                            Special requests: {item.specialRequests}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-medium text-primary">
                            €{(parseFloat(item.menuItem.price.toString()) * item.quantity).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.menuItem.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">€{totalPrice.toFixed(2)}</span>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                >
                  Proceed to Checkout ({totalItems} items)
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}