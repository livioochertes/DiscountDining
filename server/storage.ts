import { 
  restaurants, 
  voucherPackages, 
  customers, 
  purchasedVouchers, 
  voucherRedemptions,
  menuItems,
  restaurantOwners,
  voucherTemplates,
  orders,
  orderItems,
  users,
  userAddresses,
  pointsTransactions,
  pointsRedemptions,
  adminUsers,
  platformSettings,
  restaurantFinances,
  platformAnalytics,
  tableReservations,
  restaurantAvailability,
  eatoffVouchers,
  deferredPayments,
  loyaltyCategories,
  loyalCustomers,
  paymentRequests,
  type Restaurant, 
  type InsertRestaurant,
  type VoucherPackage,
  type InsertVoucherPackage,
  type Customer,
  type InsertCustomer,
  type PurchasedVoucher,
  type InsertPurchasedVoucher,
  type VoucherRedemption,
  type InsertVoucherRedemption,
  type MenuItem,
  type InsertMenuItem,
  type RestaurantOwner,
  type InsertRestaurantOwner,
  type VoucherTemplate,
  type InsertVoucherTemplate,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type User,
  type UpsertUser,
  type UserAddress,
  type InsertUserAddress,
  type PointsTransaction,
  type InsertPointsTransaction,
  type PointsRedemption,
  type InsertPointsRedemption,
  type AdminUser,
  type InsertAdminUser,
  type PlatformSetting,
  type InsertPlatformSetting,
  type RestaurantFinance,
  type InsertRestaurantFinance,
  type PlatformAnalytics,
  type InsertPlatformAnalytics,
  type TableReservation,
  type InsertTableReservation,
  type RestaurantAvailability,
  type InsertRestaurantAvailability,
  type EatoffVoucher,
  type InsertEatoffVoucher,
  type LoyaltyCategory,
  type InsertLoyaltyCategory,
  type LoyalCustomer,
  type InsertLoyalCustomer,
  type PaymentRequest,
  type InsertPaymentRequest,
  customerFavorites,
  customerReviews,
  type CustomerFavorite,
  type InsertCustomerFavorite,
  type CustomerReview,
  type InsertCustomerReview
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, sql, ne } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Restaurant Owner operations
  getRestaurantOwnerByEmail(email: string): Promise<RestaurantOwner | undefined>;
  getRestaurantOwnerById(id: number): Promise<RestaurantOwner | undefined>;
  getRestaurantOwnersByCompany(companyName: string): Promise<RestaurantOwner[]>;
  createRestaurantOwner(owner: InsertRestaurantOwner & { passwordHash: string }): Promise<RestaurantOwner>;
  updateRestaurantOwner(id: number, updates: Partial<RestaurantOwner>): Promise<RestaurantOwner | undefined>;
  deleteRestaurantOwner(id: number): Promise<boolean>;
  getRestaurantsByOwner(ownerId: number): Promise<Restaurant[]>;
  getRestaurantOwnerUsers(ownerId: number): Promise<RestaurantOwner[]>;

  // Voucher Template operations
  getVoucherTemplates(): Promise<VoucherTemplate[]>;
  getVoucherTemplateById(id: number): Promise<VoucherTemplate | undefined>;
  getVoucherTemplatesByCategory(category: string): Promise<VoucherTemplate[]>;

  // Restaurant operations
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurantById(id: number): Promise<Restaurant | undefined>;
  getRestaurantsByFilters(filters: {
    location?: string;
    cuisine?: string;
    priceRange?: string;
    minDiscount?: number;
  }): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<boolean>;

  // Voucher package operations
  getPackagesByRestaurant(restaurantId: number): Promise<VoucherPackage[]>;
  getAllActivePackages(): Promise<VoucherPackage[]>;
  getPackageById(id: number): Promise<VoucherPackage | undefined>;
  createPackage(packageData: InsertVoucherPackage): Promise<VoucherPackage>;
  updatePackage(id: number, packageData: Partial<InsertVoucherPackage>): Promise<VoucherPackage | undefined>;
  deletePackage(id: number): Promise<boolean>;

  // EatOff voucher operations
  getEatoffVouchers(): Promise<EatoffVoucher[]>;
  getEatoffVoucherById(id: number): Promise<EatoffVoucher | undefined>;
  createEatoffVoucher(voucherData: InsertEatoffVoucher): Promise<EatoffVoucher>;
  updateEatoffVoucher(id: number, voucherData: Partial<InsertEatoffVoucher>): Promise<EatoffVoucher | undefined>;
  deleteEatoffVoucher(id: number): Promise<boolean>;

  // Deferred payment operations
  createDeferredPayment(paymentData: any): Promise<any>;
  getDeferredPaymentsByCustomer(customerId: string): Promise<any[]>;
  getPendingDeferredPayments(): Promise<any[]>;
  updateDeferredPaymentStatus(id: number, status: string, chargedAt?: Date): Promise<any>;

  // Customer operations
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Voucher operations
  getPurchasedVouchersByCustomer(customerId: number): Promise<PurchasedVoucher[]>;
  getPurchasedVouchersWithRestaurantDetails(customerId: number): Promise<(PurchasedVoucher & { restaurant: { name: string; imageUrl: string | null; cuisine: string; address: string; rating: string | null; googleRating: string | null; googleReviewCount: number | null; reviewCount: number | null; } })[]>;
  getPurchasedVoucherById(id: number): Promise<PurchasedVoucher | undefined>;
  createPurchasedVoucher(voucher: InsertPurchasedVoucher): Promise<PurchasedVoucher>;
  updateVoucherUsage(id: number, usedMeals: number): Promise<PurchasedVoucher | undefined>;

  // Redemption operations
  getRedemptionsByVoucher(voucherId: number): Promise<VoucherRedemption[]>;
  createRedemption(redemption: InsertVoucherRedemption): Promise<VoucherRedemption>;

  // Menu operations
  getMenuItemsByRestaurant(restaurantId: number): Promise<MenuItem[]>;
  getMenuItemById(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;

  // Admin operations
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: InsertAdminUser & { passwordHash: string }): Promise<AdminUser>;
  updateAdminUser(id: number, updates: Partial<AdminUser>): Promise<AdminUser | undefined>;
  updateAdminLastLogin(id: number): Promise<void>;

  // Platform settings operations
  getPlatformSettings(): Promise<PlatformSetting[]>;
  getPlatformSetting(key: string): Promise<PlatformSetting | undefined>;
  setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting>;

  // Restaurant finance operations
  getRestaurantFinances(restaurantId: number): Promise<RestaurantFinance[]>;
  createRestaurantFinance(finance: InsertRestaurantFinance): Promise<RestaurantFinance>;
  updateRestaurantFinance(id: number, finance: Partial<InsertRestaurantFinance>): Promise<RestaurantFinance | undefined>;

  // Platform analytics operations
  getPlatformAnalytics(): Promise<PlatformAnalytics[]>;
  createPlatformAnalytics(analytics: InsertPlatformAnalytics): Promise<PlatformAnalytics>;

  // Points operations
  getCustomerPointsData(customerId: number): Promise<{ currentPoints: number; totalEarned: number; membershipTier: string; transactions: PointsTransaction[] }>;
  getPointsTransactionsByCustomer(customerId: number): Promise<PointsTransaction[]>;
  createPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction>;
  updateCustomerPoints(customerId: number, pointsDelta: number): Promise<Customer | undefined>;
  
  // Order operations
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getOrdersByRestaurant(restaurantId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Reservation operations
  getTableReservationsByCustomer(customerId: number): Promise<TableReservation[]>;
  getTableReservationsByRestaurant(restaurantId: number): Promise<TableReservation[]>;
  createTableReservation(reservation: InsertTableReservation): Promise<TableReservation>;
  updateTableReservation(id: number, reservation: Partial<InsertTableReservation>): Promise<TableReservation | undefined>;
  getRestaurantAvailability(restaurantId: number): Promise<RestaurantAvailability[]>;
  createRestaurantAvailability(availability: InsertRestaurantAvailability): Promise<RestaurantAvailability>;

  // Analytics
  getRestaurantAnalytics(restaurantId: number): Promise<{
    totalSales: number;
    vouchersSold: number;
    totalRedemptions: number;
    averagePackageSize: number;
  }>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  createOrderWithItems(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrdersByRestaurant(restaurantId: number): Promise<Order[]>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string, restaurantNotes?: string): Promise<Order | undefined>;
  getOrderWithDetails(id: number): Promise<(Order & { restaurant: Restaurant; items: (OrderItem & { menuItem: MenuItem })[] }) | undefined>;

  // User Address operations
  getUserAddresses(userId: string): Promise<UserAddress[]>;
  getUserAddressById(id: number): Promise<UserAddress | undefined>;
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(id: number, address: Partial<InsertUserAddress>): Promise<UserAddress | undefined>;
  deleteUserAddress(id: number): Promise<boolean>;
  setDefaultAddress(userId: string, addressId: number): Promise<void>;

  // Points System operations
  getCustomerPointsData(customerId: number): Promise<{ currentPoints: number } | null>;
  getPointsTransactionsByCustomer(customerId: number): Promise<PointsTransaction[]>;
  createPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction>;
  updateCustomerPoints(customerId: number, pointsChange: number): Promise<Customer | undefined>;
  getPointsRedemptionsByCustomer(customerId: number): Promise<PointsRedemption[]>;
  createPointsRedemption(redemption: InsertPointsRedemption): Promise<PointsRedemption>;
  calculatePointsValue(points: number): number; // Convert points to cash value
  redeemPointsForPayment(customerId: number, restaurantId: number, pointsToRedeem: number, orderId?: number): Promise<PointsRedemption>;

  // Admin Management operations
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: Omit<InsertAdminUser, 'password'> & { passwordHash: string }): Promise<AdminUser>;
  updateAdminUser(id: number, updates: Partial<AdminUser>): Promise<AdminUser | undefined>;
  updateAdminLastLogin(id: number): Promise<void>;
  getAllAdminUsers(): Promise<AdminUser[]>;

  // Platform Settings operations
  getPlatformSettings(): Promise<PlatformSetting[]>;
  getPlatformSettingByKey(key: string): Promise<PlatformSetting | undefined>;
  setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting>;
  updatePlatformSetting(key: string, value: string, updatedBy: number): Promise<PlatformSetting | undefined>;

  // Restaurant Finance operations
  getRestaurantFinances(restaurantId: number): Promise<RestaurantFinance[]>;
  getRestaurantFinanceByMonth(restaurantId: number, month: number, year: number): Promise<RestaurantFinance | undefined>;
  createOrUpdateRestaurantFinance(finance: InsertRestaurantFinance): Promise<RestaurantFinance>;
  updateRestaurantCommission(restaurantId: number, amount: number, month: number, year: number): Promise<void>;
  getAllPendingSettlements(): Promise<RestaurantFinance[]>;

  // Platform Analytics operations
  getPlatformAnalytics(startDate?: Date, endDate?: Date): Promise<PlatformAnalytics[]>;
  createPlatformAnalytics(analytics: InsertPlatformAnalytics): Promise<PlatformAnalytics>;
  getDashboardMetrics(): Promise<{
    totalUsers: number;
    totalRestaurants: number;
    totalRevenue: number;
    totalCommission: number;
    activeUsers: number;
    activeRestaurants: number;
  }>;

  // Wallet System operations
  getCustomerWallet(customerId: number): Promise<any>;
  createCustomerWallet(wallet: any): Promise<any>;
  updateWalletBalance(customerId: number, newBalance: string): Promise<any>;
  createWalletTransaction(transaction: any): Promise<any>;
  getWalletTransactions(customerId: number, limit?: number): Promise<any[]>;
  getCustomerGeneralVouchers(customerId: number): Promise<any[]>;
  getAvailableGeneralVouchers(filters?: any): Promise<any[]>;

  // Order operations (additional methods)
  getRestaurantOrders(ownerId: number): Promise<any[]>;

  // Table Reservation operations
  getReservationsByRestaurant(restaurantId: number): Promise<any[]>;
  getReservationsByCustomer(customerId: number): Promise<any[]>;
  getReservationById(id: number): Promise<any | undefined>;
  createReservation(reservation: any): Promise<any>;
  updateReservationStatus(id: number, status: string, restaurantNotes?: string, confirmedBy?: number): Promise<any | undefined>;
  getRestaurantAvailability(restaurantId: number): Promise<any[]>;
  setRestaurantAvailability(availability: any): Promise<any>;
  updateRestaurantAvailability(id: number, updates: any): Promise<any | undefined>;

  // EatOff voucher operations
  getAllEatoffVouchers(): Promise<EatoffVoucher[]>;
  getActiveEatoffVouchers(): Promise<EatoffVoucher[]>;
  getEatoffVoucherById(id: number): Promise<EatoffVoucher | undefined>;
  createEatoffVoucher(voucher: InsertEatoffVoucher): Promise<EatoffVoucher>;
  updateEatoffVoucher(id: number, voucher: Partial<InsertEatoffVoucher>): Promise<EatoffVoucher | undefined>;
  deleteEatoffVoucher(id: number): Promise<boolean>;

  // Deferred Payment operations for Pay Later vouchers
  createDeferredPayment(payment: { 
    customerId: number;
    voucherId: number;
    originalAmount: string;
    bonusAmount: string;
    totalVoucherValue: string;
    paymentMethodId: string;
    stripeCustomerId: string;
    chargeDate: Date;
  }): Promise<{ id: number }>;
  getDeferredPaymentsPendingCharge(): Promise<any[]>;
  updateDeferredPaymentStatus(id: number, status: string, paymentIntentId?: string): Promise<void>;
  getDeferredPaymentsByCustomer(customerId: number): Promise<any[]>;

  // Loyalty System operations
  getLoyaltyCategoriesByRestaurant(restaurantId: number): Promise<LoyaltyCategory[]>;
  getLoyaltyCategoryById(id: number): Promise<LoyaltyCategory | undefined>;
  createLoyaltyCategory(category: InsertLoyaltyCategory): Promise<LoyaltyCategory>;
  updateLoyaltyCategory(id: number, updates: Partial<InsertLoyaltyCategory>): Promise<LoyaltyCategory | undefined>;
  deleteLoyaltyCategory(id: number): Promise<boolean>;

  // Loyal Customers operations
  getLoyalCustomersByRestaurant(restaurantId: number): Promise<LoyalCustomer[]>;
  getLoyalCustomersByCustomer(customerId: number): Promise<LoyalCustomer[]>;
  getLoyalCustomer(customerId: number, restaurantId: number): Promise<LoyalCustomer | undefined>;
  createLoyalCustomer(loyalCustomer: InsertLoyalCustomer): Promise<LoyalCustomer>;
  updateLoyalCustomer(id: number, updates: Partial<InsertLoyalCustomer>): Promise<LoyalCustomer | undefined>;
  enrollCustomerToRestaurant(customerCode: string, restaurantId: number): Promise<LoyalCustomer | null>;

  // Payment Request operations
  getPaymentRequestById(id: number): Promise<PaymentRequest | undefined>;
  getPaymentRequestsByRestaurant(restaurantId: number): Promise<PaymentRequest[]>;
  getPaymentRequestsByCustomer(customerId: number): Promise<PaymentRequest[]>;
  getPendingPaymentRequestsByCustomer(customerId: number): Promise<PaymentRequest[]>;
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  updatePaymentRequest(id: number, updates: Partial<InsertPaymentRequest>): Promise<PaymentRequest | undefined>;
  
  // Customer code generation
  generateCustomerCode(customerId: number): Promise<string>;
  getCustomerByCode(customerCode: string): Promise<Customer | undefined>;

  // Customer Favorites operations
  getCustomerFavorites(customerId: number): Promise<CustomerFavorite[]>;
  addCustomerFavorite(favorite: InsertCustomerFavorite): Promise<CustomerFavorite>;
  removeCustomerFavorite(customerId: number, restaurantId: number): Promise<boolean>;
  isRestaurantFavorite(customerId: number, restaurantId: number): Promise<boolean>;

  // Customer Reviews operations
  getReviewsByRestaurant(restaurantId: number): Promise<CustomerReview[]>;
  getReviewsByCustomer(customerId: number): Promise<CustomerReview[]>;
  createReview(review: InsertCustomerReview): Promise<CustomerReview>;
  updateReview(id: number, updates: Partial<InsertCustomerReview>): Promise<CustomerReview | undefined>;
  deleteReview(id: number): Promise<boolean>;
  getRestaurantAverageRating(restaurantId: number): Promise<{ avgRating: number; count: number }>;
}

