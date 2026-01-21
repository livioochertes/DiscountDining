import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restaurant, VoucherPackage, Customer, MenuItem, Voucher, Order, DietaryProfile, AIRecommendation } from '../types';

// Replace with your actual backend URL
// For development, use your current Replit domain
const API_BASE_URL = 'https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev/api';

class ApiService {
  private baseURL = API_BASE_URL;

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Test server connection
  async testConnection(): Promise<{ success: boolean; message: string; responseTime: number }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.baseURL}/restaurants?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Connected successfully! Found ${data.length} restaurants`,
          responseTime
        };
      } else {
        return {
          success: false,
          message: `Server error: ${response.status} ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime
      };
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: Customer; token: string }> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Include cookies for session management
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store user data
    await AsyncStorage.setItem('user', JSON.stringify(data.user || data));
    
    return { user: data.user || data, token: 'session-based' };
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ user: Customer; token: string }> {
    const response = await this.request<{ user: Customer; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store the token
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<Customer | null> {
    try {
      const user = await this.request<Customer>('/auth/user');
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      // Try to get user from local storage
      try {
        const storedUser = await AsyncStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {
        return null;
      }
    }
  }

  // Restaurants
  async getRestaurants(filters?: {
    cuisine?: string;
    location?: string;
    priceRange?: string;
    minDiscount?: number;
  }): Promise<Restaurant[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/restaurants${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<Restaurant[]>(endpoint);
  }

  async getRestaurant(id: number): Promise<Restaurant> {
    return this.request<Restaurant>(`/restaurants/${id}`);
  }

  async getRestaurantFull(id: number): Promise<{
    restaurant: Restaurant;
    packages: VoucherPackage[];
    menuItems: MenuItem[];
  }> {
    return this.request<{
      restaurant: Restaurant;
      packages: VoucherPackage[];
      menuItems: MenuItem[];
    }>(`/restaurants/${id}/full`);
  }

  async getRestaurantPackages(restaurantId: number): Promise<VoucherPackage[]> {
    return this.request<VoucherPackage[]>(`/restaurants/${restaurantId}/packages`);
  }

  async getRestaurantMenu(restaurantId: number): Promise<MenuItem[]> {
    return this.request<MenuItem[]>(`/restaurants/${restaurantId}/menu`);
  }

  // Vouchers
  async getCustomerVouchers(customerId: number): Promise<Voucher[]> {
    return this.request<Voucher[]>(`/customers/${customerId}/vouchers`);
  }

  async purchaseVoucher(data: {
    customerId: number;
    packageId: number;
    paymentMethod: 'stripe' | 'points';
    paymentIntentId?: string;
    pointsUsed?: number;
  }): Promise<{ voucher: Voucher; success: boolean }> {
    return this.request<{ voucher: Voucher; success: boolean }>('/complete-voucher-purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVoucherQRCode(voucherId: number): Promise<{ qrCodeImage: string }> {
    return this.request<{ qrCodeImage: string }>(`/vouchers/${voucherId}/qr-code`);
  }

  // Orders
  async getCustomerOrders(customerId: number): Promise<Order[]> {
    return this.request<Order[]>(`/customers/${customerId}/orders`);
  }

  async createOrder(orderData: {
    customerId: number;
    restaurantId: number;
    items: Array<{
      menuItemId: number;
      quantity: number;
      specialRequests?: string;
    }>;
    orderType: 'pickup' | 'delivery';
    customerInfo: {
      name: string;
      phone: string;
      email: string;
      deliveryAddress?: string;
    };
    paymentMethod: 'stripe' | 'points';
    paymentIntentId?: string;
    pointsUsed?: number;
  }): Promise<{ order: Order; success: boolean }> {
    return this.request<{ order: Order; success: boolean }>('/complete-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Points
  async getCustomerPoints(customerId: number): Promise<{
    customerId: number;
    currentPoints: number;
    totalPointsEarned: number;
    membershipTier: string;
  }> {
    return this.request<{
      customerId: number;
      currentPoints: number;
      totalPointsEarned: number;
      membershipTier: string;
    }>(`/customers/${customerId}/points`);
  }

  async getPointsTransactions(customerId: number): Promise<Array<{
    id: number;
    customerId: number;
    type: 'earned' | 'redeemed';
    amount: number;
    description: string;
    createdAt: string;
  }>> {
    return this.request<Array<{
      id: number;
      customerId: number;
      type: 'earned' | 'redeemed';
      amount: number;
      description: string;
      createdAt: string;
    }>>(`/customers/${customerId}/points/transactions`);
  }

  // Dietary Recommendations
  async getDietaryProfile(userId: string): Promise<DietaryProfile | null> {
    return this.request<DietaryProfile | null>(`/dietary/profile`);
  }

  async updateDietaryProfile(profileData: Partial<DietaryProfile>): Promise<void> {
    return this.request<void>('/dietary/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getAIRecommendations(data: {
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    maxRecommendations?: number;
    includeRestaurants?: boolean;
    includeMenuItems?: boolean;
  }): Promise<AIRecommendation[]> {
    return this.request<AIRecommendation[]>('/dietary/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payment
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    customerId: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    return this.request<{ clientSecret: string; paymentIntentId: string }>('/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createOrderPaymentIntent(data: {
    restaurantId: number;
    items: Array<{
      menuItemId: number;
      quantity: number;
      price: number;
    }>;
    total: number;
    customerId: number;
    paymentMethod: 'stripe' | 'points';
    pointsToUse?: number;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    return this.request<{ clientSecret: string; paymentIntentId: string }>('/create-order-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();