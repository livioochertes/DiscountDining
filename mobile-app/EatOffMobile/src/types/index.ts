// Shared types from the main application
export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  rating: string | number;
  image: string;
  priceRange: string;
  phone?: string;
  email?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface VoucherPackage {
  id: number;
  restaurantId: number;
  name: string;
  meals: number;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  validityMonths: number;
  description: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  membershipTier: string;
  currentPoints: number;
  totalPointsEarned: number;
  accountBalance: number;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  ingredients?: string[];
  allergies?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
}

export interface Voucher {
  id: number;
  customerId: number;
  packageId: number;
  purchaseDate: string;
  expiryDate: string;
  mealsRemaining: number;
  totalMeals: number;
  status: 'active' | 'expired' | 'used';
  restaurant: Restaurant;
  package: VoucherPackage;
}

export interface Order {
  id: number;
  customerId: number;
  restaurantId: number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'pickup' | 'delivery';
  createdAt: string;
  restaurant: Restaurant;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  price: number;
  menuItem: MenuItem;
  specialRequests?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  restaurantId: number;
  specialRequests?: string;
}

export interface DietaryProfile {
  userId: string;
  age?: number;
  height?: number;
  weight?: string;
  gender?: string;
  activityLevel?: string;
  healthGoal?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
  foodIntolerances?: string[];
  preferredCuisines?: string[];
  healthConditions?: string[];
  calorieTarget?: number;
  budgetRange?: string;
}

export interface AIRecommendation {
  type: 'restaurant' | 'menu_item';
  targetId: number;
  score: number;
  reasoning: string[];
  nutritionalHighlights: string[];
  cautionaryNotes: string[];
  restaurant?: Restaurant;
  menuItem?: MenuItem;
}