export class MemStorage implements IStorage {
  private restaurants: Map<number, Restaurant> = new Map();
  private voucherPackages: Map<number, VoucherPackage> = new Map();
  private customers: Map<number, Customer> = new Map();
  private purchasedVouchers: Map<number, PurchasedVoucher> = new Map();
  private voucherRedemptions: Map<number, VoucherRedemption> = new Map();
  private menuItems: Map<number, MenuItem> = new Map();
  private restaurantOwners: Map<number, RestaurantOwner> = new Map();
  private voucherTemplates: Map<number, VoucherTemplate> = new Map();
  private users: Map<string, User> = new Map();
  private userAddresses: Map<number, UserAddress> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  
  // New storage maps for three-section architecture
  private pointsTransactions: Map<number, PointsTransaction> = new Map();
  private pointsRedemptions: Map<number, PointsRedemption> = new Map();
  private adminUsers: Map<number, AdminUser> = new Map();
  private platformSettings: Map<string, PlatformSetting> = new Map();
  private restaurantFinances: Map<string, RestaurantFinance> = new Map(); // key: restaurantId-month-year
  private platformAnalytics: Map<string, PlatformAnalytics> = new Map(); // key: date
  private eatoffVouchers: Map<number, EatoffVoucher> = new Map();
  private deferredPayments: Map<number, any> = new Map();
  
  private currentRestaurantId = 1;
  private currentPackageId = 1;
  private currentCustomerId = 1;
  private currentVoucherId = 1;
  private currentRedemptionId = 1;
  private currentMenuItemId = 1;
  private currentOwnerId = 1;
  private currentTemplateId = 1;
  private currentOrderId = 1;
  private currentOrderItemId = 1;
  private currentUserAddressId = 1;
  private currentPointsTransactionId = 1;
  private currentPointsRedemptionId = 1;
  private currentAdminUserId = 1;
  private currentPlatformSettingId = 1;
  private currentRestaurantFinanceId = 1;
  private currentPlatformAnalyticsId = 1;
  private currentEatoffVoucherId = 1;
  private currentDeferredPaymentId = 1;

