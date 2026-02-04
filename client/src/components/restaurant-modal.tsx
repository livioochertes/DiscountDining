import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Phone, Mail, Globe, X, Clock, ArrowLeft, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import type { Restaurant, VoucherPackage } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { AIPackageExplainer } from "./AIPackageExplainer";
import ReservationModal from "./ReservationModal";
import { useState, useEffect } from "react";
import { imageCache } from "@/lib/imageCache";
import { instantImageLoader } from "@/lib/instantImageLoader";

interface RestaurantModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PackageCardProps {
  package: VoucherPackage;
  restaurant: Restaurant;
  onPurchase: (pkg: VoucherPackage) => void;
  isPopular?: boolean;
}



function PackageCard({ package: pkg, restaurant, onPurchase, isPopular = false }: PackageCardProps) {
  const { t } = useLanguage();
  
  // Handle both meal-based packages and EatOff vouchers with totalValue
  let regularPrice, customerPrice, savings, isPayLater, bonusAmount;
  const discount = parseFloat(pkg.discountPercentage);
  
  if (pkg.type === 'eatoff' && pkg.totalValue) {
    // EatOff voucher: use totalValue as the regular price
    regularPrice = parseFloat(pkg.totalValue);
    isPayLater = (pkg as any).voucherType === 'pay_later';
    const bonusPercentage = parseFloat((pkg as any).bonusPercentage || "0");
    
    if (isPayLater) {
      // Pay Later: customer pays more later (regular price + bonus)
      customerPrice = regularPrice * (1 + bonusPercentage / 100);
      bonusAmount = customerPrice - regularPrice;
      savings = 0; // No immediate savings, customer pays more
    } else {
      // Regular discount voucher
      customerPrice = regularPrice * (1 - discount / 100);
      savings = regularPrice - customerPrice;
      bonusAmount = 0;
    }
  } else {
    // Regular restaurant package: use mealCount * pricePerMeal
    regularPrice = parseFloat(pkg.pricePerMeal || "0") * (pkg.mealCount || 0);
    customerPrice = regularPrice * (1 - discount / 100);
    savings = regularPrice - customerPrice;
    isPayLater = false;
    bonusAmount = 0;
  }

  return (
    <Card className={`${isPopular ? 'border-2 border-primary relative' : 'border border-gray-200 hover:border-primary'} transition-colors overflow-hidden`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-primary text-white">{t.popular}</Badge>
        </div>
      )}
      
      {/* Package Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={pkg.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop"}
          alt={`${pkg.name} package`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-2 left-2 text-white">
          <div className="text-2xl font-bold">{pkg.mealCount} {t.meals}</div>
        </div>
      </div>
      
      <CardContent className="p-6 text-center">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{pkg.name}</h4>
        <div className="text-sm text-gray-600 mb-4">{t.validFor} {pkg.validityMonths} {t.months}</div>
        
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span>Voucher Value:</span>
            <span className="font-medium">€{regularPrice.toFixed(2)}</span>
          </div>
          
          {isPayLater ? (
            <>
              <div className="flex justify-between text-sm">
                <span>You pay later:</span>
                <span className="font-semibold text-accent">€{customerPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Price increase:</span>
                <span className="text-red-600">+{bonusAmount.toFixed(2)} RON</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pay in {(pkg as any).paymentTermDays || 30} days
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span>Your price:</span>
                <span className="font-semibold text-accent">€{customerPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>You save:</span>
                <span className="text-green-600">-{savings.toFixed(2)} RON</span>
              </div>
            </>
          )}
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={() => onPurchase(pkg)}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {t.purchaseNow}
          </Button>

        </div>
        
        <AIPackageExplainer
          package={pkg}
          originalPrice={regularPrice}
          discountedPrice={customerPrice}
          savings={savings}
        />
      </CardContent>
    </Card>
  );
}

// Simple translation mapping for restaurant descriptions
const translateDescription = (description: string, language: string): string => {
  // For common restaurant description phrases, provide translations
  const translations: Record<string, Record<string, string>> = {
    "Authentic Italian cuisine with fresh ingredients and traditional recipes": {
      es: "Auténtica cocina italiana con ingredientes frescos y recetas tradicionales",
      fr: "Cuisine italienne authentique avec des ingrédients frais et des recettes traditionnelles",
      de: "Authentische italienische Küche mit frischen Zutaten und traditionellen Rezepten",
      it: "Autentica cucina italiana con ingredienti freschi e ricette tradizionali",
      ro: "Bucătărie italiană autentică cu ingrediente proaspete și rețete tradiționale"
    },
    "Modern fusion restaurant combining Asian and European flavors": {
      es: "Restaurante de fusión moderna que combina sabores asiáticos y europeos",
      fr: "Restaurant fusion moderne alliant saveurs asiatiques et européennes",
      de: "Modernes Fusion-Restaurant mit asiatischen und europäischen Aromen",
      it: "Ristorante fusion moderno che combina sapori asiatici ed europei",
      ro: "Restaurant modern fusion care combină aromele asiatice și europene"
    },
    "Traditional Spanish tapas and paella with authentic flavors": {
      es: "Tapas españolas tradicionales y paella con sabores auténticos",
      fr: "Tapas espagnoles traditionnelles et paella aux saveurs authentiques",
      de: "Traditionelle spanische Tapas und Paella mit authentischen Aromen",
      it: "Tapas spagnole tradizionali e paella con sapori autentici",
      ro: "Tapas spaniole tradiționale și paella cu arome autentice"
    },
    "Classic French bistro serving traditional dishes with a modern twist": {
      es: "Bistró francés clásico que sirve platos tradicionales con un toque moderno",
      fr: "Bistrot français classique servant des plats traditionnels avec une touche moderne",
      de: "Klassisches französisches Bistro mit traditionellen Gerichten und modernem Touch",
      it: "Bistrot francese classico che serve piatti tradizionali con un tocco moderno",
      ro: "Bistro francez clasic care servește feluri tradiționale cu o notă modernă"
    },
    "Premium Japanese sushi experience with the freshest fish": {
      es: "Experiencia premium de sushi japonés con el pescado más fresco",
      fr: "Expérience sushi japonaise premium avec le poisson le plus frais",
      de: "Premium japanische Sushi-Erfahrung mit dem frischesten Fisch",
      it: "Esperienza sushi giapponese premium con il pesce più fresco",
      ro: "Experiență premium de sushi japonez cu cel mai proaspăt pește"
    },
    "Fresh and healthy Mediterranean cuisine with organic ingredients": {
      es: "Cocina mediterránea fresca y saludable con ingredientes orgánicos",
      fr: "Cuisine méditerranéenne fraîche et saine avec des ingrédients biologiques",
      de: "Frische und gesunde mediterrane Küche mit Bio-Zutaten",
      it: "Cucina mediterranea fresca e salutare con ingredienti biologici",
      ro: "Bucătărie mediteraneană proaspătă și sănătoasă cu ingrediente organice"
    },
    "Authentic Chinese cuisine with traditional recipes": {
      es: "Auténtica cocina china con recetas tradicionales",
      fr: "Cuisine chinoise authentique avec des recettes traditionnelles",
      de: "Authentische chinesische Küche mit traditionellen Rezepten",
      it: "Autentica cucina cinese con ricette tradizionali",
      ro: "Bucătărie chineză autentică cu rețete tradiționale"
    },
    "Vibrant Mexican street food and margaritas": {
      es: "Vibrante comida callejera mexicana y margaritas",
      fr: "Nourriture de rue mexicaine vibrante et margaritas",
      de: "Lebendiges mexikanisches Straßenessen und Margaritas",
      it: "Vibrante street food messicano e margaritas",
      ro: "Street food mexican vibrant și margaritas"
    },
    "Spicy Indian curries and fresh naan bread": {
      es: "Curry indio picante y pan naan fresco",
      fr: "Currys indiens épicés et pain naan frais",
      de: "Würzige indische Currys und frisches Naan-Brot",
      it: "Curry indiani piccanti e pane naan fresco",
      ro: "Curry indian picant și pâine naan proaspătă"
    },
    "Wood-fired pizzas with fresh toppings": {
      es: "Pizzas al horno de leña con ingredientes frescos",
      fr: "Pizzas au feu de bois avec des garnitures fraîches",
      de: "Holzofenpizzen mit frischen Belägen",
      it: "Pizze cotte al forno a legna con condimenti freschi",
      ro: "Pizza la cuptor cu lemne cu topping-uri proaspete"
    },
    "Minimalist sushi bar with premium fish": {
      es: "Bar de sushi minimalista con pescado premium",
      fr: "Bar à sushi minimaliste avec du poisson premium",
      de: "Minimalistische Sushi-Bar mit Premium-Fisch",
      it: "Sushi bar minimalista con pesce premium",
      ro: "Sushi bar minimalist cu pește premium"
    },
    "Gourmet burgers and craft beer selection": {
      es: "Hamburguesas gourmet y selección de cerveza artesanal",
      fr: "Burgers gourmets et sélection de bières artisanales",
      de: "Gourmet-Burger und Craft-Beer-Auswahl",
      it: "Hamburger gourmet e selezione di birre artigianali",
      ro: "Burgeri gourmet și selecție de bere artizanală"
    }
  };

  // Return translated version if available, otherwise return original
  return translations[description]?.[language] || description;
};

export default function RestaurantModal({ restaurant, isOpen, onClose }: RestaurantModalProps) {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  
  // Check if image is already cached - safely handle null restaurant
  const imageUrl = restaurant?.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop&fm=webp&q=80";
  
  const checkImageCache = async () => {
    if (!restaurant) return;
    
    // Ultra-fast cache checking with multiple systems
    if (imageCache.isCached(imageUrl) || instantImageLoader.isInstantlyAvailable(imageUrl)) {
      setIsImageLoaded(true);
      return;
    }
    
    // Ultra-aggressive preload attempt
    try {
      await Promise.race([
        imageCache.preloadImage(imageUrl),
        instantImageLoader.ultraPreload(imageUrl)
      ]);
      setIsImageLoaded(true);
    } catch (error) {
      // Fallback to regular loading
      setIsImageLoaded(true);
    }
  };
  // Calculate position directly without state dependency
  const getCurrentPosition = () => {
    if (typeof window !== 'undefined') {
      return window.scrollY + window.innerHeight / 2;
    }
    return 0;
  };

  const [scrollPosition, setScrollPosition] = useState(0);

  // Track scroll position when modal opens and while scrolling
  useEffect(() => {
    if (isOpen && restaurant) {
      // Check if image is already cached instead of resetting to false
      checkImageCache();
      
      const updateScrollPosition = () => {
        setScrollPosition(window.scrollY);
      };
      
      // Set initial position immediately
      updateScrollPosition();
      
      // Add scroll listener to update position during scroll
      window.addEventListener('scroll', updateScrollPosition, { passive: true });
      
      // Cleanup scroll listener when modal closes
      return () => {
        window.removeEventListener('scroll', updateScrollPosition);
      };
    } else {
      // Reset when modal closes
      setIsImageLoaded(false);
    }
  }, [isOpen, restaurant]);


  const { data: packages = [], isLoading: isLoadingPackages } = useQuery({
    queryKey: ['/api/restaurants', restaurant?.id, 'packages'],
    queryFn: () => restaurant ? api.getRestaurantPackages(restaurant.id) : [],
    enabled: !!restaurant?.id
  });

  // Return null early if no restaurant data
  if (!restaurant || !isOpen) return null;

  const handlePurchase = (pkg: VoucherPackage) => {
    // Navigate to checkout with package info
    setLocation(`/checkout?packageId=${pkg.id}&restaurantId=${restaurant.id}`);
    onClose();
  };



  const formatHours = (day: string, hours: string) => (
    <div className="flex justify-between" key={day}>
      <span>{day}:</span>
      <span>{hours}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden !fixed !z-[10000]" 
        style={{
          top: isOpen ? `${getCurrentPosition()}px` : '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '56rem',
          width: 'calc(100% - 2rem)',
          maxHeight: 'calc(100vh - 2rem)',
          borderRadius: '0.5rem',
          background: 'white'
        }}
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative h-64 bg-white">
          <img 
            src={imageUrl} 
            alt={`${restaurant.name} detailed view`}
            className="w-full h-64 object-cover"
            loading="eager"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setIsImageLoaded(true)}
            style={{ 
              opacity: (isImageLoaded || imageCache.isCached(imageUrl) || instantImageLoader.isInstantlyAvailable(imageUrl)) ? '1' : '0',
              transition: (imageCache.isCached(imageUrl) || instantImageLoader.isInstantlyAvailable(imageUrl)) ? 'opacity 0.01s ease-in' : 'opacity 0.15s ease-in-out',
              display: 'block'
            }}
          />
          {!isImageLoaded && !imageCache.isCached(imageUrl) && !instantImageLoader.isInstantlyAvailable(imageUrl) && (
            <div className="absolute inset-0 bg-white flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        <div className="p-8">
          <Button
            variant="outline"
            className="mb-6 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToRestaurants}
          </Button>
          <DialogHeader className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {restaurant.name}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mb-2">
                  {translateDescription(restaurant.description, language)}
                </DialogDescription>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{restaurant.rating}</span>
                    <span className="text-gray-500 ml-1">({restaurant.reviewCount} {t.reviewsCount})</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{restaurant.address}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsReservationModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t.makeReservation || 'Make Reservation'}
              </Button>
            </div>
          </DialogHeader>
          
          {/* Voucher Packages */}
          <div className="mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-primary mb-4">{t.voucherPackages}</h3>
                {isLoadingPackages ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="border rounded-lg p-6">
                            <div className="h-4 bg-gray-300 rounded mb-4"></div>
                            <div className="h-3 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No packages available</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg: VoucherPackage, index: number) => (
                      <PackageCard 
                        key={pkg.id}
                        package={pkg}
                        restaurant={restaurant}
                        onPurchase={handlePurchase}
                        isPopular={index === 1 && packages.length >= 3} // Make middle package popular if 3+ packages
                      />
                    ))}
                  </div>
                )}
                
                {/* Back Button after vouchers */}
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="mb-4 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
                    onClick={onClose}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Restaurants
                  </Button>
                </div>
            </div>
          </div>
          
          {/* Restaurant Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">About</h4>
              <p className="text-gray-600 text-sm mb-4">
                {translateDescription(restaurant.description, language)}
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Hours</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {formatHours("Monday - Thursday", "5:00 PM - 10:00 PM")}
                {formatHours("Friday - Saturday", "5:00 PM - 11:00 PM")}
                {formatHours("Sunday", "4:00 PM - 9:00 PM")}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {restaurant.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                {restaurant.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{restaurant.email}</span>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    <span>{restaurant.website}</span>
                  </div>
                )}
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Features</h4>
              <div className="flex flex-wrap gap-2">
                {restaurant.features?.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

        </div>
      </DialogContent>

      {/* Reservation Modal */}
      <ReservationModal
        open={isReservationModalOpen}
        onOpenChange={setIsReservationModalOpen}
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
        }}
      />
    </Dialog>
  );
}
