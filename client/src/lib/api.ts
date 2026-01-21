import { apiRequest } from "./queryClient";

export interface RestaurantFilters {
  location?: string;
  cuisine?: string;
  priceRange?: string;
  minDiscount?: number;
}

export const api = {
  // Restaurant endpoints
  async getRestaurants(filters: RestaurantFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await fetch(`/api/restaurants?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch restaurants');
    return response.json();
  },

  async getRestaurant(id: number) {
    const response = await fetch(`/api/restaurants/${id}`);
    if (!response.ok) throw new Error('Failed to fetch restaurant');
    return response.json();
  },

  async getRestaurantPackages(restaurantId: number) {
    const response = await fetch(`/api/restaurants/${restaurantId}/packages`);
    if (!response.ok) throw new Error('Failed to fetch packages');
    return response.json();
  },

  async createPackage(restaurantId: number, packageData: any) {
    return apiRequest("POST", `/api/restaurants/${restaurantId}/packages`, packageData);
  },

  async updatePackage(packageId: number, updates: any) {
    return apiRequest("PUT", `/api/packages/${packageId}`, updates);
  },

  async deletePackage(packageId: number) {
    return apiRequest("DELETE", `/api/packages/${packageId}`);
  },

  // Customer endpoints
  async getCustomer(id: number) {
    const response = await fetch(`/api/customers/${id}`);
    if (!response.ok) throw new Error('Failed to fetch customer');
    return response.json();
  },

  async getCustomerVouchers(customerId: number) {
    const response = await fetch(`/api/customers/${customerId}/vouchers`);
    if (!response.ok) throw new Error('Failed to fetch vouchers');
    return response.json();
  },

  // Payment endpoints
  async createPaymentIntent(amount: number, packageId: number, customerId: number) {
    return apiRequest("POST", "/api/create-payment-intent", {
      amount,
      packageId,
      customerId
    });
  },

  async completePurchase(paymentIntentId: string, packageId: number, customerId: number) {
    return apiRequest("POST", "/api/complete-voucher-purchase", {
      paymentIntentId,
      packageId,
      customerId
    });
  },

  // Voucher endpoints
  async redeemVoucher(voucherId: number) {
    return apiRequest("POST", `/api/vouchers/${voucherId}/redeem`);
  },

  // Analytics endpoints
  async getRestaurantAnalytics(restaurantId: number) {
    const response = await fetch(`/api/restaurants/${restaurantId}/analytics`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  // Dietary recommendations endpoints
  async getDietaryRecommendations() {
    const response = await fetch('/api/dietary/recommendations');
    if (!response.ok) throw new Error('Failed to fetch dietary recommendations');
    return response.json();
  },

  // Restaurant Portal endpoints
  async getRestaurantPortalPackages() {
    const response = await fetch('/api/restaurant-portal/packages');
    if (!response.ok) throw new Error('Failed to fetch restaurant portal packages');
    return response.json();
  }
};