  constructor() {
    this.seedData();
    this.seedAdminUser();
  }

  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      ...userData,
      createdAt: this.users.get(userData.id)?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  private seedData() {
    // Seed restaurants
    const restaurantData: InsertRestaurant[] = [
      {
        name: "Bella Vista",
        description: "Authentic Italian cuisine in the heart of downtown",
        cuisine: "Italian",
        location: "Downtown",
        address: "123 Main St, Downtown",
        phone: "(555) 123-4567",
        email: "info@bellavista.com",
        website: "www.bellavista.com",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 127,
        priceRange: "€€",
        features: ["Romantic Dining", "Wine Bar", "Private Events", "Outdoor Seating"],
        isActive: true
      },
      {
        name: "Sakura Sushi",
        description: "Premium Japanese sushi experience",
        cuisine: "Asian",
        location: "City Center",
        address: "456 Oak Ave, City Center",
        phone: "(555) 234-5678",
        email: "contact@sakurasushi.com",
        website: "www.sakurasushi.com",
        imageUrl: "https://pixabay.com/get/g3843efb5b24a09d1ca1f2d31a9d9663703f10c5aa76e2688f93eb0f3a981f638dc8c2c4756dfe0d332edd3610b4126f138ccaf3be8304e855c1684bb41580bf9_1280.jpg",
        rating: "4.9",
        reviewCount: 89,
        priceRange: "€€€",
        features: ["Fresh Sushi", "Sake Bar", "Chef's Table"],
        isActive: true
      },
      {
        name: "Le Petit Bistro",
        description: "Classic French cuisine in a cozy atmosphere",
        cuisine: "French",
        location: "Suburbs",
        address: "789 Pine St, Suburbs",
        phone: "(555) 345-6789",
        email: "hello@lepetitbistro.com",
        website: "www.lepetitbistro.com",
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 203,
        priceRange: "€€",
        features: ["French Cuisine", "Wine Selection", "Cozy Atmosphere"],
        isActive: true
      },
      {
        name: "Mediterranean Breeze",
        description: "Fresh Mediterranean dishes with a modern twist",
        cuisine: "Mediterranean",
        location: "Downtown",
        address: "321 Elm St, Downtown",
        phone: "(555) 456-7890",
        email: "info@medbreeze.com",
        website: "www.medbreeze.com",
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 156,
        priceRange: "€€",
        features: ["Mediterranean", "Healthy Options", "Outdoor Terrace"],
        isActive: true
      },
      {
        name: "Dragon Palace",
        description: "Authentic Chinese cuisine with traditional flavors",
        cuisine: "Asian",
        location: "City Center",
        address: "555 Dragon St, City Center",
        phone: "(555) 567-8901",
        email: "info@dragonpalace.com",
        website: "www.dragonpalace.com",
        imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 198,
        priceRange: "€€",
        features: ["Chinese Cuisine", "Dim Sum", "Private Rooms"],
        isActive: true
      },
      {
        name: "Pizzeria Roma",
        description: "Wood-fired pizza in the authentic Roman style",
        cuisine: "Italian",
        location: "Suburbs",
        address: "777 Pizza Blvd, Suburbs",
        phone: "(555) 678-9012",
        email: "contact@pizzeriaroma.com",
        website: "www.pizzeriaroma.com",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 142,
        priceRange: "€",
        features: ["Wood-fired Pizza", "Italian Wines", "Family Friendly"],
        isActive: true
      },
      {
        name: "Spice Garden",
        description: "Vibrant Indian flavors and aromatic spices",
        cuisine: "Asian",
        location: "Downtown",
        address: "888 Spice Ave, Downtown",
        phone: "(555) 789-0123",
        email: "hello@spicegarden.com",
        website: "www.spicegarden.com",
        imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 167,
        priceRange: "€€",
        features: ["Indian Cuisine", "Vegetarian Options", "Spice Market"],
        isActive: true
      },
      {
        name: "Coastal Catch",
        description: "Fresh seafood with ocean views",
        cuisine: "Mediterranean",
        location: "City Center",
        address: "999 Marina Dr, City Center",
        phone: "(555) 890-1234",
        email: "info@coastalcatch.com",
        website: "www.coastalcatch.com",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 221,
        priceRange: "€€€",
        features: ["Fresh Seafood", "Ocean Views", "Sustainable Fishing"],
        isActive: true
      },
      {
        name: "Café Lumière",
        description: "Charming French café with pastries and coffee",
        cuisine: "French",
        location: "Downtown",
        address: "111 Café St, Downtown",
        phone: "(555) 901-2345",
        email: "bonjour@cafelumiere.com",
        website: "www.cafelumiere.com",
        imageUrl: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 89,
        priceRange: "€",
        features: ["French Pastries", "Artisan Coffee", "Cozy Atmosphere"],
        isActive: true
      },
      {
        name: "Bamboo House",
        description: "Modern Asian fusion with innovative dishes",
        cuisine: "Asian",
        location: "Suburbs",
        address: "222 Bamboo Ln, Suburbs",
        phone: "(555) 012-3456",
        email: "info@bamboohouse.com",
        website: "www.bamboohouse.com",
        imageUrl: "https://images.unsplash.com/photo-1512003867696-6d5ce6835040?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 134,
        priceRange: "€€",
        features: ["Asian Fusion", "Modern Decor", "Cocktail Bar"],
        isActive: true
      },
      {
        name: "Villa Toscana",
        description: "Elegant Italian dining with Tuscan specialties",
        cuisine: "Italian",
        location: "City Center",
        address: "333 Tuscany Way, City Center",
        phone: "(555) 123-4567",
        email: "ciao@villatoscana.com",
        website: "www.villatoscana.com",
        imageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 178,
        priceRange: "€€€",
        features: ["Tuscan Cuisine", "Wine Cellar", "Romantic Setting"],
        isActive: true
      },
      // Additional 39 restaurants to reach 50 total
      {
        name: "Taco Fiesta",
        description: "Authentic Mexican street food and vibrant atmosphere",
        cuisine: "Mexican",
        location: "Downtown",
        address: "444 Salsa St, Downtown",
        phone: "(555) 234-5678",
        email: "hola@tacofiesta.com",
        website: "www.tacofiesta.com",
        imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=800&h=400",
        rating: "4.3",
        reviewCount: 156,
        priceRange: "€",
        features: ["Mexican Cuisine", "Outdoor Seating", "Live Music"],
        isActive: true
      },
      {
        name: "Steakhouse Prime",
        description: "Premium steaks and fine dining experience",
        cuisine: "American",
        location: "City Center",
        address: "567 Beef Ave, City Center",
        phone: "(555) 345-6789",
        email: "info@steakhouseprime.com",
        website: "www.steakhouseprime.com",
        imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 203,
        priceRange: "€€€",
        features: ["Premium Steaks", "Wine List", "Private Dining"],
        isActive: true
      },
      {
        name: "Noodle Express",
        description: "Quick and delicious Asian noodle dishes",
        cuisine: "Asian",
        location: "Suburbs",
        address: "678 Noodle Ln, Suburbs",
        phone: "(555) 456-7890",
        email: "contact@noodleexpress.com",
        website: "www.noodleexpress.com",
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&h=400",
        rating: "4.2",
        reviewCount: 89,
        priceRange: "€",
        features: ["Fast Service", "Asian Noodles", "Takeaway"],
        isActive: true
      },
      {
        name: "Greek Garden",
        description: "Fresh Mediterranean dishes with Greek specialties",
        cuisine: "Mediterranean",
        location: "Downtown",
        address: "789 Olive St, Downtown",
        phone: "(555) 567-8901",
        email: "hello@greekgarden.com",
        website: "www.greekgarden.com",
        imageUrl: "https://images.unsplash.com/photo-1544124499-6dd74b256ef6?auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 167,
        priceRange: "€€",
        features: ["Greek Cuisine", "Fresh Ingredients", "Garden Seating"],
        isActive: true
      },
      {
        name: "Burger Haven",
        description: "Gourmet burgers and craft beer selection",
        cuisine: "American",
        location: "City Center",
        address: "890 Burger Blvd, City Center",
        phone: "(555) 678-9012",
        email: "info@burgerhaven.com",
        website: "www.burgerhaven.com",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 198,
        priceRange: "€€",
        features: ["Gourmet Burgers", "Craft Beer", "Casual Dining"],
        isActive: true
      },
      {
        name: "Ramen Temple",
        description: "Authentic Japanese ramen and traditional atmosphere",
        cuisine: "Asian",
        location: "Suburbs",
        address: "901 Ramen Row, Suburbs",
        phone: "(555) 789-0123",
        email: "konnichiwa@ramentemple.com",
        website: "www.ramentemple.com",
        imageUrl: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 134,
        priceRange: "€€",
        features: ["Authentic Ramen", "Japanese Atmosphere", "Counter Seating"],
        isActive: true
      },
      {
        name: "Tapas Barcelona",
        description: "Spanish tapas and sangria in a lively setting",
        cuisine: "Spanish",
        location: "Downtown",
        address: "123 Tapas Ave, Downtown",
        phone: "(555) 890-1234",
        email: "hola@tapasbarcelona.com",
        website: "www.tapasbarcelona.com",
        imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 176,
        priceRange: "€€",
        features: ["Spanish Tapas", "Sangria", "Live Flamenco"],
        isActive: true
      },
      {
        name: "BBQ Smokehouse",
        description: "Slow-smoked meats and Southern comfort food",
        cuisine: "American",
        location: "City Center",
        address: "234 Smoke St, City Center",
        phone: "(555) 901-2345",
        email: "info@bbqsmokehouse.com",
        website: "www.bbqsmokehouse.com",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&h=400",
        rating: "4.3",
        reviewCount: 145,
        priceRange: "€€",
        features: ["Smoked Meats", "Southern Food", "Family Style"],
        isActive: true
      },
      {
        name: "Croissant Corner",
        description: "French bakery with fresh pastries and coffee",
        cuisine: "French",
        location: "Suburbs",
        address: "345 Pastry Lane, Suburbs",
        phone: "(555) 012-3456",
        email: "bonjour@croissantcorner.com",
        website: "www.croissantcorner.com",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 92,
        priceRange: "€",
        features: ["Fresh Pastries", "French Coffee", "Bakery"],
        isActive: true
      },
      {
        name: "Curry Palace",
        description: "Traditional Indian curries and tandoor specialties",
        cuisine: "Asian",
        location: "Downtown",
        address: "456 Curry Court, Downtown",
        phone: "(555) 123-4567",
        email: "namaste@currypalace.com",
        website: "www.currypalace.com",
        imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 189,
        priceRange: "€€",
        features: ["Indian Curry", "Tandoor Oven", "Spice Market"],
        isActive: true
      },
      {
        name: "Fish Market",
        description: "Daily fresh catch and sustainable seafood",
        cuisine: "Mediterranean",
        location: "City Center",
        address: "567 Harbor Dr, City Center",
        phone: "(555) 234-5678",
        email: "catch@fishmarket.com",
        website: "www.fishmarket.com",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 212,
        priceRange: "€€€",
        features: ["Fresh Seafood", "Daily Catch", "Sustainable"],
        isActive: true
      },
      {
        name: "Vegan Vibes",
        description: "Plant-based cuisine with creative presentations",
        cuisine: "Healthy",
        location: "Suburbs",
        address: "678 Green Way, Suburbs",
        phone: "(555) 345-6789",
        email: "hello@veganvibes.com",
        website: "www.veganvibes.com",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 134,
        priceRange: "€€",
        features: ["Vegan Cuisine", "Organic", "Creative Plates"],
        isActive: true
      },
      {
        name: "Turkish Delight",
        description: "Authentic Turkish cuisine and Mediterranean flavors",
        cuisine: "Mediterranean",
        location: "Downtown",
        address: "789 Istanbul Ave, Downtown",
        phone: "(555) 456-7890",
        email: "merhaba@turkishdelight.com",
        website: "www.turkishdelight.com",
        imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 167,
        priceRange: "€€",
        features: ["Turkish Cuisine", "Mediterranean", "Hookah Lounge"],
        isActive: true
      },
      {
        name: "Sandwich Central",
        description: "Gourmet sandwiches and fresh salads",
        cuisine: "American",
        location: "City Center",
        address: "890 Sandwich St, City Center",
        phone: "(555) 567-8901",
        email: "info@sandwichcentral.com",
        website: "www.sandwichcentral.com",
        imageUrl: "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?auto=format&fit=crop&w=800&h=400",
        rating: "4.2",
        reviewCount: 156,
        priceRange: "€",
        features: ["Gourmet Sandwiches", "Fresh Salads", "Quick Service"],
        isActive: true
      },
      {
        name: "Gelato Dreams",
        description: "Artisanal Italian gelato and desserts",
        cuisine: "Italian",
        location: "Suburbs",
        address: "901 Gelato Grove, Suburbs",
        phone: "(555) 678-9012",
        email: "ciao@gelatodreams.com",
        website: "www.gelatodreams.com",
        imageUrl: "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 98,
        priceRange: "€",
        features: ["Artisan Gelato", "Italian Desserts", "Seasonal Flavors"],
        isActive: true
      },
      {
        name: "Pho Saigon",
        description: "Authentic Vietnamese pho and street food",
        cuisine: "Asian",
        location: "Downtown",
        address: "123 Pho Street, Downtown",
        phone: "(555) 789-0123",
        email: "xin@phosaigon.com",
        website: "www.phosaigon.com",
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 187,
        priceRange: "€",
        features: ["Authentic Pho", "Vietnamese Street Food", "Fresh Herbs"],
        isActive: true
      },
      {
        name: "Oktoberfest Hall",
        description: "German beer hall with traditional dishes",
        cuisine: "German",
        location: "City Center",
        address: "234 Beer Garden Blvd, City Center",
        phone: "(555) 890-1234",
        email: "guten@oktoberfesthall.com",
        website: "www.oktoberfesthall.com",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 201,
        priceRange: "€€",
        features: ["German Beer", "Traditional Food", "Beer Garden"],
        isActive: true
      },
      {
        name: "Soul Kitchen",
        description: "Southern soul food and comfort classics",
        cuisine: "American",
        location: "Suburbs",
        address: "345 Soul Ave, Suburbs",
        phone: "(555) 901-2345",
        email: "hello@soulkitchen.com",
        website: "www.soulkitchen.com",
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 123,
        priceRange: "€€",
        features: ["Soul Food", "Comfort Food", "Live Jazz"],
        isActive: true
      },
      {
        name: "Ethiopian Spice",
        description: "Traditional Ethiopian cuisine and injera bread",
        cuisine: "African",
        location: "Downtown",
        address: "456 Spice Route, Downtown",
        phone: "(555) 012-3456",
        email: "selam@ethiopianspice.com",
        website: "www.ethiopianspice.com",
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&h=400",
        rating: "4.3",
        reviewCount: 89,
        priceRange: "€€",
        features: ["Ethiopian Cuisine", "Injera Bread", "Coffee Ceremony"],
        isActive: true
      },
      {
        name: "Smoothie Paradise",
        description: "Fresh smoothies and healthy bowls",
        cuisine: "Healthy",
        location: "City Center",
        address: "567 Health St, City Center",
        phone: "(555) 123-4567",
        email: "fresh@smoothieparadise.com",
        website: "www.smoothieparadise.com",
        imageUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 156,
        priceRange: "€",
        features: ["Fresh Smoothies", "Healthy Bowls", "Organic"],
        isActive: true
      },
      {
        name: "Paella House",
        description: "Authentic Spanish paella and seafood",
        cuisine: "Spanish",
        location: "Suburbs",
        address: "678 Valencia Way, Suburbs",
        phone: "(555) 234-5678",
        email: "ole@paellahouse.com",
        website: "www.paellahouse.com",
        imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 178,
        priceRange: "€€€",
        features: ["Authentic Paella", "Spanish Seafood", "Wine Selection"],
        isActive: true
      },
      {
        name: "Dumpling Dynasty",
        description: "Handmade dumplings and Chinese comfort food",
        cuisine: "Asian",
        location: "Downtown",
        address: "789 Dumpling Dr, Downtown",
        phone: "(555) 345-6789",
        email: "ni@dumplingdynasty.com",
        website: "www.dumplingdynasty.com",
        imageUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 145,
        priceRange: "€",
        features: ["Handmade Dumplings", "Chinese Comfort", "Tea Selection"],
        isActive: true
      },
      {
        name: "Crepe Corner",
        description: "Sweet and savory French crepes",
        cuisine: "French",
        location: "City Center",
        address: "890 Crepe Circle, City Center",
        phone: "(555) 456-7890",
        email: "bonjour@crepecorner.com",
        website: "www.crepecorner.com",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 167,
        priceRange: "€€",
        features: ["French Crepes", "Sweet & Savory", "Outdoor Seating"],
        isActive: true
      },
      {
        name: "Hot Pot Heaven",
        description: "Interactive hot pot dining experience",
        cuisine: "Asian",
        location: "Suburbs",
        address: "901 Hot Pot Hill, Suburbs",
        phone: "(555) 567-8901",
        email: "hello@hotpotheaven.com",
        website: "www.hotpotheaven.com",
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 198,
        priceRange: "€€",
        features: ["Hot Pot", "Interactive Dining", "Fresh Ingredients"],
        isActive: true
      },
      {
        name: "Falafel Palace",
        description: "Middle Eastern cuisine and fresh falafel",
        cuisine: "Mediterranean",
        location: "Downtown",
        address: "123 Hummus Lane, Downtown",
        phone: "(555) 678-9012",
        email: "shalom@falafelpalace.com",
        website: "www.falafelpalace.com",
        imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&h=400",
        rating: "4.3",
        reviewCount: 134,
        priceRange: "€",
        features: ["Fresh Falafel", "Middle Eastern", "Healthy Options"],
        isActive: true
      },
      {
        name: "Wagyu Steakhouse",
        description: "Premium wagyu beef and fine dining",
        cuisine: "Japanese",
        location: "City Center",
        address: "234 Wagyu Way, City Center",
        phone: "(555) 789-0123",
        email: "konbanwa@wagyusteakhouse.com",
        website: "www.wagyusteakhouse.com",
        imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 89,
        priceRange: "€€€",
        features: ["Wagyu Beef", "Japanese Fine Dining", "Sake Bar"],
        isActive: true
      },
      {
        name: "Breakfast Bistro",
        description: "All-day breakfast and brunch favorites",
        cuisine: "American",
        location: "Suburbs",
        address: "345 Pancake Plaza, Suburbs",
        phone: "(555) 890-1234",
        email: "morning@breakfastbistro.com",
        website: "www.breakfastbistro.com",
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&h=400",
        rating: "4.2",
        reviewCount: 167,
        priceRange: "€€",
        features: ["All-Day Breakfast", "Brunch Menu", "Fresh Coffee"],
        isActive: true
      },
      {
        name: "Moroccan Nights",
        description: "Authentic Moroccan tagines and atmosphere",
        cuisine: "African",
        location: "Downtown",
        address: "456 Marrakech St, Downtown",
        phone: "(555) 901-2345",
        email: "salam@moroccannights.com",
        website: "www.moroccannights.com",
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 123,
        priceRange: "€€€",
        features: ["Moroccan Tagines", "Traditional Atmosphere", "Belly Dancing"],
        isActive: true
      },
      {
        name: "Oyster Bar",
        description: "Fresh oysters and raw bar specialties",
        cuisine: "Mediterranean",
        location: "City Center",
        address: "567 Pearl Place, City Center",
        phone: "(555) 012-3456",
        email: "fresh@oysterbar.com",
        website: "www.oysterbar.com",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 178,
        priceRange: "€€€",
        features: ["Fresh Oysters", "Raw Bar", "Champagne"],
        isActive: true
      },
      {
        name: "Korean BBQ House",
        description: "Interactive Korean barbecue experience",
        cuisine: "Asian",
        location: "Suburbs",
        address: "678 Seoul Street, Suburbs",
        phone: "(555) 123-4567",
        email: "annyeong@koreanbbqhouse.com",
        website: "www.koreanbbqhouse.com",
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 201,
        priceRange: "€€",
        features: ["Korean BBQ", "Interactive Grilling", "Kimchi Bar"],
        isActive: true
      },
      {
        name: "Artisan Bakery",
        description: "Handcrafted breads and pastries daily",
        cuisine: "French",
        location: "Downtown",
        address: "789 Artisan Ave, Downtown",
        phone: "(555) 234-5678",
        email: "baker@artisanbakery.com",
        website: "www.artisanbakery.com",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 145,
        priceRange: "€",
        features: ["Artisan Bread", "Daily Fresh", "Traditional Methods"],
        isActive: true
      },
      {
        name: "Grill Master",
        description: "Wood-fired grilling and smoky flavors",
        cuisine: "American",
        location: "City Center",
        address: "890 Grill Grove, City Center",
        phone: "(555) 345-6789",
        email: "fire@grillmaster.com",
        website: "www.grillmaster.com",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 189,
        priceRange: "€€",
        features: ["Wood-Fired Grill", "Smoky Flavors", "Craft Cocktails"],
        isActive: true
      },
      {
        name: "Salad Station",
        description: "Fresh salads and healthy meal options",
        cuisine: "Healthy",
        location: "Suburbs",
        address: "901 Green Garden, Suburbs",
        phone: "(555) 456-7890",
        email: "fresh@saladstation.com",
        website: "www.saladstation.com",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&h=400",
        rating: "4.3",
        reviewCount: 167,
        priceRange: "€€",
        features: ["Fresh Salads", "Healthy Options", "Custom Bowls"],
        isActive: true
      },
      {
        name: "Spaghetti Junction",
        description: "Traditional Italian pasta house",
        cuisine: "Italian",
        location: "Downtown",
        address: "123 Pasta Place, Downtown",
        phone: "(555) 567-8901",
        email: "ciao@spaghettijunction.com",
        website: "www.spaghettijunction.com",
        imageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 198,
        priceRange: "€€",
        features: ["Traditional Pasta", "Italian Recipes", "Wine Pairing"],
        isActive: true
      },
      {
        name: "Fish & Chips Shop",
        description: "Classic British fish and chips",
        cuisine: "British",
        location: "City Center",
        address: "234 London Lane, City Center",
        phone: "(555) 678-9012",
        email: "cheerio@fishandchips.com",
        website: "www.fishandchips.com",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&h=400",
        rating: "4.2",
        reviewCount: 134,
        priceRange: "€",
        features: ["Classic Fish & Chips", "British Pub", "Mushy Peas"],
        isActive: true
      },
      {
        name: "Wok This Way",
        description: "Fast Asian stir-fry and noodle dishes",
        cuisine: "Asian",
        location: "Suburbs",
        address: "345 Wok Way, Suburbs",
        phone: "(555) 789-0123",
        email: "hello@wokthisway.com",
        website: "www.wokthisway.com",
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&h=400",
        rating: "4.1",
        reviewCount: 156,
        priceRange: "€",
        features: ["Fast Stir-Fry", "Asian Fusion", "Quick Service"],
        isActive: true
      },
      {
        name: "Cheese Please",
        description: "Artisanal cheese platters and wine pairings",
        cuisine: "French",
        location: "Downtown",
        address: "456 Fromage St, Downtown",
        phone: "(555) 890-1234",
        email: "oui@cheeseplease.com",
        website: "www.cheeseplease.com",
        imageUrl: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 89,
        priceRange: "€€€",
        features: ["Artisan Cheese", "Wine Pairings", "Cheese Education"],
        isActive: true
      },
      {
        name: "Donut Dreams",
        description: "Handmade donuts and coffee shop",
        cuisine: "American",
        location: "City Center",
        address: "567 Donut Dr, City Center",
        phone: "(555) 901-2345",
        email: "sweet@donutdreams.com",
        website: "www.donutdreams.com",
        imageUrl: "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 123,
        priceRange: "€",
        features: ["Handmade Donuts", "Fresh Coffee", "Sweet Treats"],
        isActive: true
      },
      {
        name: "Himalayan Kitchen",
        description: "Nepalese and Tibetan mountain cuisine",
        cuisine: "Asian",
        location: "Suburbs",
        address: "678 Mountain View, Suburbs",
        phone: "(555) 012-3456",
        email: "namaste@himalayankitchen.com",
        website: "www.himalayankitchen.com",
        imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 167,
        priceRange: "€€",
        features: ["Nepalese Cuisine", "Mountain Spices", "Yak Dishes"],
        isActive: true
      }
    ];

    restaurantData.forEach(data => {
      const restaurant: Restaurant = {
        ...data,
        id: this.currentRestaurantId++,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        imageUrl: data.imageUrl || null,
        features: data.features || null,
        rating: data.rating || null,
        reviewCount: data.reviewCount || null,
        isActive: data.isActive ?? null,
        isPopular: data.isPopular || false,
        isApproved: true
      };
      this.restaurants.set(restaurant.id, restaurant);
    });

    // Seed voucher packages with more diverse options
    const packageData: InsertVoucherPackage[] = [
      // Bella Vista packages - Flexible options from small to large
      { restaurantId: 1, name: "Taste Test", description: "Try our signature dishes", mealCount: 3, pricePerMeal: "32.00", discountPercentage: "10.00", validityMonths: 6, isActive: true },
      { restaurantId: 1, name: "Monthly Special", description: "Perfect for regular visits", mealCount: 8, pricePerMeal: "32.00", discountPercentage: "15.00", validityMonths: 12, isActive: true },
      { restaurantId: 1, name: "Family Package", description: "Great for family dinners", mealCount: 15, pricePerMeal: "32.00", discountPercentage: "20.00", validityMonths: 12, isActive: true },
      { restaurantId: 1, name: "VIP Experience", description: "Ultimate dining package", mealCount: 30, pricePerMeal: "32.00", discountPercentage: "25.00", validityMonths: 18, isActive: true },
      
      // Sakura Sushi packages - Premium pricing with varying discounts
      { restaurantId: 2, name: "Sushi Sampler", description: "Discover our chef's selection", mealCount: 4, pricePerMeal: "45.00", discountPercentage: "8.00", validityMonths: 9, isActive: true },
      { restaurantId: 2, name: "Sushi Enthusiast", description: "For serious sushi lovers", mealCount: 12, pricePerMeal: "45.00", discountPercentage: "15.00", validityMonths: 12, isActive: true },
      { restaurantId: 2, name: "Omakase Package", description: "Premium chef's choice experience", mealCount: 20, pricePerMeal: "65.00", discountPercentage: "18.00", validityMonths: 15, isActive: true },
      
      // Le Petit Bistro packages - French cuisine with generous discounts
      { restaurantId: 3, name: "Petit Dejeuner", description: "Start your French journey", mealCount: 5, pricePerMeal: "28.00", discountPercentage: "12.00", validityMonths: 8, isActive: true },
      { restaurantId: 3, name: "Bon Appetit", description: "Classic French dining", mealCount: 12, pricePerMeal: "28.00", discountPercentage: "22.00", validityMonths: 12, isActive: true },
      { restaurantId: 3, name: "Gourmand Special", description: "For the true French food connoisseur", mealCount: 25, pricePerMeal: "28.00", discountPercentage: "28.00", validityMonths: 18, isActive: true },
      
      // Mediterranean Breeze packages - Healthy options with competitive pricing
      { restaurantId: 4, name: "Fresh Start", description: "Healthy Mediterranean meals", mealCount: 6, pricePerMeal: "35.00", discountPercentage: "14.00", validityMonths: 10, isActive: true },
      { restaurantId: 4, name: "Mediterranean Journey", description: "Explore our full menu", mealCount: 18, pricePerMeal: "35.00", discountPercentage: "20.00", validityMonths: 14, isActive: true },
      { restaurantId: 4, name: "Wellness Package", description: "Complete healthy dining experience", mealCount: 40, pricePerMeal: "35.00", discountPercentage: "30.00", validityMonths: 24, isActive: true },
      
      // Dragon Palace packages - Chinese cuisine with variety
      { restaurantId: 5, name: "Dragon Starter", description: "Traditional Chinese flavors", mealCount: 5, pricePerMeal: "28.00", discountPercentage: "12.00", validityMonths: 8, isActive: true },
      { restaurantId: 5, name: "Dim Sum Delight", description: "Perfect for sharing", mealCount: 12, pricePerMeal: "28.00", discountPercentage: "18.00", validityMonths: 12, isActive: true },
      { restaurantId: 5, name: "Imperial Feast", description: "Full Chinese dining experience", mealCount: 24, pricePerMeal: "28.00", discountPercentage: "25.00", validityMonths: 15, isActive: true },
      
      // Pizzeria Roma packages - Budget-friendly family options
      { restaurantId: 6, name: "Pizza Night", description: "Family pizza nights", mealCount: 4, pricePerMeal: "18.00", discountPercentage: "15.00", validityMonths: 6, isActive: true },
      { restaurantId: 6, name: "Weekly Special", description: "Regular pizza lovers", mealCount: 10, pricePerMeal: "18.00", discountPercentage: "22.00", validityMonths: 10, isActive: true },
      { restaurantId: 6, name: "Family Feast", description: "Large family gatherings", mealCount: 20, pricePerMeal: "18.00", discountPercentage: "28.00", validityMonths: 12, isActive: true },
      
      // Spice Garden packages - Indian cuisine with value
      { restaurantId: 7, name: "Spice Discovery", description: "Explore Indian flavors", mealCount: 6, pricePerMeal: "26.00", discountPercentage: "14.00", validityMonths: 9, isActive: true },
      { restaurantId: 7, name: "Curry Lover", description: "For spice enthusiasts", mealCount: 15, pricePerMeal: "26.00", discountPercentage: "20.00", validityMonths: 12, isActive: true },
      { restaurantId: 7, name: "Maharaja Package", description: "Royal Indian dining", mealCount: 30, pricePerMeal: "26.00", discountPercentage: "26.00", validityMonths: 18, isActive: true },
      
      // Coastal Catch packages - Premium seafood
      { restaurantId: 8, name: "Ocean Taste", description: "Fresh seafood selection", mealCount: 4, pricePerMeal: "52.00", discountPercentage: "10.00", validityMonths: 8, isActive: true },
      { restaurantId: 8, name: "Fisherman's Choice", description: "Best of the sea", mealCount: 10, pricePerMeal: "52.00", discountPercentage: "16.00", validityMonths: 12, isActive: true },
      { restaurantId: 8, name: "Maritime Luxury", description: "Premium seafood experience", mealCount: 20, pricePerMeal: "52.00", discountPercentage: "22.00", validityMonths: 15, isActive: true },
      
      // Café Lumière packages - Casual French café
      { restaurantId: 9, name: "Morning Bliss", description: "Perfect breakfast package", mealCount: 8, pricePerMeal: "15.00", discountPercentage: "18.00", validityMonths: 6, isActive: true },
      { restaurantId: 9, name: "Café Regular", description: "Daily café visits", mealCount: 20, pricePerMeal: "15.00", discountPercentage: "25.00", validityMonths: 10, isActive: true },
      { restaurantId: 9, name: "French Indulgence", description: "Complete café experience", mealCount: 35, pricePerMeal: "15.00", discountPercentage: "32.00", validityMonths: 12, isActive: true },
      
      // Bamboo House packages - Asian fusion
      { restaurantId: 10, name: "Fusion First", description: "Modern Asian flavors", mealCount: 5, pricePerMeal: "34.00", discountPercentage: "13.00", validityMonths: 8, isActive: true },
      { restaurantId: 10, name: "Bamboo Experience", description: "Complete fusion dining", mealCount: 14, pricePerMeal: "34.00", discountPercentage: "19.00", validityMonths: 12, isActive: true },
      { restaurantId: 10, name: "Innovation Package", description: "Creative culinary journey", mealCount: 25, pricePerMeal: "34.00", discountPercentage: "24.00", validityMonths: 16, isActive: true },
      
      // Villa Toscana packages - Elegant Italian
      { restaurantId: 11, name: "Tuscan Taste", description: "Authentic Tuscan cuisine", mealCount: 4, pricePerMeal: "48.00", discountPercentage: "12.00", validityMonths: 9, isActive: true },
      { restaurantId: 11, name: "Villa Experience", description: "Elegant Italian dining", mealCount: 12, pricePerMeal: "48.00", discountPercentage: "18.00", validityMonths: 12, isActive: true },
      { restaurantId: 11, name: "Toscana Elite", description: "Premium Italian experience", mealCount: 22, pricePerMeal: "48.00", discountPercentage: "23.00", validityMonths: 18, isActive: true }
    ];

    packageData.forEach(data => {
      const pkg: VoucherPackage = {
        ...data,
        id: this.currentPackageId++,
        createdAt: new Date(),
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive ?? null,
        validityMonths: data.validityMonths || null
      };
      this.voucherPackages.set(pkg.id, pkg);
    });

    // Seed a demo customer with enhanced profile and hashed password
    // Pre-computed bcrypt hash for 'DemoPassword123!' with salt rounds 10
    const hashedPassword = '$2b$10$QgLOwSB7TjMx640H0Kguu.WAMrNr32Z0xgMfY0HHn0bzJIy/Fwfbi';
    
    const customer: Customer = {
      id: this.currentCustomerId++,
      email: "demo@example.com",
      name: "John Doe",
      phone: "(555) 123-4567",
      passwordHash: hashedPassword,
      profilePicture: null,
      balance: "245.50",
      loyaltyPoints: 500,
      totalPointsEarned: 500,
      membershipTier: "gold",
      age: 32,
      weight: "75.5",
      height: 180,
      activityLevel: "moderately_active",
      healthGoal: "weight_loss",
      dietaryPreferences: ["vegetarian", "low_carb"],
      allergies: ["nuts", "dairy"],
      dislikes: ["spicy_food"],
      healthConditions: [],
      createdAt: new Date(),
      customerCode: "CLI-DEMO01",
      customerQrCode: null,
      isProfileComplete: true
    };
    this.customers.set(customer.id, customer);

    // Seed sample menu items for each restaurant (using correct restaurant IDs 1-4)
    const sampleMenuItems = [
      // Bella Vista (Italian) - Restaurant ID 1
      { restaurantId: 1, name: "Margherita Pizza", description: "Fresh tomato sauce, mozzarella, basil", category: "mains", price: "14.50", ingredients: ["tomato", "mozzarella", "basil"], spiceLevel: 0, calories: 280, preparationTime: 15, isPopular: true },
      { restaurantId: 1, name: "Caesar Salad", description: "Romaine lettuce, parmesan, croutons, caesar dressing", category: "appetizers", price: "9.75", ingredients: ["romaine", "parmesan", "croutons"], spiceLevel: 0, calories: 190, preparationTime: 10, isPopular: false },
      { restaurantId: 1, name: "Tiramisu", description: "Classic Italian dessert with mascarpone and coffee", category: "desserts", price: "7.25", ingredients: ["mascarpone", "coffee", "ladyfingers"], spiceLevel: 0, calories: 350, preparationTime: 5, isPopular: true },
      { restaurantId: 1, name: "Bruschetta", description: "Grilled bread with tomatoes, garlic, and basil", category: "appetizers", price: "8.25", ingredients: ["bread", "tomatoes", "garlic", "basil"], spiceLevel: 0, calories: 150, preparationTime: 8, isPopular: true },
      
      // Sakura Sushi - Restaurant ID 2
      { restaurantId: 2, name: "Salmon Roll", description: "Fresh salmon with avocado and cucumber", category: "sushi", price: "12.50", ingredients: ["salmon", "avocado", "cucumber", "rice"], spiceLevel: 0, calories: 220, preparationTime: 10, isPopular: true },
      { restaurantId: 2, name: "Miso Soup", description: "Traditional Japanese soup with tofu and seaweed", category: "appetizers", price: "6.75", ingredients: ["miso", "tofu", "seaweed"], spiceLevel: 0, calories: 80, preparationTime: 5, isPopular: false },
      { restaurantId: 2, name: "Tempura Prawns", description: "Crispy fried prawns with dipping sauce", category: "mains", price: "18.50", ingredients: ["prawns", "tempura batter"], spiceLevel: 0, calories: 340, preparationTime: 12, isPopular: true },
      { restaurantId: 2, name: "Green Tea Ice Cream", description: "Traditional matcha flavored ice cream", category: "desserts", price: "5.75", ingredients: ["matcha", "cream"], spiceLevel: 0, calories: 180, preparationTime: 2, isPopular: false },
      
      // Le Petit Bistro (French) - Restaurant ID 3
      { restaurantId: 3, name: "Coq au Vin", description: "Classic French chicken braised in red wine", category: "mains", price: "24.00", ingredients: ["chicken", "red wine", "mushrooms"], spiceLevel: 0, calories: 420, preparationTime: 25, isPopular: true },
      { restaurantId: 3, name: "French Onion Soup", description: "Rich broth with caramelized onions and gruyere", category: "appetizers", price: "11.50", ingredients: ["onions", "broth", "gruyere"], spiceLevel: 0, calories: 250, preparationTime: 18, isPopular: false },
      { restaurantId: 3, name: "Beef Bourguignon", description: "Tender beef slow-cooked in burgundy wine", category: "mains", price: "26.50", ingredients: ["beef", "wine", "vegetables"], spiceLevel: 0, calories: 480, preparationTime: 30, isPopular: true },
      { restaurantId: 3, name: "Crème Brûlée", description: "Vanilla custard with caramelized sugar", category: "desserts", price: "9.75", ingredients: ["cream", "vanilla", "sugar"], spiceLevel: 0, calories: 380, preparationTime: 5, isPopular: true },
      
      // Green Garden (Vegetarian) - Restaurant ID 4
      { restaurantId: 4, name: "Quinoa Buddha Bowl", description: "Nutritious bowl with quinoa, vegetables and tahini", category: "mains", price: "13.75", ingredients: ["quinoa", "vegetables", "tahini"], spiceLevel: 0, calories: 320, preparationTime: 15, isPopular: true },
      { restaurantId: 4, name: "Avocado Toast", description: "Sourdough bread with smashed avocado and seeds", category: "appetizers", price: "8.50", ingredients: ["sourdough", "avocado", "seeds"], spiceLevel: 0, calories: 280, preparationTime: 8, isPopular: true },
      { restaurantId: 4, name: "Lentil Curry", description: "Spiced red lentils with coconut milk and rice", category: "mains", price: "14.25", ingredients: ["lentils", "coconut milk", "spices", "rice"], spiceLevel: 2, calories: 380, preparationTime: 20, isPopular: false },
      { restaurantId: 4, name: "Chia Pudding", description: "Coconut chia pudding with fresh berries", category: "desserts", price: "6.75", ingredients: ["chia seeds", "coconut milk", "berries"], spiceLevel: 0, calories: 200, preparationTime: 5, isPopular: true },
    ];

    sampleMenuItems.forEach(item => {
      const menuItem: MenuItem = {
        id: this.currentMenuItemId++,
        name: item.name,
        createdAt: new Date(),
        description: item.description || null,
        imageUrl: null,
        category: item.category,
        restaurantId: item.restaurantId,
        price: item.price,
        ingredients: item.ingredients || null,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isSpicy: item.spiceLevel > 0,
        isAvailable: true,
        isPopular: item.isPopular || null
      };
      this.menuItems.set(menuItem.id, menuItem);
    });

    // Seed EatOff vouchers including Pay Later options
    const sampleEatoffVouchers = [
      {
        name: "EatOff Premium 50€",
        description: "Premium dining voucher with 15% discount",
        discountPercentage: "15.00",
        validityMonths: 12,
        validityStartDate: new Date(),
        validityEndDate: new Date(Date.now() + (12 * 30 * 24 * 60 * 60 * 1000)),
        validityType: "months",
        totalValue: "50.00",
        isActive: true,
        voucherType: "immediate",
        bonusPercentage: "0.00",
        paymentTermDays: 0,
        requiresPreauth: false,
        brandColor: "#FF6B35"
      },
      {
        name: "Pay Later 30 Days - 100€",
        description: "Pay in 30 days with 5% price increase",
        discountPercentage: "10.00",
        validityMonths: 12,
        validityStartDate: new Date(),
        validityEndDate: new Date(Date.now() + (12 * 30 * 24 * 60 * 60 * 1000)),
        validityType: "months",
        totalValue: "100.00",
        isActive: true,
        voucherType: "pay_later",
        bonusPercentage: "5.00",
        paymentTermDays: 30,
        requiresPreauth: true,
        brandColor: "#FF6B35"
      },
      {
        name: "Pay Later 60 Days - 200€",
        description: "Pay in 60 days with 8% price increase",
        discountPercentage: "20.00",
        validityMonths: 18,
        validityStartDate: new Date(),
        validityEndDate: new Date(Date.now() + (18 * 30 * 24 * 60 * 60 * 1000)),
        validityType: "months",
        totalValue: "200.00",
        isActive: true,
        voucherType: "pay_later",
        bonusPercentage: "8.00",
        paymentTermDays: 60,
        requiresPreauth: true,
        brandColor: "#FF6B35"
      }
    ];

    sampleEatoffVouchers.forEach(voucherData => {
      const voucher: EatoffVoucher = {
        ...voucherData,
        id: this.currentEatoffVoucherId++,
        imageUrl: null,
        mealCount: null,
        pricePerMeal: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.eatoffVouchers.set(voucher.id, voucher);
    });
  }

  // Restaurant Owner operations
  async getRestaurantOwnerByEmail(email: string): Promise<RestaurantOwner | undefined> {
    return Array.from(this.restaurantOwners.values()).find(owner => owner.email === email);
  }

  async getRestaurantOwnerById(id: number): Promise<RestaurantOwner | undefined> {
    return this.restaurantOwners.get(id);
  }

  async getRestaurantOwnersByCompany(companyName: string): Promise<RestaurantOwner[]> {
    return Array.from(this.restaurantOwners.values()).filter(owner => owner.companyName === companyName);
  }

  async createRestaurantOwner(owner: InsertRestaurantOwner & { passwordHash: string }): Promise<RestaurantOwner> {
    const { password, ...ownerData } = owner;
    const newOwner: RestaurantOwner = {
      id: this.currentOwnerId++,
      ...ownerData,
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.restaurantOwners.set(newOwner.id, newOwner);
    return newOwner;
  }

  async updateRestaurantOwner(id: number, updates: Partial<RestaurantOwner>): Promise<RestaurantOwner | undefined> {
    const owner = this.restaurantOwners.get(id);
    if (!owner) return undefined;

    const updatedOwner = { ...owner, ...updates, updatedAt: new Date() };
    this.restaurantOwners.set(id, updatedOwner);
    return updatedOwner;
  }

  async deleteRestaurantOwner(id: number): Promise<boolean> {
    // First check if this owner has any restaurants
    const ownerRestaurants = await this.getRestaurantsByOwner(id);
    if (ownerRestaurants.length > 0) {
      throw new Error(`Cannot delete owner: still owns ${ownerRestaurants.length} restaurant(s). Please transfer or delete restaurants first.`);
    }
    
    return this.restaurantOwners.delete(id);
  }

  async getRestaurantOwnerUsers(ownerId: number): Promise<RestaurantOwner[]> {
    // For MemStorage, we'll return all restaurant owners since there's no company hierarchy concept
    // In a real implementation, this would filter by company or parent owner
    return Array.from(this.restaurantOwners.values()).filter(owner => owner.id !== ownerId);
  }

  async getRestaurantsByOwner(ownerId: number): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(restaurant => restaurant.ownerId === ownerId);
  }

  // Voucher Template operations
  async getVoucherTemplates(): Promise<VoucherTemplate[]> {
    return Array.from(this.voucherTemplates.values());
  }

  async getVoucherTemplateById(id: number): Promise<VoucherTemplate | undefined> {
    return this.voucherTemplates.get(id);
  }

  async getVoucherTemplatesByCategory(category: string): Promise<VoucherTemplate[]> {
    return Array.from(this.voucherTemplates.values()).filter(template => template.category === category);
  }

  async getRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(r => r.isActive);
  }

