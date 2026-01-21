import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ShoppingCart, Star, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MenuCart, { type CartItem } from "./menu-cart";
import type { MenuItem, Restaurant } from "@shared/schema";

interface RestaurantMenuProps {
  restaurant: Restaurant;
  onOrderNow: (cartItems: CartItem[]) => void;
}

interface AddToCartDialogProps {
  menuItem: MenuItem;
  onAddToCart: (item: CartItem) => void;
}

function AddToCartDialog({ menuItem, onAddToCart }: AddToCartDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddToCart = () => {
    onAddToCart({
      menuItem,
      quantity,
      specialRequests: specialRequests.trim() || undefined,
    });
    setQuantity(1);
    setSpecialRequests("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{menuItem.name}</DialogTitle>
          <DialogDescription>
            Customize your order by selecting quantity and adding special requests.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{menuItem.description}</p>
            <p className="text-lg font-semibold text-primary">€{menuItem.price}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special-requests">Special Requests (Optional)</Label>
            <Textarea
              id="special-requests"
              placeholder="Any special preparations, allergies, or preferences..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <span className="text-lg font-semibold">
              Total: €{(parseFloat(menuItem.price) * quantity).toFixed(2)}
            </span>
            <Button onClick={handleAddToCart} className="min-w-[120px]">
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RestaurantMenu({ restaurant, onOrderNow }: RestaurantMenuProps) {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["/api/restaurants", restaurant.id, "menu"],
  });

  const categories = menuItems && Array.isArray(menuItems) 
    ? ["all", ...Array.from(new Set(menuItems.map((item: MenuItem) => item.category)))] 
    : ["all"];

  const filteredItems = menuItems && Array.isArray(menuItems) 
    ? menuItems.filter((item: MenuItem) => 
        selectedCategory === "all" || item.category === selectedCategory
      ) 
    : [];

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.menuItem.id === newItem.menuItem.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
          specialRequests: newItem.specialRequests || updated[existingIndex].specialRequests,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, newItem];
      }
    });

    toast({
      title: "Added to Cart",
      description: `${newItem.quantity}x ${newItem.menuItem.name} added to your order`,
    });
  };

  const updateCartQuantity = (menuItemId: number, quantity: number) => {
    if (quantity === 0) {
      setCartItems(prev => prev.filter(item => item.menuItem.id !== menuItemId));
    } else {
      setCartItems(prev => prev.map(item => 
        item.menuItem.id === menuItemId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromCart = (menuItemId: number) => {
    setCartItems(prev => prev.filter(item => item.menuItem.id !== menuItemId));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout",
        variant: "destructive"
      });
      return;
    }
    
    // Store cart data in localStorage for checkout page
    localStorage.setItem("menuCart", JSON.stringify(cartItems));
    localStorage.setItem("currentRestaurantId", restaurant.id.toString());
    
    onOrderNow(cartItems);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Restaurant Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">{restaurant.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {restaurant.location}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {restaurant.rating} ({restaurant.reviewCount} reviews)
              </div>
              <Badge variant="secondary">{restaurant.cuisine}</Badge>
              <Badge variant="outline">{restaurant.priceRange}</Badge>
            </div>
          </div>
          {restaurant.imageUrl && (
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredItems.length === 0 && (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">No menu items found</p>
              </div>
            )}
            {filteredItems.map((item: MenuItem) => (
              <Card key={item.id} className="overflow-hidden">
                {item.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">€{item.price}</p>
                      {item.isPopular && (
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      )}
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Ingredients: {item.ingredients.join(", ")}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {(item as any).isVegetarian && <Badge variant="outline" className="text-xs">Vegetarian</Badge>}
                    {(item as any).isVegan && <Badge variant="outline" className="text-xs">Vegan</Badge>}
                    {(item as any).isGlutenFree && <Badge variant="outline" className="text-xs">Gluten Free</Badge>}
                    {(item as any).isSpicy && <Badge variant="outline" className="text-xs">Spicy</Badge>}
                  </div>

                  <div className="mt-4">
                    <Button 
                      onClick={() => {
                        addToCart({
                          menuItem: item,
                          quantity: 1,
                          specialRequests: ""
                        });
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                      size="lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Basket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Shopping Cart */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <MenuCart
              items={cartItems}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}