import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { EatOffSwitchDialog } from "@/components/EatOffSwitchDialog";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialRequests?: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  addToCart: (menuItem: MenuItem, quantity: number, specialRequests?: string, restaurantName?: string) => void;
  removeFromCart: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getRestaurantId: () => number | null;
  isAuthenticated: boolean;
  canAccessCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [pendingAdd, setPendingAdd] = useState<{
    menuItem: MenuItem;
    quantity: number;
    specialRequests?: string;
    restaurantName?: string;
  } | null>(null);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Authentication-based cart management
  useEffect(() => {
    if (isAuthenticated && user) {
      // User is authenticated - load their specific cart from localStorage
      const savedCart = localStorage.getItem(`eatoff_cart_${user.id}`);
      const savedRestaurantId = localStorage.getItem(`eatoff_cart_restaurant_${user.id}`);
      const savedRestaurantName = localStorage.getItem(`eatoff_cart_restaurant_name_${user.id}`);
      
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
        }
      }
      
      if (savedRestaurantId) {
        setRestaurantId(parseInt(savedRestaurantId));
      }
      
      if (savedRestaurantName) {
        setRestaurantName(savedRestaurantName);
      }
    } else {
      // User is not authenticated - clear cart completely
      setItems([]);
      setRestaurantId(null);
      setRestaurantName(null);
      
      // Clear any existing generic cart data from localStorage
      localStorage.removeItem('eatoff_cart');
      localStorage.removeItem('eatoff_cart_restaurant');
      localStorage.removeItem('eatoff_cart_restaurant_name');
    }
  }, [isAuthenticated, user?.id]);

  // Save cart to localStorage whenever it changes (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem(`eatoff_cart_${user.id}`, JSON.stringify(items));
      if (restaurantId) {
        localStorage.setItem(`eatoff_cart_restaurant_${user.id}`, restaurantId.toString());
      }
      if (restaurantName) {
        localStorage.setItem(`eatoff_cart_restaurant_name_${user.id}`, restaurantName);
      }
    }
  }, [items, restaurantId, restaurantName, isAuthenticated, user?.id]);

  const addToCart = (menuItem: MenuItem, quantity: number, specialRequests?: string, newRestaurantName?: string) => {
    // Check authentication first
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if switching restaurants
    if (restaurantId && restaurantId !== menuItem.restaurantId && items.length > 0) {
      setPendingAdd({ menuItem, quantity, specialRequests, restaurantName: newRestaurantName });
      setShowSwitchDialog(true);
      return;
    }

    // If cart is empty or same restaurant, proceed with adding
    if (items.length === 0 || restaurantId !== menuItem.restaurantId) {
      setRestaurantId(menuItem.restaurantId);
      setRestaurantName(newRestaurantName || null);
    }

    setItems(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + quantity, specialRequests }
            : item
        );
      } else {
        return [...prev, { menuItem, quantity, specialRequests }];
      }
    });

    toast({
      title: "Added to cart",
      description: `${quantity}x ${menuItem.name} added to your cart.`,
    });
  };

  const confirmSwitchRestaurant = () => {
    if (pendingAdd) {
      setItems([]);
      setRestaurantId(pendingAdd.menuItem.restaurantId);
      setRestaurantName(pendingAdd.restaurantName || null);
      
      setItems([{ 
        menuItem: pendingAdd.menuItem, 
        quantity: pendingAdd.quantity, 
        specialRequests: pendingAdd.specialRequests 
      }]);

      toast({
        title: "Cart switched",
        description: `Cart cleared and ${pendingAdd.quantity}x ${pendingAdd.menuItem.name} added.`,
      });
      
      setPendingAdd(null);
      setShowSwitchDialog(false);
    }
  };

  const cancelSwitchRestaurant = () => {
    setPendingAdd(null);
    setShowSwitchDialog(false);
  };



  const removeFromCart = (menuItemId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to modify your cart.",
        variant: "destructive",
      });
      return;
    }
    
    setItems(prev => {
      const filtered = prev.filter(item => item.menuItem.id !== menuItemId);
      if (filtered.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
        if (user) {
          localStorage.removeItem(`eatoff_cart_restaurant_${user.id}`);
          localStorage.removeItem(`eatoff_cart_restaurant_name_${user.id}`);
        }
      }
      return filtered;
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to modify your cart.",
        variant: "destructive",
      });
      return;
    }
    
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
    
    if (user) {
      localStorage.removeItem(`eatoff_cart_${user.id}`);
      localStorage.removeItem(`eatoff_cart_restaurant_${user.id}`);
      localStorage.removeItem(`eatoff_cart_restaurant_name_${user.id}`);
    }
    
    // Also clear any legacy localStorage keys
    localStorage.removeItem('eatoff_cart');
    localStorage.removeItem('eatoff_cart_restaurant');
    localStorage.removeItem('eatoff_cart_restaurant_name');
  };

  const getTotalItems = () => {
    if (!isAuthenticated) return 0;
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    if (!isAuthenticated) return 0;
    return items.reduce((total, item) => {
      const price = typeof item.menuItem.price === 'string' 
        ? parseFloat(item.menuItem.price) 
        : item.menuItem.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getRestaurantId = () => isAuthenticated ? restaurantId : null;



  return (
    <CartContext.Provider value={{
      items: isAuthenticated ? items : [],
      restaurantId: isAuthenticated ? restaurantId : null,
      restaurantName: isAuthenticated ? restaurantName : null,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      getRestaurantId,
      isAuthenticated,
      canAccessCart: isAuthenticated
    }}>
      {children}
      {pendingAdd && (
        <EatOffSwitchDialog
          open={showSwitchDialog}
          onOpenChange={setShowSwitchDialog}
          currentRestaurant={restaurantName || 'Current Restaurant'}
          newRestaurant={pendingAdd.restaurantName || 'New Restaurant'}
          onConfirm={confirmSwitchRestaurant}
          onCancel={cancelSwitchRestaurant}
        />
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}