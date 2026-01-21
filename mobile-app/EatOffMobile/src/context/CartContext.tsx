import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, MenuItem } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number, specialRequests?: string) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  currentRestaurantId: number | null;
  canAddItem: (restaurantId: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Load cart from AsyncStorage when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [user, isAuthenticated]);

  // Save cart to AsyncStorage whenever items change
  useEffect(() => {
    if (isAuthenticated && user) {
      saveCart();
    }
  }, [items, user, isAuthenticated]);

  const getCartKey = () => {
    return user ? `eatoff_cart_${user.id}` : 'eatoff_cart_guest';
  };

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem(getCartKey());
      if (cartData) {
        const parsedCart = JSON.parse(cartData);
        setItems(parsedCart);
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(getCartKey(), JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  };

  const currentRestaurantId = items.length > 0 ? items[0].restaurantId : null;

  const canAddItem = (restaurantId: number): boolean => {
    return currentRestaurantId === null || currentRestaurantId === restaurantId;
  };

  const addItem = (menuItem: MenuItem, quantity: number, specialRequests?: string) => {
    if (!canAddItem(menuItem.restaurantId)) {
      throw new Error('Cannot add items from different restaurants');
    }

    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.menuItem.id === menuItem.id
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          specialRequests: specialRequests || updatedItems[existingItemIndex].specialRequests,
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, {
          menuItem,
          quantity,
          restaurantId: menuItem.restaurantId,
          specialRequests,
        }];
      }
    });
  };

  const removeItem = (menuItemId: number) => {
    setItems(prevItems => prevItems.filter(item => item.menuItem.id !== menuItemId));
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const getItemCount = (): number => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getItemCount,
    currentRestaurantId,
    canAddItem,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};