  async getRestaurantById(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurantsByFilters(filters: {
    location?: string;
    cuisine?: string;
    priceRange?: string;
    minDiscount?: number;
  }): Promise<Restaurant[]> {
    console.log('Storage filters received:', filters);
    let restaurants = Array.from(this.restaurants.values()).filter(r => r.isActive);
    console.log(`Starting with ${restaurants.length} active restaurants`);

    if (filters.location && filters.location !== "All Locations") {
      console.log(`Filtering by location: ${filters.location}`);
      restaurants = restaurants.filter(r => r.location === filters.location);
      console.log(`After location filter: ${restaurants.length} restaurants`);
    }

    if (filters.cuisine) {
      console.log(`Filtering by cuisine: ${filters.cuisine}`);
      console.log('Available cuisines:', [...new Set(Array.from(this.restaurants.values()).map(r => r.cuisine))]);
      restaurants = restaurants.filter(r => r.cuisine === filters.cuisine);
      console.log(`After cuisine filter: ${restaurants.length} restaurants`);
    }

    if (filters.priceRange) {
      console.log(`Filtering by price range: ${filters.priceRange}`);
      restaurants = restaurants.filter(r => r.priceRange === filters.priceRange);
      console.log(`After price range filter: ${restaurants.length} restaurants`);
    }

    if (filters.minDiscount !== undefined) {
      console.log(`Filtering by minimum discount: ${filters.minDiscount}`);
      const restaurantIds = restaurants.map(r => r.id);
      const packages = Array.from(this.voucherPackages.values())
        .filter(p => restaurantIds.includes(p.restaurantId) && parseFloat(p.discountPercentage) >= filters.minDiscount!);
      
      const validRestaurantIds = Array.from(new Set(packages.map(p => p.restaurantId)));
      restaurants = restaurants.filter(r => validRestaurantIds.includes(r.id));
      console.log(`After discount filter: ${restaurants.length} restaurants`);
    }

    console.log('Final filtered restaurants:', restaurants.map(r => ({ id: r.id, name: r.name, cuisine: r.cuisine })));
    return restaurants;
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const newRestaurant: Restaurant = {
      ...restaurant,
      id: this.currentRestaurantId++,
      createdAt: new Date()
    };
    this.restaurants.set(newRestaurant.id, newRestaurant);
    return newRestaurant;
  }

  async updateRestaurant(id: number, updates: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;

    const updated = { ...restaurant, ...updates };
    this.restaurants.set(id, updated);
    return updated;
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    return this.restaurants.delete(id);
  }

  async getPackagesByRestaurant(restaurantId: number): Promise<VoucherPackage[]> {
    return Array.from(this.voucherPackages.values())
      .filter(p => p.restaurantId === restaurantId && p.isActive)
      .sort((a, b) => b.id - a.id);
  }

  async getAllActivePackages(): Promise<VoucherPackage[]> {
    return Array.from(this.voucherPackages.values())
      .filter(p => p.isActive)
      .sort((a, b) => b.id - a.id);
  }

  async getPackageById(id: number): Promise<VoucherPackage | undefined> {
    return this.voucherPackages.get(id);
  }

  async createPackage(packageData: InsertVoucherPackage): Promise<VoucherPackage> {
    const newPackage: VoucherPackage = {
      ...packageData,
      id: this.currentPackageId++,
      createdAt: new Date()
    };
    this.voucherPackages.set(newPackage.id, newPackage);
    return newPackage;
  }

  async updatePackage(id: number, packageData: Partial<InsertVoucherPackage>): Promise<VoucherPackage | undefined> {
    const pkg = this.voucherPackages.get(id);
    if (!pkg) return undefined;

    const updated = { ...pkg, ...packageData };
    this.voucherPackages.set(id, updated);
    return updated;
  }

  async deletePackage(id: number): Promise<boolean> {
    return this.voucherPackages.delete(id);
  }

  // EatOff voucher operations
  async getEatoffVouchers(): Promise<EatoffVoucher[]> {
    return Array.from(this.eatoffVouchers.values()).sort((a, b) => b.id - a.id);
  }

  async getEatoffVoucherById(id: number): Promise<EatoffVoucher | undefined> {
    return this.eatoffVouchers.get(id);
  }

  async createEatoffVoucher(voucherData: InsertEatoffVoucher): Promise<EatoffVoucher> {
    const newVoucher: EatoffVoucher = {
      ...voucherData,
      id: this.currentEatoffVoucherId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.eatoffVouchers.set(newVoucher.id, newVoucher);
    return newVoucher;
  }

  async updateEatoffVoucher(id: number, voucherData: Partial<InsertEatoffVoucher>): Promise<EatoffVoucher | undefined> {
    const voucher = this.eatoffVouchers.get(id);
    if (!voucher) return undefined;

    const updated = { ...voucher, ...voucherData, updatedAt: new Date() };
    this.eatoffVouchers.set(id, updated);
    return updated;
  }

  async deleteEatoffVoucher(id: number): Promise<boolean> {
    return this.eatoffVouchers.delete(id);
  }

  // Deferred payment operations
  async createDeferredPayment(paymentData: any): Promise<any> {
    const newPayment = {
      ...paymentData,
      id: this.currentDeferredPaymentId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.deferredPayments.set(newPayment.id, newPayment);
    return newPayment;
  }

  async getDeferredPaymentsByCustomer(customerId: string): Promise<any[]> {
    return Array.from(this.deferredPayments.values())
      .filter(payment => payment.customerId === customerId);
  }

  async getPendingDeferredPayments(): Promise<any[]> {
    return Array.from(this.deferredPayments.values())
      .filter(payment => payment.status === 'pending' && new Date(payment.scheduledChargeDate) <= new Date());
  }

  async updateDeferredPaymentStatus(id: number, status: string, chargedAt?: Date): Promise<any> {
    const payment = this.deferredPayments.get(id);
    if (!payment) return undefined;

    const updated = {
      ...payment,
      status,
      chargedAt: chargedAt || null,
      updatedAt: new Date()
    };
    this.deferredPayments.set(id, updated);
    return updated;
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.email === email);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  // Removed duplicate in-memory method - using database version below

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: this.currentCustomerId++,
      phone: customer.phone || null,
      balance: customer.balance || null,
      age: customer.age || null,
      weight: customer.weight || null,
      height: customer.height || null,
      activityLevel: customer.activityLevel || null,
      healthGoal: customer.healthGoal || null,
      dietaryPreferences: customer.dietaryPreferences || null,
      allergies: customer.allergies || null,
      dislikes: customer.dislikes || null,
      healthConditions: customer.healthConditions || null,
      createdAt: new Date()
    };
    this.customers.set(newCustomer.id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updated: Customer = { 
      ...customer, 
      ...updates,
      phone: updates.phone !== undefined ? updates.phone : customer.phone,
      balance: updates.balance !== undefined ? updates.balance : customer.balance,
      age: updates.age !== undefined ? updates.age : customer.age,
      weight: updates.weight !== undefined ? updates.weight : customer.weight,
      height: updates.height !== undefined ? updates.height : customer.height,
      activityLevel: updates.activityLevel !== undefined ? updates.activityLevel : customer.activityLevel,
      healthGoal: updates.healthGoal !== undefined ? updates.healthGoal : customer.healthGoal,
      dietaryPreferences: updates.dietaryPreferences !== undefined ? updates.dietaryPreferences : customer.dietaryPreferences,
      allergies: updates.allergies !== undefined ? updates.allergies : customer.allergies,
      dislikes: updates.dislikes !== undefined ? updates.dislikes : customer.dislikes,
      healthConditions: updates.healthConditions !== undefined ? updates.healthConditions : customer.healthConditions
    };
    this.customers.set(id, updated);
    return updated;
  }

  async getPurchasedVouchersByCustomer(customerId: number): Promise<PurchasedVoucher[]> {
    return Array.from(this.purchasedVouchers.values())
      .filter(v => v.customerId === customerId);
  }

  async getPurchasedVouchersWithRestaurantDetails(customerId: number): Promise<(PurchasedVoucher & { restaurant: { name: string; imageUrl: string | null; cuisine: string; address: string; rating: string | null; googleRating: string | null; googleReviewCount: number | null; reviewCount: number | null; } })[]> {
    const vouchers = Array.from(this.purchasedVouchers.values())
      .filter(v => v.customerId === customerId);
    
    return vouchers.map(voucher => {
      const restaurant = this.restaurants.get(voucher.restaurantId);
      return {
        ...voucher,
        restaurant: {
          name: restaurant?.name || 'Unknown',
          imageUrl: restaurant?.imageUrl || null,
          cuisine: restaurant?.cuisine || '',
          address: restaurant?.address || '',
          rating: restaurant?.rating || null,
          googleRating: restaurant?.googleRating || null,
          googleReviewCount: restaurant?.googleReviewCount || null,
          reviewCount: restaurant?.reviewCount || null,
        }
      };
    });
  }

  async getPurchasedVoucherById(id: number): Promise<PurchasedVoucher | undefined> {
    return this.purchasedVouchers.get(id);
  }

  async createPurchasedVoucher(voucher: InsertPurchasedVoucher): Promise<PurchasedVoucher> {
    const newVoucher: PurchasedVoucher = {
      ...voucher,
      id: this.currentVoucherId++,
      purchaseDate: new Date(),
      expiryDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year from now
      qrCode: `QR-${this.currentVoucherId}`,
      usedMeals: voucher.usedMeals ?? 0,
      status: "active"
    };
    this.purchasedVouchers.set(newVoucher.id, newVoucher);
    return newVoucher;
  }

  async updateVoucherUsage(id: number, usedMeals: number): Promise<PurchasedVoucher | undefined> {
    const voucher = this.purchasedVouchers.get(id);
    if (!voucher) return undefined;

    const status = usedMeals >= voucher.totalMeals ? "fully_used" : voucher.status;
    const updated = { ...voucher, usedMeals, status };
    this.purchasedVouchers.set(id, updated);
    return updated;
  }

  async getRedemptionsByVoucher(voucherId: number): Promise<VoucherRedemption[]> {
    return Array.from(this.voucherRedemptions.values())
      .filter(r => r.voucherId === voucherId);
  }

  async createRedemption(redemption: InsertVoucherRedemption): Promise<VoucherRedemption> {
    const newRedemption: VoucherRedemption = {
      ...redemption,
      id: this.currentRedemptionId++,
      redemptionDate: new Date()
    };
    this.voucherRedemptions.set(newRedemption.id, newRedemption);
    return newRedemption;
  }

  async getMenuItemsByRestaurant(restaurantId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => item.restaurantId === restaurantId && item.isAvailable)
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const newMenuItem: MenuItem = {
      ...menuItem,
      id: this.currentMenuItemId++,
      createdAt: new Date()
    };
    this.menuItems.set(newMenuItem.id, newMenuItem);
    return newMenuItem;
  }

  async updateMenuItem(id: number, updates: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) return undefined;

    const updated = { ...menuItem, ...updates };
    this.menuItems.set(id, updated);
    return updated;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  async getRestaurantAnalytics(restaurantId: number): Promise<{
    totalSales: number;
    vouchersSold: number;
    totalRedemptions: number;
    averagePackageSize: number;
  }> {
    const vouchers = Array.from(this.purchasedVouchers.values())
      .filter(v => v.restaurantId === restaurantId);
    
    const redemptions = Array.from(this.voucherRedemptions.values())
      .filter(r => r.restaurantId === restaurantId);
    
    return {
      totalSales: vouchers.reduce((sum, v) => sum + parseFloat(v.purchasePrice), 0),
      vouchersSold: vouchers.length,
      totalRedemptions: redemptions.length,
      averagePackageSize: vouchers.length > 0 ? 
        vouchers.reduce((sum, v) => sum + v.totalMeals, 0) / vouchers.length : 0
    };
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: this.currentOrderId++,
      createdAt: new Date()
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const newOrderItem: OrderItem = {
      ...orderItem,
      id: this.currentOrderItemId++
    };
    this.orderItems.set(newOrderItem.id, newOrderItem);
    return newOrderItem;
  }

  async createOrderWithItems(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const newOrder = await this.createOrder(order);
    
    for (const item of items) {
      await this.createOrderItem({
        ...item,
        orderId: newOrder.id
      });
    }
    
    return newOrder;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(order => order.orderNumber === orderNumber);
  }

  async getOrdersByRestaurant(restaurantId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.restaurantId === restaurantId);
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.customerId === customerId);
  }

  async updateOrderStatus(id: number, status: string, restaurantNotes?: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  async getOrderWithDetails(id: number): Promise<(Order & { restaurant: Restaurant; items: (OrderItem & { menuItem: MenuItem })[] }) | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const restaurant = this.restaurants.get(order.restaurantId);
    if (!restaurant) return undefined;

    const orderItemsRaw = Array.from(this.orderItems.values()).filter(item => item.orderId === id);
    
    const items = orderItemsRaw.map(item => {
      const menuItem = this.menuItems.get(item.menuItemId);
      return { ...item, menuItem: menuItem! };
    });

    return { ...order, restaurant, items };
  }

  // User Address operations
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return Array.from(this.userAddresses.values()).filter(address => address.userId === userId);
  }

  async getUserAddressById(id: number): Promise<UserAddress | undefined> {
    return this.userAddresses.get(id);
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const id = this.currentUserAddressId++;
    const newAddress: UserAddress = {
      ...address,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userAddresses.set(id, newAddress);
    return newAddress;
  }

  async updateUserAddress(id: number, address: Partial<InsertUserAddress>): Promise<UserAddress | undefined> {
    const existing = this.userAddresses.get(id);
    if (!existing) return undefined;

    const updated: UserAddress = {
      ...existing,
      ...address,
      updatedAt: new Date(),
    };
    this.userAddresses.set(id, updated);
    return updated;
  }

  async deleteUserAddress(id: number): Promise<boolean> {
    return this.userAddresses.delete(id);
  }

  async setDefaultAddress(userId: string, addressId: number): Promise<void> {
    // Remove default flag from all user's addresses
    for (const [id, address] of this.userAddresses.entries()) {
      if (address.userId === userId) {
        this.userAddresses.set(id, { ...address, isDefault: false });
      }
    }
    
    // Set the specified address as default
    const targetAddress = this.userAddresses.get(addressId);
    if (targetAddress && targetAddress.userId === userId) {
      this.userAddresses.set(addressId, { ...targetAddress, isDefault: true });
    }
  }

  // Wallet System operations - Implementing missing methods for MemStorage
  async getCustomerWallet(customerId: number): Promise<any> {
    const customer = this.customers.get(customerId);
    if (!customer) return null;
    
    return {
      id: customerId,
      customerId,
      cashBalance: customer.balance || "0.00",
      loyaltyPoints: customer.loyaltyPoints || 0,
      totalPointsEarned: customer.totalPointsEarned || 0,
      isActive: true
    };
  }

  async createCustomerWallet(wallet: any): Promise<any> {
    return wallet;
  }

  async updateWalletBalance(customerId: number, newBalance: string): Promise<any> {
    const updated = await this.updateCustomer(customerId, { balance: newBalance });
    if (!updated) return null;
    
    return {
      id: customerId,
      customerId,
      cashBalance: newBalance,
      loyaltyPoints: updated.loyaltyPoints || 0,
      totalPointsEarned: updated.totalPointsEarned || 0,
      isActive: true
    };
  }

  async createWalletTransaction(transaction: any): Promise<any> {
    return {
      id: Date.now(),
      ...transaction,
      createdAt: new Date()
    };
  }

  async getWalletTransactions(customerId: number, limit?: number): Promise<any[]> {
    return [];
  }

  async getCustomerGeneralVouchers(customerId: number): Promise<any[]> {
    return [];
  }

  async getAvailableGeneralVouchers(filters?: any): Promise<any[]> {
    return [];
  }

  // Order operations
  async getRestaurantOrders(ownerId: number): Promise<any[]> {
    return [];
  }



  // Table Reservation operations
  async getReservationsByRestaurant(restaurantId: number): Promise<any[]> {
    return [];
  }

  async getReservationsByCustomer(customerId: number): Promise<any[]> {
    return [];
  }

  async getReservationById(id: number): Promise<any | undefined> {
    return undefined;
  }

  async createReservation(reservation: any): Promise<any> {
    return { id: 1, ...reservation, createdAt: new Date() };
  }

  async updateReservationStatus(id: number, status: string, restaurantNotes?: string, confirmedBy?: number): Promise<any | undefined> {
    return undefined;
  }

  async getRestaurantAvailability(restaurantId: number): Promise<any[]> {
    return [];
  }

  async setRestaurantAvailability(availability: any): Promise<any> {
    return { id: 1, ...availability, createdAt: new Date() };
  }

  async updateRestaurantAvailability(id: number, updates: any): Promise<any | undefined> {
    return undefined;
  }

  // Admin user operations
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    return Array.from(this.adminUsers.values()).find(admin => admin.email === email);
  }

  async createAdminUser(admin: InsertAdminUser & { passwordHash: string }): Promise<AdminUser> {
    const newAdmin: AdminUser = {
      ...admin,
      id: this.currentAdminUserId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };
    this.adminUsers.set(newAdmin.id, newAdmin);
    return newAdmin;
  }

  async updateAdminUser(id: number, updates: Partial<AdminUser>): Promise<AdminUser | undefined> {
    const admin = this.adminUsers.get(id);
    if (!admin) return undefined;

    const updated = { ...admin, ...updates, updatedAt: new Date() };
    this.adminUsers.set(id, updated);
    return updated;
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    const admin = this.adminUsers.get(id);
    if (admin) {
      admin.lastLogin = new Date();
      this.adminUsers.set(id, admin);
    }
  }

  private async seedAdminUser() {
    // Create default admin user for testing Pay Later vouchers
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const adminUser: AdminUser = {
      id: this.currentAdminUserId++,
      email: 'admin@eatoff.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      permissions: ['all'],
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.adminUsers.set(adminUser.id, adminUser);
    console.log('Seeded default admin user: admin@eatoff.com / admin123');
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants);
  }

  async getRestaurantById(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant || undefined;
  }

  async getRestaurantsByFilters(filters: {
    location?: string;
    cuisine?: string;
    priceRange?: string;
    minDiscount?: number;
  }): Promise<Restaurant[]> {
    let query = db.select().from(restaurants).where(
      and(
        eq(restaurants.isActive, true),
        eq(restaurants.isApproved, true)
      )
    );
    
    const conditions = [];
    
    if (filters.location && filters.location !== "All Locations") {
      conditions.push(eq(restaurants.location, filters.location));
    }
    
    if (filters.cuisine) {
      conditions.push(eq(restaurants.cuisine, filters.cuisine));
    }
    
    if (filters.priceRange) {
      conditions.push(eq(restaurants.priceRange, filters.priceRange));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(
        eq(restaurants.isActive, true),
        eq(restaurants.isApproved, true),
        ...conditions
      ));
    }
    
    let result = await query;
    
    // Handle minDiscount filter separately since it requires checking voucher packages
    if (filters.minDiscount !== undefined) {
      const packages = await db.select().from(voucherPackages).where(
        and(
          eq(voucherPackages.isActive, true),
          sql`CAST(${voucherPackages.discountPercentage} AS DECIMAL) >= ${filters.minDiscount}`
        )
      );
      
      const validRestaurantIds = Array.from(new Set(packages.map(p => p.restaurantId)));
      result = result.filter(r => validRestaurantIds.includes(r.id));
    }
    
    return result;
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    // Generate unique restaurant code
    const count = await db.select({ count: sql<number>`COUNT(*)` }).from(restaurants);
    const nextNumber = (count[0]?.count || 0) + 1;
    const restaurantCode = `EAT${nextNumber.toString().padStart(3, '0')}`;
    
    const [newRestaurant] = await db.insert(restaurants).values({
      ...restaurant,
      restaurantCode
    }).returning();
    return newRestaurant;
  }

  async updateRestaurant(id: number, updates: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updated] = await db.update(restaurants).set(updates).where(eq(restaurants.id, id)).returning();
    return updated || undefined;
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    const result = await db.delete(restaurants).where(eq(restaurants.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getPackagesByRestaurant(restaurantId: number): Promise<VoucherPackage[]> {
    return await db.select().from(voucherPackages).where(and(eq(voucherPackages.restaurantId, restaurantId), eq(voucherPackages.isActive, true))).orderBy(desc(voucherPackages.id));
  }

  async getAllActivePackages(): Promise<VoucherPackage[]> {
    return await db.select().from(voucherPackages).where(eq(voucherPackages.isActive, true)).orderBy(desc(voucherPackages.id));
  }

  async getPackageById(id: number): Promise<VoucherPackage | undefined> {
    const [pkg] = await db.select().from(voucherPackages).where(eq(voucherPackages.id, id));
    return pkg || undefined;
  }

  async createPackage(packageData: InsertVoucherPackage): Promise<VoucherPackage> {
    const [newPackage] = await db.insert(voucherPackages).values(packageData).returning();
    return newPackage;
  }

  async updatePackage(id: number, packageData: Partial<InsertVoucherPackage>): Promise<VoucherPackage | undefined> {
    const [updated] = await db.update(voucherPackages).set(packageData).where(eq(voucherPackages.id, id)).returning();
    return updated || undefined;
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await db.delete(voucherPackages).where(eq(voucherPackages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // EatOff voucher operations
  async getEatoffVouchers(): Promise<EatoffVoucher[]> {
    return await db.select().from(eatoffVouchers).orderBy(desc(eatoffVouchers.id));
  }

  async getEatoffVoucherById(id: number): Promise<EatoffVoucher | undefined> {
    const [voucher] = await db.select().from(eatoffVouchers).where(eq(eatoffVouchers.id, id));
    return voucher || undefined;
  }

  async createEatoffVoucher(voucherData: InsertEatoffVoucher): Promise<EatoffVoucher> {
    const [newVoucher] = await db.insert(eatoffVouchers).values(voucherData).returning();
    return newVoucher;
  }

  async updateEatoffVoucher(id: number, voucherData: Partial<InsertEatoffVoucher>): Promise<EatoffVoucher | undefined> {
    const [updated] = await db.update(eatoffVouchers).set(voucherData).where(eq(eatoffVouchers.id, id)).returning();
    return updated || undefined;
  }

  async deleteEatoffVoucher(id: number): Promise<boolean> {
    const result = await db.delete(eatoffVouchers).where(eq(eatoffVouchers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return updated || undefined;
  }

  async getPurchasedVouchersByCustomer(customerId: number): Promise<PurchasedVoucher[]> {
    return await db.select().from(purchasedVouchers).where(eq(purchasedVouchers.customerId, customerId));
  }

  async getPurchasedVouchersWithRestaurantDetails(customerId: number): Promise<(PurchasedVoucher & { restaurant: { name: string; imageUrl: string | null; cuisine: string; address: string; rating: string | null; googleRating: string | null; googleReviewCount: number | null; reviewCount: number | null; } })[]> {
    const results = await db.select({
      voucher: purchasedVouchers,
      restaurantName: restaurants.name,
      restaurantImageUrl: restaurants.imageUrl,
      restaurantCuisine: restaurants.cuisine,
      restaurantAddress: restaurants.address,
      restaurantRating: restaurants.rating,
      restaurantGoogleRating: restaurants.googleRating,
      restaurantGoogleReviewCount: restaurants.googleReviewCount,
      restaurantReviewCount: restaurants.reviewCount,
    })
    .from(purchasedVouchers)
    .leftJoin(restaurants, eq(purchasedVouchers.restaurantId, restaurants.id))
    .where(eq(purchasedVouchers.customerId, customerId));
    
    return results.map(row => ({
      ...row.voucher,
      restaurant: {
        name: row.restaurantName || 'Unknown',
        imageUrl: row.restaurantImageUrl || null,
        cuisine: row.restaurantCuisine || '',
        address: row.restaurantAddress || '',
        rating: row.restaurantRating || null,
        googleRating: row.restaurantGoogleRating || null,
        googleReviewCount: row.restaurantGoogleReviewCount || null,
        reviewCount: row.restaurantReviewCount || null,
      }
    }));
  }

  async getPurchasedVoucherById(id: number): Promise<PurchasedVoucher | undefined> {
    const [voucher] = await db.select().from(purchasedVouchers).where(eq(purchasedVouchers.id, id));
    return voucher || undefined;
  }

  async createPurchasedVoucher(voucher: InsertPurchasedVoucher): Promise<PurchasedVoucher> {
    const [newVoucher] = await db.insert(purchasedVouchers).values(voucher).returning();
    return newVoucher;
  }

  async updateVoucherUsage(id: number, usedMeals: number): Promise<PurchasedVoucher | undefined> {
    const [updated] = await db.update(purchasedVouchers)
      .set({ usedMeals })
      .where(eq(purchasedVouchers.id, id))
      .returning();
    return updated || undefined;
  }

  async getRedemptionsByVoucher(voucherId: number): Promise<VoucherRedemption[]> {
    return await db.select().from(voucherRedemptions).where(eq(voucherRedemptions.voucherId, voucherId));
  }

  async createRedemption(redemption: InsertVoucherRedemption): Promise<VoucherRedemption> {
    const [newRedemption] = await db.insert(voucherRedemptions).values(redemption).returning();
    return newRedemption;
  }

  async getMenuItemsByRestaurant(restaurantId: number): Promise<MenuItem[]> {
    return await db.select().from(menuItems)
      .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.isAvailable, true)))
      .orderBy(menuItems.category, menuItems.name);
  }

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return menuItem || undefined;
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const [newMenuItem] = await db.insert(menuItems).values(menuItem).returning();
    return newMenuItem;
  }

  async updateMenuItem(id: number, updates: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems)
      .set(updates)
      .where(eq(menuItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return result.rowCount > 0;
  }

  async getRestaurantAnalytics(restaurantId: number): Promise<{
    totalSales: number;
    vouchersSold: number;
    totalRedemptions: number;
    averagePackageSize: number;
  }> {
    // This would require complex queries with joins and aggregations
    // For now, returning mock data - this would be implemented with proper SQL
    return {
      totalSales: 0,
      vouchersSold: 0,
      totalRedemptions: 0,
      averagePackageSize: 0
    };
  }

  // Restaurant Owner operations
  async getRestaurantOwnerByEmail(email: string): Promise<RestaurantOwner | undefined> {
    const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.email, email));
    return owner;
  }

  async getRestaurantOwnerById(id: number): Promise<RestaurantOwner | undefined> {
    const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.id, id));
    return owner;
  }

  async getRestaurantOwnersByCompany(companyName: string): Promise<RestaurantOwner[]> {
    return await db.select().from(restaurantOwners).where(eq(restaurantOwners.companyName, companyName));
  }

  async createRestaurantOwner(owner: InsertRestaurantOwner & { passwordHash: string }): Promise<RestaurantOwner> {
    const { password, ...ownerData } = owner;
    const [newOwner] = await db.insert(restaurantOwners).values(ownerData).returning();
    return newOwner;
  }

  async updateRestaurantOwner(id: number, updates: Partial<RestaurantOwner>): Promise<RestaurantOwner | undefined> {
    const [updated] = await db.update(restaurantOwners).set(updates).where(eq(restaurantOwners.id, id)).returning();
    return updated;
  }

  async deleteRestaurantOwner(id: number): Promise<boolean> {
    // First check if this owner has any restaurants
    const ownerRestaurants = await this.getRestaurantsByOwner(id);
    if (ownerRestaurants.length > 0) {
      throw new Error(`Cannot delete owner: still owns ${ownerRestaurants.length} restaurant(s). Please transfer or delete restaurants first.`);
    }
    
    const result = await db.delete(restaurantOwners).where(eq(restaurantOwners.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRestaurantOwnerUsers(ownerId: number): Promise<RestaurantOwner[]> {
    // Get all restaurant owners from the same company as the authenticated owner
    const owner = await this.getRestaurantOwnerById(ownerId);
    if (!owner) return [];
    
    return await db.select().from(restaurantOwners)
      .where(and(
        eq(restaurantOwners.companyName, owner.companyName),
        ne(restaurantOwners.id, ownerId) // Exclude the current owner
      ));
  }

  async getRestaurantsByOwner(ownerId: number): Promise<Restaurant[]> {
    return await db.select().from(restaurants).where(eq(restaurants.ownerId, ownerId));
  }

  // Voucher Template operations
  async getVoucherTemplates(): Promise<VoucherTemplate[]> {
    return await db.select().from(voucherTemplates);
  }

  async getVoucherTemplateById(id: number): Promise<VoucherTemplate | undefined> {
    const [template] = await db.select().from(voucherTemplates).where(eq(voucherTemplates.id, id));
    return template;
  }

  async getVoucherTemplatesByCategory(category: string): Promise<VoucherTemplate[]> {
    return await db.select().from(voucherTemplates).where(eq(voucherTemplates.category, category));
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async createOrderWithItems(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();
      
      const orderItemsWithOrderId = items.map(item => ({
        ...item,
        orderId: newOrder.id
      }));
      
      await tx.insert(orderItems).values(orderItemsWithOrderId);
      
      return newOrder;
    });
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async getOrdersByRestaurant(restaurantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.restaurantId, restaurantId));
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  async updateOrderStatus(id: number, status: string, restaurantNotes?: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getOrderWithDetails(id: number): Promise<(Order & { restaurant: Restaurant; items: (OrderItem & { menuItem: MenuItem })[] }) | undefined> {
    const order = await this.getOrderById(id);
    if (!order) return undefined;

    const restaurant = await this.getRestaurantById(order.restaurantId);
    if (!restaurant) return undefined;

    const orderItemsRaw = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    
    const items = await Promise.all(
      orderItemsRaw.map(async (item) => {
        const menuItem = await this.getMenuItemById(item.menuItemId);
        return { ...item, menuItem: menuItem! };
      })
    );

    return { ...order, restaurant, items };
  }

  // User Address operations
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return await db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
  }

  async getUserAddressById(id: number): Promise<UserAddress | undefined> {
    const [address] = await db.select().from(userAddresses).where(eq(userAddresses.id, id));
    return address;
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const [newAddress] = await db.insert(userAddresses).values(address).returning();
    return newAddress;
  }

  async updateUserAddress(id: number, address: Partial<InsertUserAddress>): Promise<UserAddress | undefined> {
    const [updated] = await db.update(userAddresses).set(address).where(eq(userAddresses.id, id)).returning();
    return updated;
  }

  async deleteUserAddress(id: number): Promise<boolean> {
    const result = await db.delete(userAddresses).where(eq(userAddresses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async setDefaultAddress(userId: string, addressId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove default flag from all user's addresses
      await tx.update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, userId));
      
      // Set the specified address as default
      await tx.update(userAddresses)
        .set({ isDefault: true })
        .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)));
    });
  }

  // Wallet System operations - Implementing missing methods
  async getCustomerWallet(customerId: number): Promise<any> {
    // For now, return customer balance as wallet
    const customer = await this.getCustomerById(customerId);
    if (!customer) return null;
    
    return {
      id: customerId,
      customerId,
      cashBalance: customer.balance || "0.00",
      loyaltyPoints: customer.loyaltyPoints || 0,
      totalPointsEarned: customer.totalPointsEarned || 0,
      isActive: true
    };
  }

  async createCustomerWallet(wallet: any): Promise<any> {
    // For now, just return the wallet data since customer balance is stored in customers table
    return wallet;
  }

  async updateWalletBalance(customerId: number, newBalance: string): Promise<any> {
    const updated = await this.updateCustomer(customerId, { balance: newBalance });
    if (!updated) return null;
    
    return {
      id: customerId,
      customerId,
      cashBalance: newBalance,
      loyaltyPoints: updated.loyaltyPoints || 0,
      totalPointsEarned: updated.totalPointsEarned || 0,
      isActive: true
    };
  }

  async createWalletTransaction(transaction: any): Promise<any> {
    // For now, return mock transaction - would need to implement proper wallet_transactions table
    return {
      id: Date.now(),
      ...transaction,
      createdAt: new Date()
    };
  }

  async getWalletTransactions(customerId: number, limit?: number): Promise<any[]> {
    // Return empty array for now - would need to implement proper wallet_transactions table
    return [];
  }

  async getCustomerGeneralVouchers(customerId: number): Promise<any[]> {
    // Return empty array for now - would need to implement proper general vouchers system
    return [];
  }

  async getAvailableGeneralVouchers(filters?: any): Promise<any[]> {
    // Return empty array for now - would need to implement proper general vouchers system
    return [];
  }

  // Order operations
  async getRestaurantOrders(ownerId: number): Promise<any[]> {
    const ownerRestaurants = await this.getRestaurantsByOwner(ownerId);
    const restaurantIds = ownerRestaurants.map(r => r.id);
    
    if (restaurantIds.length === 0) {
      return [];
    }

    const allOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        customerEmail: orders.customerEmail,
        deliveryAddress: orders.deliveryAddress,
        orderType: orders.orderType,
        specialInstructions: orders.specialInstructions,
        estimatedReadyTime: orders.estimatedReadyTime,
        orderDate: orders.orderDate,
        restaurantId: orders.restaurantId,
        restaurant: {
          id: restaurants.id,
          name: restaurants.name,
        }
      })
      .from(orders)
      .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
      .where(
        restaurantIds.length === 1 
          ? eq(orders.restaurantId, restaurantIds[0])
          : eq(orders.restaurantId, restaurantIds[0]) // Will handle multiple restaurants if needed
      )
      .orderBy(orders.orderDate);

    // Get order items for each order
    for (const order of allOrders) {
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
          specialRequests: orderItems.specialRequests,
          menuItem: {
            id: menuItems.id,
            name: menuItems.name,
            description: menuItems.description,
          }
        })
        .from(orderItems)
        .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, order.id));
      
      (order as any).items = items;
    }

    return allOrders;
  }



  // Table Reservation operations
  async getReservationsByRestaurant(restaurantId: number): Promise<TableReservation[]> {
    const reservations = await db
      .select()
      .from(tableReservations)
      .where(eq(tableReservations.restaurantId, restaurantId));
    return reservations;
  }

  async getReservationsByCustomer(customerId: number): Promise<TableReservation[]> {
    const reservations = await db
      .select()
      .from(tableReservations)
      .where(eq(tableReservations.customerId, customerId));
    return reservations;
  }

  async getReservationById(id: number): Promise<TableReservation | undefined> {
    const [reservation] = await db
      .select()
      .from(tableReservations)
      .where(eq(tableReservations.id, id));
    return reservation;
  }

  async createReservation(reservation: InsertTableReservation): Promise<TableReservation> {
    const [newReservation] = await db
      .insert(tableReservations)
      .values(reservation)
      .returning();
    return newReservation;
  }

  async updateReservationStatus(id: number, status: string, restaurantNotes?: string, confirmedBy?: number): Promise<TableReservation | undefined> {
    const updateData: any = { status };
    if (restaurantNotes !== undefined) updateData.restaurantNotes = restaurantNotes;
    if (confirmedBy !== undefined) updateData.confirmedBy = confirmedBy;
    if (status === 'confirmed') updateData.confirmedAt = new Date();

    const [updatedReservation] = await db
      .update(tableReservations)
      .set(updateData)
      .where(eq(tableReservations.id, id))
      .returning();
    return updatedReservation;
  }

  async getRestaurantAvailability(restaurantId: number): Promise<RestaurantAvailability[]> {
    const availability = await db
      .select()
      .from(restaurantAvailability)
      .where(eq(restaurantAvailability.restaurantId, restaurantId));
    return availability;
  }

  async setRestaurantAvailability(availability: InsertRestaurantAvailability): Promise<RestaurantAvailability> {
    const [newAvailability] = await db
      .insert(restaurantAvailability)
      .values(availability)
      .returning();
    return newAvailability;
  }

  async updateRestaurantAvailability(id: number, updates: Partial<InsertRestaurantAvailability>): Promise<RestaurantAvailability | undefined> {
    const [updatedAvailability] = await db
      .update(restaurantAvailability)
      .set(updates)
      .where(eq(restaurantAvailability.id, id))
      .returning();
    return updatedAvailability;
  }

  // Points System operations
  async getCustomerPointsData(customerId: number): Promise<{ currentPoints: number } | null> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) return null;
    
    return {
      currentPoints: customer.loyaltyPoints || 0
    };
  }

  async getPointsTransactionsByCustomer(customerId: number): Promise<PointsTransaction[]> {
    const transactions = await db
      .select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.customerId, customerId))
      .orderBy(desc(pointsTransactions.createdAt));
    return transactions;
  }

  async createPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction> {
    const [newTransaction] = await db
      .insert(pointsTransactions)
      .values(transaction)
      .returning();

    // Update customer loyalty points
    if (transaction.transactionType === 'earned') {
      await db
        .update(customers)
        .set({
          loyaltyPoints: sql`${customers.loyaltyPoints} + ${transaction.pointsAmount}`,
          totalPointsEarned: sql`${customers.totalPointsEarned} + ${transaction.pointsAmount}`
        })
        .where(eq(customers.id, transaction.customerId));
    } else if (transaction.transactionType === 'redeemed') {
      await db
        .update(customers)
        .set({
          loyaltyPoints: sql`${customers.loyaltyPoints} - ${transaction.pointsAmount}`
        })
        .where(eq(customers.id, transaction.customerId));
    }

    return newTransaction;
  }

  async updateCustomerPoints(customerId: number, pointsChange: number): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        loyaltyPoints: sql`${customers.loyaltyPoints} + ${pointsChange}`
      })
      .where(eq(customers.id, customerId))
      .returning();
    return updatedCustomer;
  }

  async getPointsRedemptionsByCustomer(customerId: number): Promise<PointsRedemption[]> {
    const redemptions = await db
      .select()
      .from(pointsRedemptions)
      .where(eq(pointsRedemptions.customerId, customerId))
      .orderBy(desc(pointsRedemptions.redemptionDate));
    return redemptions;
  }

  async createPointsRedemption(redemption: InsertPointsRedemption): Promise<PointsRedemption> {
    const [newRedemption] = await db
      .insert(pointsRedemptions)
      .values(redemption)
      .returning();
    return newRedemption;
  }

  calculatePointsValue(points: number): number {
    return points / 100; // 100 points = €1
  }

  async redeemPointsForPayment(customerId: number, restaurantId: number, pointsToRedeem: number, orderId?: number): Promise<PointsRedemption> {
    const cashValue = this.calculatePointsValue(pointsToRedeem);
    
    let redemption;
    try {
      redemption = await this.createPointsRedemption({
        customerId,
        restaurantId,
        pointsUsed: pointsToRedeem,
        cashValue: cashValue.toFixed(2),
        exchangeRate: "0.01", // 1 point = €0.01, so 100 points = €1
        orderId: orderId || null
      });
    } catch (error) {
      console.error('Error in createPointsRedemption:', error);
      throw error;
    }

    // Deduct points from customer
    await this.updateCustomerPoints(customerId, -pointsToRedeem);

    // Update financial tracking for restaurant and EatOff
    try {
      await this.updateFinancialTracking(restaurantId, cashValue, 'points');
    } catch (error) {
      console.error('Error updating financial tracking:', error);
      // Don't throw error here - the redemption was successful, tracking failure shouldn't break the process
    }

    return redemption;
  }

  async updateFinancialTracking(restaurantId: number, amount: number, paymentType: 'cash' | 'points'): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const commissionRate = 0.0550; // 5.5% commission rate formatted for numeric(5,4)
    const commissionAmount = Math.round(amount * commissionRate * 100) / 100; // Round to 2 decimal places
    const netAmount = Math.round((amount - commissionAmount) * 100) / 100; // Round to 2 decimal places
    
    console.log(`Financial update: restaurant=${restaurantId}, amount=${amount}, type=${paymentType}`);
    console.log(`Calculated: rate=${commissionRate}, commission=${commissionAmount}, net=${netAmount}`);

    try {
      // Update restaurant financials
      if (paymentType === 'points') {
        await db.execute(sql`
          INSERT INTO restaurant_financials (restaurant_id, date, points_earned, commission_rate, commission_amount, net_amount)
          VALUES (${restaurantId}, ${today}, ${amount}, ${commissionRate}, ${commissionAmount}, ${netAmount})
          ON CONFLICT (restaurant_id, date) 
          DO UPDATE SET 
            points_earned = COALESCE(restaurant_financials.points_earned, 0) + ${amount},
            commission_rate = ${commissionRate},
            commission_amount = COALESCE(restaurant_financials.commission_amount, 0) + ${commissionAmount},
            net_amount = COALESCE(restaurant_financials.net_amount, 0) + ${netAmount}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO restaurant_financials (restaurant_id, date, cash_earned, commission_rate, commission_amount, net_amount)
          VALUES (${restaurantId}, ${today}, ${amount}, ${commissionRate}, ${commissionAmount}, ${netAmount})
          ON CONFLICT (restaurant_id, date) 
          DO UPDATE SET 
            cash_earned = COALESCE(restaurant_financials.cash_earned, 0) + ${amount},
            commission_rate = ${commissionRate},
            commission_amount = COALESCE(restaurant_financials.commission_amount, 0) + ${commissionAmount},
            net_amount = COALESCE(restaurant_financials.net_amount, 0) + ${netAmount}
        `);
      }

      // Update EatOff daily summary
      const dateStr = today;
      const commissionEarned = commissionAmount;
      const amountOwedToRestaurant = netAmount;

      if (paymentType === 'points') {
        await db.execute(sql`
          INSERT INTO eatoff_daily_summary (date, total_orders, total_points_paid, total_commission_earned, total_amount_owed_to_restaurants)
          VALUES (${dateStr}, 1, ${amount}, ${commissionEarned}, ${amountOwedToRestaurant})
          ON CONFLICT (date) 
          DO UPDATE SET 
            total_orders = COALESCE(eatoff_daily_summary.total_orders, 0) + 1,
            total_points_paid = COALESCE(eatoff_daily_summary.total_points_paid, 0) + ${amount},
            total_commission_earned = COALESCE(eatoff_daily_summary.total_commission_earned, 0) + ${commissionEarned},
            total_amount_owed_to_restaurants = COALESCE(eatoff_daily_summary.total_amount_owed_to_restaurants, 0) + ${amountOwedToRestaurant}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO eatoff_daily_summary (date, total_orders, total_cash_paid, total_commission_earned, total_amount_owed_to_restaurants)
          VALUES (${dateStr}, 1, ${amount}, ${commissionEarned}, ${amountOwedToRestaurant})
          ON CONFLICT (date) 
          DO UPDATE SET 
            total_orders = COALESCE(eatoff_daily_summary.total_orders, 0) + 1,
            total_cash_paid = COALESCE(eatoff_daily_summary.total_cash_paid, 0) + ${amount},
            total_commission_earned = COALESCE(eatoff_daily_summary.total_commission_earned, 0) + ${commissionEarned},
            total_amount_owed_to_restaurants = COALESCE(eatoff_daily_summary.total_amount_owed_to_restaurants, 0) + ${amountOwedToRestaurant}
        `);
      }
      
      console.log('Financial tracking updated successfully');
    } catch (error) {
      console.error('Error updating financial tracking:', error);
      throw error; // Re-throw so the calling function can handle it
    }
  }

  // Loyalty System implementations
  async getLoyaltyCategoriesByRestaurant(restaurantId: number): Promise<LoyaltyCategory[]> {
    const categories = await db.select().from(loyaltyCategories)
      .where(eq(loyaltyCategories.restaurantId, restaurantId))
      .orderBy(loyaltyCategories.sortOrder);
    return categories;
  }

  async getLoyaltyCategoryById(id: number): Promise<LoyaltyCategory | undefined> {
    const [category] = await db.select().from(loyaltyCategories)
      .where(eq(loyaltyCategories.id, id));
    return category;
  }

  async createLoyaltyCategory(category: InsertLoyaltyCategory): Promise<LoyaltyCategory> {
    const [created] = await db.insert(loyaltyCategories).values(category).returning();
    return created;
  }

  async updateLoyaltyCategory(id: number, updates: Partial<InsertLoyaltyCategory>): Promise<LoyaltyCategory | undefined> {
    const [updated] = await db.update(loyaltyCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loyaltyCategories.id, id))
      .returning();
    return updated;
  }

  async deleteLoyaltyCategory(id: number): Promise<boolean> {
    const result = await db.delete(loyaltyCategories).where(eq(loyaltyCategories.id, id));
    return true;
  }

  // Loyal Customers implementations
  async getLoyalCustomersByRestaurant(restaurantId: number): Promise<LoyalCustomer[]> {
    const loyals = await db.select().from(loyalCustomers)
      .where(eq(loyalCustomers.restaurantId, restaurantId));
    return loyals;
  }

  async getLoyalCustomersByCustomer(customerId: number): Promise<LoyalCustomer[]> {
    const loyals = await db.select().from(loyalCustomers)
      .where(eq(loyalCustomers.customerId, customerId));
    return loyals;
  }

  async getLoyalCustomer(customerId: number, restaurantId: number): Promise<LoyalCustomer | undefined> {
    const [loyal] = await db.select().from(loyalCustomers)
      .where(and(
        eq(loyalCustomers.customerId, customerId),
        eq(loyalCustomers.restaurantId, restaurantId)
      ));
    return loyal;
  }

  async createLoyalCustomer(loyalCustomer: InsertLoyalCustomer): Promise<LoyalCustomer> {
    const [created] = await db.insert(loyalCustomers).values(loyalCustomer).returning();
    return created;
  }

  async updateLoyalCustomer(id: number, updates: Partial<InsertLoyalCustomer>): Promise<LoyalCustomer | undefined> {
    const [updated] = await db.update(loyalCustomers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loyalCustomers.id, id))
      .returning();
    return updated;
  }

  async enrollCustomerToRestaurant(customerCode: string, restaurantId: number): Promise<LoyalCustomer | null> {
    // Find customer by their unique code
    const customer = await this.getCustomerByCode(customerCode);
    if (!customer) return null;

    // Check if already enrolled
    const existing = await this.getLoyalCustomer(customer.id, restaurantId);
    if (existing) return existing;

    // Get default loyalty category for restaurant
    const categories = await this.getLoyaltyCategoriesByRestaurant(restaurantId);
    const defaultCategory = categories.find(c => c.isDefault) || categories[0];

    // Create loyal customer relationship
    const loyalCustomer = await this.createLoyalCustomer({
      customerId: customer.id,
      restaurantId,
      categoryId: defaultCategory?.id || null,
      customerCode,
      isActive: true
    });

    return loyalCustomer;
  }

  // Payment Request implementations
  async getPaymentRequestById(id: number): Promise<PaymentRequest | undefined> {
    const [request] = await db.select().from(paymentRequests)
      .where(eq(paymentRequests.id, id));
    return request;
  }

  async getPaymentRequestsByRestaurant(restaurantId: number): Promise<PaymentRequest[]> {
    const requests = await db.select().from(paymentRequests)
      .where(eq(paymentRequests.restaurantId, restaurantId))
      .orderBy(desc(paymentRequests.createdAt));
    return requests;
  }

  async getPaymentRequestsByCustomer(customerId: number): Promise<PaymentRequest[]> {
    const requests = await db.select().from(paymentRequests)
      .where(eq(paymentRequests.customerId, customerId))
      .orderBy(desc(paymentRequests.createdAt));
    return requests;
  }

  async getPendingPaymentRequestsByCustomer(customerId: number): Promise<PaymentRequest[]> {
    const requests = await db.select().from(paymentRequests)
      .where(and(
        eq(paymentRequests.customerId, customerId),
        eq(paymentRequests.status, 'pending')
      ))
      .orderBy(desc(paymentRequests.createdAt));
    return requests;
  }

  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const [created] = await db.insert(paymentRequests).values(request).returning();
    return created;
  }

  async updatePaymentRequest(id: number, updates: Partial<InsertPaymentRequest>): Promise<PaymentRequest | undefined> {
    const [updated] = await db.update(paymentRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentRequests.id, id))
      .returning();
    return updated;
  }

  // Customer code generation
  async generateCustomerCode(customerId: number): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CLI-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure unique
    const existing = await this.getCustomerByCode(code);
    if (existing) {
      return this.generateCustomerCode(customerId); // Retry if collision
    }
    
    // Update customer with the code
    await db.update(customers)
      .set({ 
        customerCode: code,
        isProfileComplete: true 
      })
      .where(eq(customers.id, customerId));
    
    return code;
  }

  async getCustomerByCode(customerCode: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers)
      .where(eq(customers.customerCode, customerCode));
    return customer;
  }

  // Customer Favorites operations
  async getCustomerFavorites(customerId: number): Promise<CustomerFavorite[]> {
    const favorites = await db.select().from(customerFavorites)
      .where(eq(customerFavorites.customerId, customerId));
    return favorites;
  }

  async addCustomerFavorite(favorite: InsertCustomerFavorite): Promise<CustomerFavorite> {
    const [created] = await db.insert(customerFavorites).values(favorite).returning();
    return created;
  }

  async removeCustomerFavorite(customerId: number, restaurantId: number): Promise<boolean> {
    const result = await db.delete(customerFavorites)
      .where(and(
        eq(customerFavorites.customerId, customerId),
        eq(customerFavorites.restaurantId, restaurantId)
      ));
    return true;
  }

  async isRestaurantFavorite(customerId: number, restaurantId: number): Promise<boolean> {
    const [favorite] = await db.select().from(customerFavorites)
      .where(and(
        eq(customerFavorites.customerId, customerId),
        eq(customerFavorites.restaurantId, restaurantId)
      ));
    return !!favorite;
  }

  // Customer Reviews operations
  async getReviewsByRestaurant(restaurantId: number): Promise<CustomerReview[]> {
    const reviews = await db.select().from(customerReviews)
      .where(eq(customerReviews.restaurantId, restaurantId))
      .orderBy(desc(customerReviews.createdAt));
    return reviews;
  }

  async getReviewsByCustomer(customerId: number): Promise<CustomerReview[]> {
    const reviews = await db.select().from(customerReviews)
      .where(eq(customerReviews.customerId, customerId))
      .orderBy(desc(customerReviews.createdAt));
    return reviews;
  }

  async createReview(review: InsertCustomerReview): Promise<CustomerReview> {
    const [created] = await db.insert(customerReviews).values(review).returning();
    
    // Update restaurant rating
    const { avgRating, count } = await this.getRestaurantAverageRating(review.restaurantId);
    await db.update(restaurants)
      .set({ rating: avgRating.toFixed(1), reviewCount: count })
      .where(eq(restaurants.id, review.restaurantId));
    
    return created;
  }

  async updateReview(id: number, updates: Partial<InsertCustomerReview>): Promise<CustomerReview | undefined> {
    const [updated] = await db.update(customerReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerReviews.id, id))
      .returning();
    
    if (updated) {
      const { avgRating, count } = await this.getRestaurantAverageRating(updated.restaurantId);
      await db.update(restaurants)
        .set({ rating: avgRating.toFixed(1), reviewCount: count })
        .where(eq(restaurants.id, updated.restaurantId));
    }
    
    return updated;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [review] = await db.select().from(customerReviews).where(eq(customerReviews.id, id));
    if (!review) return false;
    
    await db.delete(customerReviews).where(eq(customerReviews.id, id));
    
    const { avgRating, count } = await this.getRestaurantAverageRating(review.restaurantId);
    await db.update(restaurants)
      .set({ rating: avgRating.toFixed(1), reviewCount: count })
      .where(eq(restaurants.id, review.restaurantId));
    
    return true;
  }

  async getRestaurantAverageRating(restaurantId: number): Promise<{ avgRating: number; count: number }> {
    const reviews = await db.select().from(customerReviews)
      .where(eq(customerReviews.restaurantId, restaurantId));
    
    if (reviews.length === 0) {
      return { avgRating: 0, count: 0 };
    }
    
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { avgRating: sum / reviews.length, count: reviews.length };
  }

}

export const storage = new MemStorage();
