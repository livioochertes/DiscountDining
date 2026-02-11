import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// GeoNames cities database for location selection
export const geonamesCities = pgTable(
  "geonames_cities",
  {
    geonameId: integer("geoname_id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    asciiName: varchar("ascii_name", { length: 200 }),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    admin1Code: varchar("admin1_code", { length: 20 }), // state/region
    population: integer("population").default(0),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    timezone: varchar("timezone", { length: 40 }),
  },
  (table) => [
    index("idx_geonames_country").on(table.countryCode),
    index("idx_geonames_name").on(table.name),
  ],
);

export const insertGeonamesCitySchema = createInsertSchema(geonamesCities);
export type InsertGeonamesCity = z.infer<typeof insertGeonamesCitySchema>;
export type GeonamesCity = typeof geonamesCities.$inferSelect;

// Mobile session tokens table (for native app authentication)
export const mobileSessions = pgTable(
  "mobile_sessions",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    userData: jsonb("user_data"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_mobile_sessions_token").on(table.token)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User saved addresses for delivery preferences
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  label: varchar("label").notNull(), // e.g., "Home", "Work", "Apartment"
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  instructions: text("instructions"), // delivery instructions
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Restaurant owners/managers authentication table
export const restaurantOwners = pgTable("restaurant_owners", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  
  // Company Information
  companyName: text("company_name").notNull(),
  businessRegistrationNumber: varchar("business_registration_number"),
  taxId: varchar("tax_id"),
  companyAddress: text("company_address").notNull(),
  companyPhone: varchar("company_phone").notNull(),
  companyWebsite: varchar("company_website"),
  
  // Contact Person Information
  contactPersonName: text("contact_person_name").notNull(),
  contactPersonTitle: text("contact_person_title").notNull(),
  contactPersonPhone: varchar("contact_person_phone").notNull(),
  contactPersonEmail: varchar("contact_person_email").notNull(),
  
  // Banking Information for Payments
  bankName: varchar("bank_name"),
  bankAccountNumber: varchar("bank_account_number"),
  bankRoutingNumber: varchar("bank_routing_number"),
  bankAccountHolderName: varchar("bank_account_holder_name"),
  iban: varchar("iban"),
  swiftCode: varchar("swift_code"),
  bankAddress: text("bank_address"),
  accountType: varchar("account_type"), // checking, savings, business
  
  // Account Status
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketplaces - defines operating regions with their own currency
export const marketplaces = pgTable("marketplaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Romania", "Romania - Bucuresti", "Spain"
  country: text("country").notNull(), // Country name (allows multiple marketplaces per country)
  countryCode: text("country_code").notNull(), // ISO country code (RO, ES, DE)
  currencyCode: text("currency_code").notNull(), // ISO currency code (RON, EUR, USD)
  currencySymbol: text("currency_symbol").notNull(), // Lei, €, $
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Default marketplace for new restaurants
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMarketplaceSchema = createInsertSchema(marketplaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMarketplace = z.infer<typeof insertMarketplaceSchema>;
export type Marketplace = typeof marketplaces.$inferSelect;

// Voucher package templates provided by the platform
export const voucherTemplates = pgTable("voucher_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  mealCountOptions: integer("meal_count_options").array().notNull(), // [5, 10, 20, 50]
  discountRanges: text("discount_ranges").array().notNull(), // ["10-20%", "20-30%", "30-50%"]
  validityOptions: integer("validity_options").array().notNull(), // [6, 12, 18, 24] months
  imageUrl: text("image_url"),
  category: text("category").notNull(), // casual_dining, fine_dining, fast_casual, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => restaurantOwners.id).notNull(),
  marketplaceId: integer("marketplace_id").references(() => marketplaces.id), // Which marketplace this restaurant belongs to
  name: text("name").notNull(),
  description: text("description").notNull(),
  cuisine: text("cuisine").notNull(),
  mainProduct: text("main_product"), // EU Standard: Pizzeria, Burger, Steakhouse, etc.
  dietCategory: text("diet_category"), // EU Standard: Vegetarian, Vegan, Halal, Kosher, etc.
  conceptType: text("concept_type"), // EU Standard: Fine Dining, Casual Dining, Fast Food, etc.
  experienceType: text("experience_type"), // EU Standard: Wine Bar, Cocktail Bar, Cafe, etc.
  location: text("location").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  imageUrl: text("image_url"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  reviewCount: integer("review_count").default(0),
  googleRating: decimal("google_rating", { precision: 2, scale: 1 }), // Google Maps rating
  googleReviewCount: integer("google_review_count"), // Number of Google reviews
  priceRange: text("price_range").notNull(), // €, €€, €€€
  features: text("features").array(),
  
  // Operating hours and service options
  operatingHours: jsonb("operating_hours"), // Store operating hours as JSON
  offersDelivery: boolean("offers_delivery").default(false),
  offersTakeout: boolean("offers_takeout").default(true),
  dineInAvailable: boolean("dine_in_available").default(true),
  deliveryRadius: decimal("delivery_radius", { precision: 5, scale: 2 }), // in kilometers
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
  minimumDeliveryOrder: decimal("minimum_delivery_order", { precision: 10, scale: 2 }),
  
  // Dietary options and health information
  dietaryOptions: text("dietary_options").array(), // vegetarian, vegan, gluten_free, keto_friendly, low_sodium, etc.
  allergenInfo: text("allergen_info").array(), // contains_nuts, dairy_free, gluten_free, shellfish_free, etc.
  healthFocused: boolean("health_focused").default(false), // restaurant emphasizes healthy options
  
  // Restaurant approval status
  restaurantCode: text("restaurant_code").unique(), // Unique identifier like "EAT001", "EAT002"
  isApproved: boolean("is_approved").default(false),
  isActive: boolean("is_active").default(true),
  approvedAt: timestamp("approved_at"), // When restaurant was approved
  
  // Display priority and ordering
  priority: integer("priority").default(3), // 1 = highest priority, 5 = lowest
  position: integer("position").default(0), // Order within same priority level
  
  // Commission settings per restaurant
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("6.00"), // Default 6%, can be customized
  participatesInCashback: boolean("participates_in_cashback").default(false), // If true, commission is 7.5%
  customCommissionNote: text("custom_commission_note"), // Reason for custom commission rate
  
  // Settlement tracking
  pendingSettlementAmount: decimal("pending_settlement_amount", { precision: 12, scale: 2 }).default("0.00"),
  totalSettledAmount: decimal("total_settled_amount", { precision: 12, scale: 2 }).default("0.00"),
  lastSettlementDate: timestamp("last_settlement_date"),
  
  // Bank details for payouts
  bankAccountName: text("bank_account_name"),
  bankIban: text("bank_iban"),
  bankBic: text("bank_bic"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // appetizers, mains, desserts, beverages, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  ingredients: text("ingredients").array(),
  allergens: text("allergens").array(), // nuts, dairy, gluten, etc.
  dietaryTags: text("dietary_tags").array(), // vegetarian, vegan, gluten_free, etc.
  spiceLevel: integer("spice_level").default(0), // 0-5 scale
  isAvailable: boolean("is_available").default(true),
  calories: integer("calories"),
  preparationTime: integer("preparation_time"), // in minutes
  isPopular: boolean("is_popular").default(false),
  signatureChefId: integer("signature_chef_id"), // Chef who created this signature dish
  createdAt: timestamp("created_at").defaultNow(),
});

export const voucherPackages = pgTable("voucher_packages", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  mealCount: integer("meal_count").notNull(),
  pricePerMeal: decimal("price_per_meal", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(),
  validityMonths: integer("validity_months").default(12),
  validityStartDate: timestamp("validity_start_date"), // Custom start date for validity period
  validityEndDate: timestamp("validity_end_date"), // Custom end date for validity period
  validityType: text("validity_type").default("months"), // "months" or "custom_dates"
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(false), // Changed: vouchers start as inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash"), // Added for authentication
  profilePicture: text("profile_picture"), // URL to user's profile picture
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  
  // Unique customer code and QR for loyalty/payment
  customerCode: text("customer_code").unique(), // Unique code like "CLI-ABC123"
  customerQrCode: text("customer_qr_code"), // Base64 QR code image
  isProfileComplete: boolean("is_profile_complete").default(false), // True when mandatory fields are filled
  
  // Points system
  loyaltyPoints: integer("loyalty_points").default(0),
  totalPointsEarned: integer("total_points_earned").default(0),
  membershipTier: text("membership_tier").default("bronze"), // bronze, silver, gold, platinum
  
  // Health and dietary profile
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  height: integer("height"), // in cm
  activityLevel: text("activity_level"), // sedentary, lightly_active, moderately_active, very_active, extremely_active
  healthGoal: text("health_goal"), // weight_loss, muscle_gain, maintenance, general_health
  
  // Dietary preferences and restrictions
  dietaryPreferences: text("dietary_preferences").array(), // vegetarian, vegan, keto, paleo, mediterranean, etc.
  allergies: text("allergies").array(), // nuts, dairy, gluten, shellfish, eggs, soy, etc.
  dislikes: text("dislikes").array(), // specific foods or ingredients user doesn't like
  
  // Health conditions
  healthConditions: text("health_conditions").array(), // diabetes, hypertension, heart_disease, etc.
  
  // Notification preferences
  notifyPush: boolean("notify_push").default(true),
  notifyEmail: boolean("notify_email").default(true),
  notifyPromo: boolean("notify_promo").default(true),
  
  // Two-factor authentication
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchasedVouchers = pgTable("purchased_vouchers", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  packageId: integer("package_id").references(() => voucherPackages.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  totalMeals: integer("total_meals").notNull(),
  usedMeals: integer("used_meals").default(0),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  discountReceived: decimal("discount_received", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status").notNull().default("active"), // active, expired, fully_used
  qrCode: text("qr_code").notNull(),
});

export const voucherRedemptions = pgTable("voucher_redemptions", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").references(() => purchasedVouchers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  redemptionDate: timestamp("redemption_date").defaultNow(),
  mealValue: decimal("meal_value", { precision: 10, scale: 2 }).notNull(),
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, preparing, ready, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  deliveryAddress: text("delivery_address"),
  orderType: varchar("order_type", { length: 20 }).notNull().default("pickup"), // pickup, delivery
  specialInstructions: text("special_instructions"),
  estimatedReadyTime: timestamp("estimated_ready_time"),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  specialRequests: text("special_requests"),
});

// Points system tables
export const pointsTransactions = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  orderId: integer("order_id").references(() => orders.id),
  voucherId: integer("voucher_id").references(() => purchasedVouchers.id),
  transactionType: text("transaction_type").notNull(), // earned, redeemed, bonus, expired
  pointsAmount: integer("points_amount").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pointsRedemptions = pgTable("points_redemptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  pointsUsed: integer("points_used").notNull(),
  cashValue: decimal("cash_value", { precision: 10, scale: 2 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 5, scale: 4 }).notNull(), // points per euro
  redemptionDate: timestamp("redemption_date").defaultNow(),
});

// Admin management tables
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin, moderator
  permissions: text("permissions").array().notNull().default([]), // manage_restaurants, manage_users, view_analytics, etc.
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key").unique().notNull(),
  settingValue: text("setting_value").notNull(),
  settingType: text("setting_type").notNull(), // string, number, boolean, json
  description: text("description"),
  updatedBy: integer("updated_by").references(() => adminUsers.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Restaurant financial management
export const restaurantFinances = pgTable("restaurant_finances", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  
  // Revenue tracking
  totalVoucherSales: decimal("total_voucher_sales", { precision: 12, scale: 2 }).default("0.00"),
  totalMenuSales: decimal("total_menu_sales", { precision: 12, scale: 2 }).default("0.00"),
  totalPointsRedemptions: decimal("total_points_redemptions", { precision: 12, scale: 2 }).default("0.00"),
  
  // Platform fees
  platformCommission: decimal("platform_commission", { precision: 12, scale: 2 }).default("0.00"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).notNull().default("0.05"), // 5% default
  
  // Settlement
  amountDue: decimal("amount_due", { precision: 12, scale: 2 }).default("0.00"),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default("0.00"),
  settlementStatus: text("settlement_status").default("pending"), // pending, partial, completed
  lastSettlementDate: timestamp("last_settlement_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const platformAnalytics = pgTable("platform_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  
  // User metrics
  totalUsers: integer("total_users").default(0),
  activeUsers: integer("active_users").default(0),
  newUsers: integer("new_users").default(0),
  
  // Restaurant metrics
  totalRestaurants: integer("total_restaurants").default(0),
  activeRestaurants: integer("active_restaurants").default(0),
  newRestaurants: integer("new_restaurants").default(0),
  
  // Transaction metrics
  totalOrders: integer("total_orders").default(0),
  totalVouchersPurchased: integer("total_vouchers_purchased").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 12, scale: 2 }).default("0.00"),
  
  // Points metrics
  totalPointsIssued: integer("total_points_issued").default(0),
  totalPointsRedeemed: integer("total_points_redeemed").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer wallet system for managing payments and vouchers
export const customerWallets = pgTable("customer_wallets", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Balance management
  cashBalance: decimal("cash_balance", { precision: 10, scale: 2 }).default("0.00"),
  loyaltyPoints: integer("loyalty_points").default(0),
  totalPointsEarned: integer("total_points_earned").default(0),
  
  // Wallet security
  walletPin: varchar("wallet_pin", { length: 6 }), // Optional PIN for payments
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// EatOff branded vouchers that appear in all restaurants
export const eatoffVouchers = pgTable("eatoff_vouchers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Optional meal-based fields
  mealCount: integer("meal_count"), // Optional - number of meals
  pricePerMeal: decimal("price_per_meal", { precision: 10, scale: 2 }), // Optional - price per meal
  
  // Value-based fields (always required)
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(), // Total voucher value
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(),
  
  // Pay Later / Deferred Payment fields
  voucherType: text("voucher_type").notNull().default("immediate"), // immediate, pay_later
  bonusPercentage: decimal("bonus_percentage", { precision: 5, scale: 2 }).default("0.00"), // Extra value for pay later
  paymentTermDays: integer("payment_term_days").default(0), // Days until payment is charged (30, 60, etc.)
  requiresPreauth: boolean("requires_preauth").default(false), // Pre-authorize card for later charge
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).default("0.00"), // Interest rate % for pay_later vouchers (0 = no interest)
  allowsCashback: boolean("allows_cashback").default(true), // If true and has interest, customer can earn cashback
  
  // Validity settings
  validityMonths: integer("validity_months").default(12),
  validityStartDate: timestamp("validity_start_date"),
  validityEndDate: timestamp("validity_end_date"),
  validityType: text("validity_type").notNull().default("months"), // months or custom_dates
  
  // EatOff branding
  imageUrl: text("image_url"),
  brandColor: text("brand_color").default("#FF6B35"), // EatOff brand color
  
  // Status and availability
  isActive: boolean("is_active").default(false),
  
  // Display priority and ordering
  priority: integer("priority").default(3), // 1 = highest priority, 5 = lowest
  position: integer("position").default(0), // Order within same priority level
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deferred Payment tracking for Pay Later vouchers
export const deferredPayments = pgTable("deferred_payments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  voucherId: integer("voucher_id").references(() => eatoffVouchers.id).notNull(),
  
  // Payment details
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(), // Amount customer should pay
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).notNull(), // Extra value they get
  totalVoucherValue: decimal("total_voucher_value", { precision: 10, scale: 2 }).notNull(), // Total value in voucher
  
  // Stripe payment info
  paymentIntentId: varchar("payment_intent_id", { length: 255 }), // For immediate capture
  paymentMethodId: varchar("payment_method_id", { length: 255 }), // Stored payment method
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  
  // Payment scheduling
  chargeDate: timestamp("charge_date").notNull(), // When to charge the card
  status: text("status").notNull().default("pending"), // pending, charged, failed, cancelled
  
  // Retry logic for failed payments
  retryCount: integer("retry_count").default(0),
  lastRetryDate: timestamp("last_retry_date"),
  maxRetries: integer("max_retries").default(3),
  
  // Notifications
  notificationsSent: text("notifications_sent").array().default([]), // reminder_7_days, reminder_1_day, charged, failed
  
  createdAt: timestamp("created_at").defaultNow(),
  chargedAt: timestamp("charged_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// General vouchers that EatOff provides with extra discounts
export const generalVouchers = pgTable("general_vouchers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  voucherType: text("voucher_type").notNull(), // "percentage", "fixed_amount", "buy_one_get_one"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumSpend: decimal("minimum_spend", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }), // Cap for percentage discounts
  
  // Pricing and availability
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalValue: decimal("original_value", { precision: 10, scale: 2 }).notNull(),
  savingsPercentage: decimal("savings_percentage", { precision: 5, scale: 2 }).notNull(),
  
  // Usage restrictions
  validityDays: integer("validity_days").default(365),
  usageLimit: integer("usage_limit").default(1), // How many times can be used
  applicableCategories: text("applicable_categories").array(), // cuisine types, price ranges
  excludedRestaurants: integer("excluded_restaurants").array(), // restaurant IDs
  
  // Status and availability
  isActive: boolean("is_active").default(true),
  stockQuantity: integer("stock_quantity").default(1000),
  soldQuantity: integer("sold_quantity").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer purchases of general vouchers
export const customerGeneralVouchers = pgTable("customer_general_vouchers", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  generalVoucherId: integer("general_voucher_id").references(() => generalVouchers.id).notNull(),
  
  // Purchase details
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  expiryDate: timestamp("expiry_date").notNull(),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  status: text("status").notNull().default("active"), // active, used, expired
  
  // QR code for redemption
  qrCode: text("qr_code").notNull().unique(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment transactions for restaurant-to-restaurant transfers
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  
  // Transaction participants
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  
  // Transaction details
  transactionType: text("transaction_type").notNull(), // voucher_payment, menu_payment, general_voucher_payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // voucher, points, general_voucher, cash_balance, mixed
  
  // Payment breakdown
  voucherValue: decimal("voucher_value", { precision: 10, scale: 2 }).default("0.00"),
  pointsUsed: integer("points_used").default(0),
  cashUsed: decimal("cash_used", { precision: 10, scale: 2 }).default("0.00"),
  generalVoucherDiscount: decimal("general_voucher_discount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Platform commission
  platformCommission: decimal("platform_commission", { precision: 10, scale: 2 }).notNull(),
  restaurantReceives: decimal("restaurant_receives", { precision: 10, scale: 2 }).notNull(),
  
  // QR code and verification
  qrCodeScanned: text("qr_code_scanned"),
  transactionStatus: text("transaction_status").notNull().default("pending"), // pending, completed, failed, refunded
  
  // Reference data
  orderId: integer("order_id").references(() => orders.id),
  voucherId: integer("voucher_id").references(() => purchasedVouchers.id),
  generalVoucherId: integer("general_voucher_id").references(() => customerGeneralVouchers.id),
  
  // Verification and processing
  processedAt: timestamp("processed_at"),
  verifiedBy: integer("verified_by"), // restaurant staff ID who verified
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet transaction history for all wallet activities
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Transaction details
  transactionType: text("transaction_type").notNull(), // deposit, payment, refund, voucher_purchase, points_conversion
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  
  // Balance tracking
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  
  // Reference information
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  orderId: integer("order_id").references(() => orders.id),
  paymentTransactionId: integer("payment_transaction_id").references(() => paymentTransactions.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// QR code generation and management
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  
  // QR code details
  qrCodeData: text("qr_code_data").notNull().unique(),
  qrCodeType: text("qr_code_type").notNull(), // voucher, general_voucher, payment_request
  
  // Associated resources
  customerId: integer("customer_id").references(() => customers.id),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  voucherId: integer("voucher_id").references(() => purchasedVouchers.id),
  generalVoucherId: integer("general_voucher_id").references(() => customerGeneralVouchers.id),
  
  // Usage tracking
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  maxUsage: integer("max_usage").default(1),
  
  // Expiry management
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas using Zod
export const insertCustomerWalletSchema = createInsertSchema(customerWallets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGeneralVoucherSchema = createInsertSchema(generalVouchers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerGeneralVoucherSchema = createInsertSchema(customerGeneralVouchers).omit({ id: true, createdAt: true });
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({ id: true, createdAt: true, updatedAt: true });

// Type exports
export type CustomerWallet = typeof customerWallets.$inferSelect;
export type InsertCustomerWallet = z.infer<typeof insertCustomerWalletSchema>;
export type GeneralVoucher = typeof generalVouchers.$inferSelect;
export type InsertGeneralVoucher = z.infer<typeof insertGeneralVoucherSchema>;
export type CustomerGeneralVoucher = typeof customerGeneralVouchers.$inferSelect;
export type InsertCustomerGeneralVoucher = z.infer<typeof insertCustomerGeneralVoucherSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type QrCode = typeof qrCodes.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;

// User dietary profiles for personalized recommendations
export const userDietaryProfiles = pgTable("user_dietary_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  
  // Basic health information
  age: integer("age"),
  height: integer("height"), // in cm
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  gender: varchar("gender"), // male, female, other, prefer_not_to_say
  activityLevel: varchar("activity_level"), // sedentary, lightly_active, moderately_active, very_active, extremely_active
  
  // Health goals
  healthGoal: varchar("health_goal"), // weight_loss, weight_gain, muscle_gain, maintenance, general_health
  targetWeight: decimal("target_weight", { precision: 5, scale: 2 }),
  
  // Dietary preferences and restrictions
  dietaryPreferences: text("dietary_preferences").array(), // vegetarian, vegan, pescatarian, keto, paleo, mediterranean, etc.
  allergies: text("allergies").array(), // nuts, dairy, gluten, shellfish, eggs, soy, etc.
  foodIntolerances: text("food_intolerances").array(), // lactose, gluten, fructose, etc.
  dislikedIngredients: text("disliked_ingredients").array(),
  preferredCuisines: text("preferred_cuisines").array(),
  
  // Health conditions
  healthConditions: text("health_conditions").array(), // diabetes, hypertension, heart_disease, etc.
  medications: text("medications").array(),
  
  // Nutritional preferences
  preferredMealTiming: varchar("preferred_meal_timing"), // early_bird, regular, late_night
  calorieTarget: integer("calorie_target"), // daily calorie goal
  proteinTarget: integer("protein_target"), // daily protein goal in grams
  carbTarget: integer("carb_target"), // daily carb goal in grams
  fatTarget: integer("fat_target"), // daily fat goal in grams
  
  // Lifestyle factors
  budgetRange: varchar("budget_range"), // low, medium, high
  diningFrequency: varchar("dining_frequency"), // rarely, occasionally, regularly, frequently
  socialDining: boolean("social_dining").default(false), // prefers dining with others
  
  // AI learning data
  lastRecommendationUpdate: timestamp("last_recommendation_update"),
  recommendationAccuracy: decimal("recommendation_accuracy", { precision: 3, scale: 2 }).default("0.00"), // 0-1 score
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User meal history for learning preferences
export const userMealHistory = pgTable("user_meal_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  
  // Meal details
  mealType: varchar("meal_type"), // breakfast, lunch, dinner, snack
  mealDate: timestamp("meal_date").notNull(),
  portionSize: varchar("portion_size"), // small, medium, large
  
  // User feedback
  satisfactionRating: integer("satisfaction_rating"), // 1-5 stars
  tasteRating: integer("taste_rating"), // 1-5 stars
  healthinessRating: integer("healthiness_rating"), // 1-5 stars
  valueRating: integer("value_rating"), // 1-5 stars
  
  // Additional feedback
  notes: text("notes"),
  wouldOrderAgain: boolean("would_order_again"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// AI-generated personalized recommendations
export const personalizedRecommendations = pgTable("personalized_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  
  // Recommendation type
  type: varchar("type").notNull(), // restaurant, menu_item, dietary_plan
  targetId: integer("target_id"), // restaurant_id or menu_item_id
  
  // AI analysis
  recommendationScore: decimal("recommendation_score", { precision: 3, scale: 2 }), // 0-1 confidence score
  reasoningFactors: text("reasoning_factors").array(), // why this was recommended
  nutritionalMatch: decimal("nutritional_match", { precision: 3, scale: 2 }),
  preferenceMatch: decimal("preference_match", { precision: 3, scale: 2 }),
  healthGoalAlignment: decimal("health_goal_alignment", { precision: 3, scale: 2 }),
  
  // Recommendation details
  recommendationText: text("recommendation_text"), // AI-generated explanation
  nutritionalHighlights: text("nutritional_highlights").array(),
  cautionaryNotes: text("cautionary_notes").array(),
  
  // Timing and context
  recommendedFor: varchar("recommended_for"), // breakfast, lunch, dinner, snack
  idealDayTime: varchar("ideal_day_time"), // morning, afternoon, evening
  seasonality: varchar("seasonality"), // spring, summer, fall, winter, any
  
  // User interaction
  wasShown: boolean("was_shown").default(false),
  userClicked: boolean("user_clicked").default(false),
  userRated: integer("user_rated"), // 1-5 if user provided feedback
  
  // Metadata
  aiModelVersion: varchar("ai_model_version"),
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // recommendations expire after some time
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission and transaction tracking tables
export const commissionSettings = pgTable("commission_settings", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // percentage (e.g., 5.50 for 5.5%)
  effectiveFrom: timestamp("effective_from").defaultNow(),
  effectiveTo: timestamp("effective_to"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"), // reason for commission change
});

export const transactionCommissions = pgTable("transaction_commissions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id").notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  customerId: integer("customer_id").references(() => customers.id),
  transactionAmount: decimal("transaction_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // wallet, voucher, points
  transactionType: varchar("transaction_type").notNull(), // qr_payment, voucher_purchase, menu_order
  status: varchar("status").default("pending"), // pending, settled, disputed
  processedAt: timestamp("processed_at").defaultNow(),
  settledAt: timestamp("settled_at"),
  notes: text("notes"),
});

export const commissionPayouts = pgTable("commission_payouts", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  payoutPeriodStart: timestamp("payout_period_start").notNull(),
  payoutPeriodEnd: timestamp("payout_period_end").notNull(),
  totalTransactionAmount: decimal("total_transaction_amount", { precision: 12, scale: 2 }).notNull(),
  totalCommissionAmount: decimal("total_commission_amount", { precision: 10, scale: 2 }).notNull(),
  netPayoutAmount: decimal("net_payout_amount", { precision: 10, scale: 2 }).notNull(),
  transactionCount: integer("transaction_count").notNull(),
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  payoutMethod: varchar("payout_method").notNull(), // bank_transfer, check, digital_wallet
  bankDetails: text("bank_details"), // encrypted bank information
  payoutReference: varchar("payout_reference"), // external reference from payment processor
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const platformMetrics = pgTable("platform_metrics", {
  id: serial("id").primaryKey(),
  metricDate: timestamp("metric_date").defaultNow(),
  totalTransactions: integer("total_transactions").default(0),
  totalTransactionVolume: decimal("total_transaction_volume", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 10, scale: 2 }).default("0.00"),
  activeRestaurants: integer("active_restaurants").default(0),
  activeCustomers: integer("active_customers").default(0),
  vouchersRedeemed: integer("vouchers_redeemed").default(0),
  qrPaymentsProcessed: integer("qr_payments_processed").default(0),
  averageTransactionValue: decimal("average_transaction_value", { precision: 8, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// EatOff Admin and management tables
export const eatoffAdmins = pgTable("eatoff_admins", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  fullName: varchar("full_name").notNull(),
  role: varchar("role").notNull(), // super_admin, admin, analyst
  permissions: text("permissions").array().notNull(), // commission_management, restaurant_oversight, user_analytics, marketing_campaigns
  twoFactorSecret: varchar("two_factor_secret"), // encrypted 2FA secret
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => eatoffAdmins.id),
  sessionToken: varchar("session_token").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  loginAt: timestamp("login_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => eatoffAdmins.id),
  action: varchar("action").notNull(), // login, commission_change, restaurant_suspend, user_view, etc.
  resourceType: varchar("resource_type"), // restaurant, user, commission, campaign
  resourceId: varchar("resource_id"), 
  oldValues: text("old_values"), // JSON string of previous values
  newValues: text("new_values"), // JSON string of new values
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // email, sms, voucher_promotion, loyalty_bonus
  targetSegment: varchar("target_segment").notNull(), // high_spenders, frequent_users, inactive_users, etc.
  targetCriteria: text("target_criteria"), // JSON string with filtering criteria
  content: text("content"), // email/sms content or promotion details
  scheduledAt: timestamp("scheduled_at"),
  launchedAt: timestamp("launched_at"),
  completedAt: timestamp("completed_at"),
  status: varchar("status").default("draft"), // draft, scheduled, active, completed, cancelled
  targetCount: integer("target_count").default(0),
  sentCount: integer("sent_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  revenueGenerated: decimal("revenue_generated", { precision: 10, scale: 2 }).default("0.00"),
  createdBy: integer("created_by").references(() => eatoffAdmins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignTargets = pgTable("campaign_targets", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  userId: integer("user_id").references(() => customers.id),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  convertedAt: timestamp("converted_at"), // when user made a purchase/action
  conversionValue: decimal("conversion_value", { precision: 8, scale: 2 }),
  status: varchar("status").default("pending"), // pending, sent, opened, clicked, converted, bounced
});

// Table reservation system
export const tableReservations = pgTable("table_reservations", {
  id: serial("id").primaryKey(),
  
  // Customer information
  customerId: integer("customer_id").references(() => customers.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  
  // Restaurant information
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  
  // Reservation details
  reservationDate: timestamp("reservation_date").notNull(),
  partySize: integer("party_size").notNull(),
  specialRequests: text("special_requests"),
  
  // Voucher package integration (optional)
  voucherPackageId: integer("voucher_package_id").references(() => voucherPackages.id),
  isVoucherReservation: boolean("is_voucher_reservation").default(false),
  
  // Reservation status
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, cancelled, completed, no_show
  
  // Restaurant response
  restaurantNotes: text("restaurant_notes"),
  confirmedBy: integer("confirmed_by"), // restaurant staff/owner ID
  confirmedAt: timestamp("confirmed_at"),
  
  // Notification tracking
  customerNotified: boolean("customer_notified").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reservation availability settings for restaurants
export const restaurantAvailability = pgTable("restaurant_availability", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  
  // Day of week (0 = Sunday, 1 = Monday, etc.)
  dayOfWeek: integer("day_of_week").notNull(),
  
  // Time slots
  openTime: varchar("open_time", { length: 5 }).notNull(), // HH:MM format
  closeTime: varchar("close_time", { length: 5 }).notNull(), // HH:MM format
  
  // Capacity management
  maxPartySize: integer("max_party_size").default(8),
  totalTables: integer("total_tables").default(10),
  
  // Reservation settings
  acceptsReservations: boolean("accepts_reservations").default(true),
  advanceBookingDays: integer("advance_booking_days").default(30), // How many days in advance
  minBookingHours: integer("min_booking_hours").default(2), // Minimum hours before reservation
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertRestaurantOwnerSchema = createInsertSchema(restaurantOwners).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginRestaurantOwnerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertVoucherTemplateSchema = createInsertSchema(voucherTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoucherPackageSchema = createInsertSchema(voucherPackages).omit({
  id: true,
  createdAt: true,
});

export const insertEatoffVoucherSchema = createInsertSchema(eatoffVouchers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  validityStartDate: z.string().optional().transform(str => str ? new Date(str) : null),
  validityEndDate: z.string().optional().transform(str => str ? new Date(str) : null),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertPurchasedVoucherSchema = createInsertSchema(purchasedVouchers).omit({
  id: true,
  purchaseDate: true,
});

export const insertVoucherRedemptionSchema = createInsertSchema(voucherRedemptions).omit({
  id: true,
  redemptionDate: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderDate: true,
  completedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertPointsRedemptionSchema = createInsertSchema(pointsRedemptions).omit({
  id: true,
  redemptionDate: true,
});

export const insertUserDietaryProfileSchema = createInsertSchema(userDietaryProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserMealHistorySchema = createInsertSchema(userMealHistory).omit({
  id: true,
  createdAt: true,
});

export const insertPersonalizedRecommendationSchema = createInsertSchema(personalizedRecommendations).omit({
  id: true,
  createdAt: true,
  generatedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginAdminUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertRestaurantFinanceSchema = createInsertSchema(restaurantFinances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformAnalyticsSchema = createInsertSchema(platformAnalytics).omit({
  id: true,
  createdAt: true,
});

// Restaurant enrollment applications table
export const restaurantEnrollments = pgTable("restaurant_enrollments", {
  id: serial("id").primaryKey(),
  restaurantName: text("restaurant_name").notNull(),
  ownerName: text("owner_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  cuisine: text("cuisine").notNull(),
  description: text("description").notNull(),
  website: text("website"),
  businessLicense: text("business_license").notNull(),
  vatNumber: text("vat_number"),
  estimatedMonthlyOrders: text("estimated_monthly_orders").notNull(),
  hasDelivery: boolean("has_delivery").default(false),
  hasPickup: boolean("has_pickup").default(true),
  operatingHours: text("operating_hours").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by"), // admin user ID
  reviewNotes: text("review_notes"),
  termsAccepted: boolean("terms_accepted").default(false),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
});

export const insertRestaurantEnrollmentSchema = createInsertSchema(restaurantEnrollments).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  reviewNotes: true,
  status: true,
});

// Create order schema for menu orders
export const createOrderSchema = z.object({
  restaurantId: z.number(),
  items: z.array(z.object({
    menuItemId: z.number(),
    quantity: z.number().min(1),
    specialRequests: z.string().optional(),
  })),
  customerInfo: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
  }),
  deliveryAddress: z.string().optional(),
  orderType: z.enum(["pickup", "delivery"]),
  specialInstructions: z.string().optional(),
});

// Types
export type RestaurantOwner = typeof restaurantOwners.$inferSelect;
export type InsertRestaurantOwner = z.infer<typeof insertRestaurantOwnerSchema>;
export type LoginRestaurantOwner = z.infer<typeof loginRestaurantOwnerSchema>;

export type VoucherTemplate = typeof voucherTemplates.$inferSelect;
export type InsertVoucherTemplate = z.infer<typeof insertVoucherTemplateSchema>;

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type VoucherPackage = typeof voucherPackages.$inferSelect;
export type InsertVoucherPackage = z.infer<typeof insertVoucherPackageSchema>;

export type EatoffVoucher = typeof eatoffVouchers.$inferSelect;
export type InsertEatoffVoucher = z.infer<typeof insertEatoffVoucherSchema>;

// Deferred payment types
export const insertDeferredPaymentSchema = createInsertSchema(deferredPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  chargedAt: true
});

export type DeferredPayment = typeof deferredPayments.$inferSelect;
export type InsertDeferredPayment = z.infer<typeof insertDeferredPaymentSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type PurchasedVoucher = typeof purchasedVouchers.$inferSelect;
export type InsertPurchasedVoucher = z.infer<typeof insertPurchasedVoucherSchema>;

export type VoucherRedemption = typeof voucherRedemptions.$inferSelect;
export type InsertVoucherRedemption = z.infer<typeof insertVoucherRedemptionSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;

export type PointsRedemption = typeof pointsRedemptions.$inferSelect;
export type InsertPointsRedemption = z.infer<typeof insertPointsRedemptionSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type LoginAdminUser = z.infer<typeof loginAdminUserSchema>;

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;

export type RestaurantFinance = typeof restaurantFinances.$inferSelect;
export type InsertRestaurantFinance = z.infer<typeof insertRestaurantFinanceSchema>;

export type PlatformAnalytics = typeof platformAnalytics.$inferSelect;
export type InsertPlatformAnalytics = z.infer<typeof insertPlatformAnalyticsSchema>;

export type CreateOrder = z.infer<typeof createOrderSchema>;

// Reservation schemas
export const insertTableReservationSchema = createInsertSchema(tableReservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  confirmedAt: true,
  confirmedBy: true,
  customerNotified: true,
  notificationSentAt: true,
}).extend({
  reservationDate: z.string().transform((str) => new Date(str)),
});

export const insertRestaurantAvailabilitySchema = createInsertSchema(restaurantAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TableReservation = typeof tableReservations.$inferSelect;
export type InsertTableReservation = z.infer<typeof insertTableReservationSchema>;

export type RestaurantAvailability = typeof restaurantAvailability.$inferSelect;
export type InsertRestaurantAvailability = z.infer<typeof insertRestaurantAvailabilitySchema>;

// Financial tracking tables for restaurant payments and EatOff commission
export const restaurantFinancials = pgTable("restaurant_financials", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  cashEarned: decimal("cash_earned", { precision: 10, scale: 2 }).default("0.00"),
  pointsEarned: decimal("points_earned", { precision: 10, scale: 2 }).default("0.00"), 
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).notNull(), // e.g., 0.055 for 5.5%
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // amount owed to restaurant
  payoutStatus: varchar("payout_status").default("pending"), // pending, processing, completed
  payoutDate: timestamp("payout_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eatoffDailySummary = pgTable("eatoff_daily_summary", {
  id: serial("id").primaryKey(),
  date: varchar("date").notNull().unique(), // YYYY-MM-DD format
  totalOrders: integer("total_orders").default(0),
  totalCashPaid: decimal("total_cash_paid", { precision: 12, scale: 2 }).default("0.00"),
  totalPointsPaid: decimal("total_points_paid", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 10, scale: 2 }).default("0.00"),
  totalAmountOwedToRestaurants: decimal("total_amount_owed_to_restaurants", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for financial tracking tables
export const insertRestaurantFinancialsSchema = createInsertSchema(restaurantFinancials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEatoffDailySummarySchema = createInsertSchema(eatoffDailySummary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Financial tracking types
export type RestaurantFinancials = typeof restaurantFinancials.$inferSelect;
export type InsertRestaurantFinancials = z.infer<typeof insertRestaurantFinancialsSchema>;

export type EatoffDailySummary = typeof eatoffDailySummary.$inferSelect;
export type InsertEatoffDailySummary = z.infer<typeof insertEatoffDailySummarySchema>;

// Loyalty categories for restaurant fidelity programs
export const loyaltyCategories = pgTable("loyalty_categories", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(), // Bronze, Silver, Gold, Platinum, VIP, etc.
  description: text("description"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(), // Discount for this tier
  minVisits: integer("min_visits").default(0), // Minimum visits to reach this tier
  minSpend: decimal("min_spend", { precision: 10, scale: 2 }).default("0.00"), // Minimum total spend to reach this tier
  color: text("color").default("#808080"), // Display color for the tier
  icon: text("icon"), // Optional icon name
  sortOrder: integer("sort_order").default(0), // Order in which tiers are displayed
  isDefault: boolean("is_default").default(false), // Default tier for new loyal customers
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyal customers - relationship between customers and restaurants
export const loyalCustomers = pgTable("loyal_customers", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  categoryId: integer("category_id").references(() => loyaltyCategories.id),
  customerCode: text("customer_code").notNull(), // Customer's unique code used for enrollment
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  totalVisits: integer("total_visits").default(0),
  totalSpend: decimal("total_spend", { precision: 10, scale: 2 }).default("0.00"),
  lastVisitAt: timestamp("last_visit_at"),
  notes: text("notes"), // Restaurant notes about this customer
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment requests initiated by restaurants
export const paymentRequests = pgTable("payment_requests", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"), // What the payment is for
  
  // Status flow: pending -> confirmed/rejected/expired
  status: text("status").notNull().default("pending"), // pending, confirmed, rejected, expired, completed
  
  // Customer's scanned code
  customerCode: text("customer_code").notNull(),
  
  // Loyalty discount applied
  loyaltyDiscountApplied: decimal("loyalty_discount_applied", { precision: 10, scale: 2 }).default("0.00"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(), // After discount
  
  // Payment details
  paymentMethod: text("payment_method"), // wallet, card, points
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  
  // Timestamps
  expiresAt: timestamp("expires_at").notNull(), // Request expires after X minutes
  confirmedAt: timestamp("confirmed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer favorites - restaurants marked as favorite by customers
export const customerFavorites = pgTable("customer_favorites", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer reviews - ratings and reviews for restaurants
export const customerReviews = pgTable("customer_reviews", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerFavoriteSchema = createInsertSchema(customerFavorites).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerReviewSchema = createInsertSchema(customerReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomerFavorite = typeof customerFavorites.$inferSelect;
export type InsertCustomerFavorite = z.infer<typeof insertCustomerFavoriteSchema>;

export type CustomerReview = typeof customerReviews.$inferSelect;
export type InsertCustomerReview = z.infer<typeof insertCustomerReviewSchema>;

// Insert schemas for loyalty and payment tables
export const insertLoyaltyCategorySchema = createInsertSchema(loyaltyCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyalCustomerSchema = createInsertSchema(loyalCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  enrolledAt: true,
});

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  confirmedAt: true,
  completedAt: true,
});

// Loyalty and payment types
export type LoyaltyCategory = typeof loyaltyCategories.$inferSelect;
export type InsertLoyaltyCategory = z.infer<typeof insertLoyaltyCategorySchema>;

export type LoyalCustomer = typeof loyalCustomers.$inferSelect;
export type InsertLoyalCustomer = z.infer<typeof insertLoyalCustomerSchema>;

export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;

// =============================================
// AI Support System Tables
// =============================================

// Support conversations (chat sessions)
export const supportConversations = pgTable("support_conversations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Conversation metadata
  title: text("title"), // Auto-generated from first message
  status: text("status").notNull().default("active"), // active, resolved, escalated
  channel: text("channel").notNull().default("chat"), // chat, email, in_app
  
  // AI handling
  isHandledByAI: boolean("is_handled_by_ai").default(true),
  aiConfidenceScore: decimal("ai_confidence_score", { precision: 3, scale: 2 }), // 0-1 score
  
  // Escalation tracking
  escalatedAt: timestamp("escalated_at"),
  escalationReason: text("escalation_reason"),
  assignedAgentId: integer("assigned_agent_id").references(() => eatoffAdmins.id),
  
  // Timestamps
  lastMessageAt: timestamp("last_message_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support messages within conversations
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => supportConversations.id, { onDelete: "cascade" }).notNull(),
  
  // Message content
  role: text("role").notNull(), // user, assistant, system, agent
  content: text("content").notNull(),
  
  // AI metadata
  ragSourceIds: text("rag_source_ids").array(), // Knowledge base articles used
  aiModelVersion: text("ai_model_version"),
  
  // Attachments
  attachmentUrls: text("attachment_urls").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Support tickets for escalated issues
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => supportConversations.id),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Ticket details
  ticketNumber: varchar("ticket_number", { length: 20 }).unique().notNull(), // e.g., "TKT-2024-00001"
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // payment, refund, voucher, technical, account, other
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  
  // Status tracking
  status: text("status").notNull().default("open"), // open, in_progress, waiting_customer, resolved, closed
  
  // Assignment
  assignedAgentId: integer("assigned_agent_id").references(() => eatoffAdmins.id),
  assignedAt: timestamp("assigned_at"),
  
  // Resolution
  resolution: text("resolution"),
  resolvedBy: integer("resolved_by").references(() => eatoffAdmins.id),
  resolvedAt: timestamp("resolved_at"),
  
  // Customer satisfaction
  csatRating: integer("csat_rating"), // 1-5 rating
  csatFeedback: text("csat_feedback"),
  
  // Context bundle (stored as JSON for AI processing)
  supportBundle: jsonb("support_bundle"), // Contains user data, vouchers, transactions, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge base for RAG
export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  
  // Content
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // faq, policy, feature, troubleshooting
  subcategory: text("subcategory"),
  
  // Search and RAG
  keywords: text("keywords").array(),
  
  // Visibility
  isPublic: boolean("is_public").default(true), // Visible in Help Center
  isActiveForAI: boolean("is_active_for_ai").default(true), // Used by AI agent
  
  // Metrics
  viewCount: integer("view_count").default(0),
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),
  
  // Management
  createdBy: integer("created_by").references(() => eatoffAdmins.id),
  lastUpdatedBy: integer("last_updated_by").references(() => eatoffAdmins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support analytics for tracking AI performance
export const supportAnalytics = pgTable("support_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  
  // Volume metrics
  totalConversations: integer("total_conversations").default(0),
  aiHandledConversations: integer("ai_handled_conversations").default(0),
  escalatedConversations: integer("escalated_conversations").default(0),
  
  // Resolution metrics
  avgResolutionTimeMinutes: integer("avg_resolution_time_minutes").default(0),
  firstContactResolutionRate: decimal("first_contact_resolution_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  // Satisfaction
  avgCsatScore: decimal("avg_csat_score", { precision: 3, scale: 2 }).default("0.00"),
  totalCsatResponses: integer("total_csat_responses").default(0),
  
  // AI performance
  deflectionRate: decimal("deflection_rate", { precision: 5, scale: 2 }).default("0.00"), // % resolved without human
  avgAiConfidence: decimal("avg_ai_confidence", { precision: 3, scale: 2 }).default("0.00"),
  
  // Top categories
  topCategories: jsonb("top_categories"), // { category: count }
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for support tables
export const insertSupportConversationSchema = createInsertSchema(supportConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
  escalatedAt: true,
  resolvedAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedAt: true,
  resolvedAt: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  helpfulCount: true,
  notHelpfulCount: true,
});

// Type exports for support system
export type SupportConversation = typeof supportConversations.$inferSelect;
export type InsertSupportConversation = z.infer<typeof insertSupportConversationSchema>;

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type KnowledgeBaseArticle = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseArticle = z.infer<typeof insertKnowledgeBaseSchema>;

export type SupportAnalytics = typeof supportAnalytics.$inferSelect;

// Recipe Sharing System
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  
  // Author info
  authorId: integer("author_id").references(() => customers.id).notNull(),
  
  // Restaurant association (optional - user can tag which restaurant inspired this)
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  
  // Recipe details
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  
  // Cooking info
  prepTimeMinutes: integer("prep_time_minutes"),
  cookTimeMinutes: integer("cook_time_minutes"),
  servings: integer("servings"),
  difficulty: varchar("difficulty"), // easy, medium, hard
  
  // Ingredients and instructions stored as JSON arrays
  ingredients: jsonb("ingredients").notNull(), // [{name, amount, unit}]
  instructions: jsonb("instructions").notNull(), // [{step, description}]
  
  // Categorization
  cuisine: varchar("cuisine"), // italian, mexican, etc.
  category: varchar("category"), // appetizer, main, dessert, etc.
  dietaryTags: text("dietary_tags").array(), // vegetarian, vegan, gluten-free, etc.
  
  // Engagement metrics
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  savesCount: integer("saves_count").default(0),
  viewsCount: integer("views_count").default(0),
  
  // Status
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipeLikes = pgTable("recipe_likes", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  userId: integer("user_id").references(() => customers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipeSaves = pgTable("recipe_saves", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  userId: integer("user_id").references(() => customers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipeComments = pgTable("recipe_comments", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  userId: integer("user_id").references(() => customers.id).notNull(),
  content: text("content").notNull(),
  parentCommentId: integer("parent_comment_id"), // For replies
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for recipe tables
export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  likesCount: true,
  commentsCount: true,
  savesCount: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeLikeSchema = createInsertSchema(recipeLikes).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeSaveSchema = createInsertSchema(recipeSaves).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeCommentSchema = createInsertSchema(recipeComments).omit({
  id: true,
  likesCount: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for recipe system
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type RecipeLike = typeof recipeLikes.$inferSelect;
export type InsertRecipeLike = z.infer<typeof insertRecipeLikeSchema>;

export type RecipeSave = typeof recipeSaves.$inferSelect;
export type InsertRecipeSave = z.infer<typeof insertRecipeSaveSchema>;

export type RecipeComment = typeof recipeComments.$inferSelect;
export type InsertRecipeComment = z.infer<typeof insertRecipeCommentSchema>;

// ============================================
// CHEF'S PROFILE SYSTEM
// ============================================

export const chefProfiles = pgTable("chef_profiles", {
  id: serial("id").primaryKey(),
  
  // Restaurant association - chef belongs to a restaurant (required)
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  
  // Optional customer link (if chef is also a registered customer)
  customerId: integer("customer_id").references(() => customers.id).unique(),
  
  // Chef Info
  chefName: text("chef_name").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  coverImage: text("cover_image"),
  
  // Professional Title (Head Chef, Sous Chef, Pastry Chef, etc.)
  title: text("title"),
  
  // Expertise
  specialties: text("specialties").array(), // ["Italian", "French", "Pastry", "Grilling"]
  cuisineExpertise: text("cuisine_expertise").array(), // ["Mediterranean", "Asian", "Mexican"]
  cookingStyles: text("cooking_styles").array(), // ["Traditional", "Modern", "Fusion", "Healthy"]
  
  // Experience
  experienceLevel: varchar("experience_level"), // beginner, intermediate, advanced, professional
  yearsOfExperience: integer("years_of_experience"),
  certifications: text("certifications").array(), // ["Le Cordon Bleu", "Culinary Institute"]
  
  // Social links
  website: text("website"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  facebook: text("facebook"),
  
  // Favorite recipes (curated list)
  favoriteRecipeIds: integer("favorite_recipe_ids").array(),
  
  // Stats
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  recipesCount: integer("recipes_count").default(0),
  totalLikesReceived: integer("total_likes_received").default(0),
  
  // Featured & Settings
  isFeatured: boolean("is_featured").default(false), // Featured on home page
  isPublic: boolean("is_public").default(true),
  acceptsCollaborations: boolean("accepts_collaborations").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chef follows (users following chefs)
export const chefFollows = pgTable("chef_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => customers.id).notNull(),
  chefId: integer("chef_id").references(() => chefProfiles.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChefProfileSchema = createInsertSchema(chefProfiles).omit({
  id: true,
  followersCount: true,
  followingCount: true,
  recipesCount: true,
  totalLikesReceived: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChefFollowSchema = createInsertSchema(chefFollows).omit({
  id: true,
  createdAt: true,
});

export type ChefProfile = typeof chefProfiles.$inferSelect;
export type InsertChefProfile = z.infer<typeof insertChefProfileSchema>;
export type ChefFollow = typeof chefFollows.$inferSelect;
export type InsertChefFollow = z.infer<typeof insertChefFollowSchema>;

// ============================================
// CASHBACK & LOYALTY SYSTEM
// ============================================

// Cashback groups - can be created by EatOff or restaurants
export const cashbackGroups = pgTable("cashback_groups", {
  id: serial("id").primaryKey(),
  
  // Ownership - either EatOff (null restaurantId) or specific restaurant
  restaurantId: integer("restaurant_id").references(() => restaurants.id), // null = EatOff group
  
  // Group details
  name: text("name").notNull(),
  description: text("description"),
  cashbackPercentage: decimal("cashback_percentage", { precision: 5, scale: 2 }).notNull(), // e.g., 3.00, 5.00
  
  // Eligibility criteria
  minSpendToJoin: decimal("min_spend_to_join", { precision: 10, scale: 2 }).default("0.00"), // minimum total spend to be eligible
  minOrdersToJoin: integer("min_orders_to_join").default(0), // minimum orders to be eligible
  
  // Status
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // higher priority = preferred group if customer qualifies for multiple
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer enrollment in cashback groups
export const customerCashbackEnrollments = pgTable("customer_cashback_enrollments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  groupId: integer("group_id").references(() => cashbackGroups.id).notNull(),
  
  // Enrollment details
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  enrolledBy: varchar("enrolled_by"), // "self", "restaurant_scan", "eatoff_admin", "auto_upgrade"
  enrolledByUserId: integer("enrolled_by_user_id"), // restaurant owner or admin who enrolled
  
  // Tracking
  totalCashbackEarned: decimal("total_cashback_earned", { precision: 10, scale: 2 }).default("0.00"),
  totalSpendInGroup: decimal("total_spend_in_group", { precision: 10, scale: 2 }).default("0.00"),
  
  // Status
  isActive: boolean("is_active").default(true),
  deactivatedAt: timestamp("deactivated_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer cashback balance tracking
export const customerCashbackBalance = pgTable("customer_cashback_balance", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Separate balances for EatOff and per-restaurant
  eatoffCashbackBalance: decimal("eatoff_cashback_balance", { precision: 10, scale: 2 }).default("0.00"),
  
  // Total across all sources
  totalCashbackBalance: decimal("total_cashback_balance", { precision: 10, scale: 2 }).default("0.00"),
  totalCashbackEarned: decimal("total_cashback_earned", { precision: 10, scale: 2 }).default("0.00"),
  totalCashbackUsed: decimal("total_cashback_used", { precision: 10, scale: 2 }).default("0.00"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Per-restaurant cashback balance (for restaurant-specific cashback)
export const customerRestaurantCashback = pgTable("customer_restaurant_cashback", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  
  cashbackBalance: decimal("cashback_balance", { precision: 10, scale: 2 }).default("0.00"),
  totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).default("0.00"),
  totalUsed: decimal("total_used", { precision: 10, scale: 2 }).default("0.00"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"), // for tier calculation
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cashback transactions log
export const cashbackTransactions = pgTable("cashback_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  groupId: integer("group_id").references(() => cashbackGroups.id),
  restaurantId: integer("restaurant_id").references(() => restaurants.id), // null = EatOff cashback
  
  // Transaction details
  transactionType: varchar("transaction_type").notNull(), // "earned", "used", "expired", "adjustment"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  // Source transaction (what generated this cashback)
  sourceOrderId: integer("source_order_id").references(() => orders.id),
  sourceAmount: decimal("source_amount", { precision: 10, scale: 2 }), // order amount that generated cashback
  
  // Balance after transaction
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// CREDIT ON ACCOUNT SYSTEM
// ============================================

// Predefined credit types (amounts) that customers can request
export const creditTypes = pgTable("credit_types", {
  id: serial("id").primaryKey(),
  
  // Credit type details
  name: varchar("name").notNull(), // e.g., "Credit Starter", "Credit Plus"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // e.g., 1000.00, 2000.00
  description: text("description"), // optional description
  
  // Interest and terms
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).default("0.00"), // annual interest rate %
  paymentTermDays: integer("payment_term_days").default(30), // days to repay
  
  // Display settings
  displayOrder: integer("display_order").default(0), // for ordering in UI
  isCustomAmount: boolean("is_custom_amount").default(false), // true for "custom amount" option
  minCustomAmount: decimal("min_custom_amount", { precision: 10, scale: 2 }), // min for custom
  maxCustomAmount: decimal("max_custom_amount", { precision: 10, scale: 2 }), // max for custom
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit on account - only EatOff can issue
export const customerCreditAccount = pgTable("customer_credit_account", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  // Credit limits and balances
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default("0.00"), // approved credit limit
  availableCredit: decimal("available_credit", { precision: 10, scale: 2 }).default("0.00"),
  usedCredit: decimal("used_credit", { precision: 10, scale: 2 }).default("0.00"),
  
  // Default display limit (shown before approval)
  defaultDisplayLimit: decimal("default_display_limit", { precision: 10, scale: 2 }).default("1000.00"),
  
  // Status
  status: varchar("status").notNull().default("not_requested"), // not_requested, pending, approved, rejected, suspended
  
  // Selected credit type
  creditTypeId: integer("credit_type_id").references(() => creditTypes.id),
  
  // Personal data for credit application (required for Romania - CNP)
  fullName: varchar("full_name"),
  cnp: varchar("cnp", { length: 13 }), // Romanian CNP - 13 digits
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"), // full address including city, county, postal code
  city: varchar("city"),
  county: varchar("county"),
  postalCode: varchar("postal_code"),
  
  // Employment info (optional for credit scoring)
  employmentStatus: varchar("employment_status"), // employed, self-employed, student, retired, other
  monthlyIncome: decimal("monthly_income", { precision: 10, scale: 2 }),
  employer: varchar("employer"),
  
  // Approval details
  requestedAt: timestamp("requested_at"),
  requestedAmount: decimal("requested_amount", { precision: 10, scale: 2 }),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by"), // admin user id
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Terms (copied from credit type at approval time)
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).default("0.00"), // annual interest rate %
  paymentTermDays: integer("payment_term_days").default(30), // days to repay
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit usage transactions
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  creditAccountId: integer("credit_account_id").references(() => customerCreditAccount.id).notNull(),
  
  // Transaction details
  transactionType: varchar("transaction_type").notNull(), // "usage", "repayment", "interest", "adjustment"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  // For usage: what was purchased
  orderId: integer("order_id").references(() => orders.id),
  voucherId: integer("voucher_id").references(() => eatoffVouchers.id),
  
  // For repayment
  paymentMethod: varchar("payment_method"), // card, bank_transfer, wallet
  paymentReference: varchar("payment_reference"),
  
  // Due date for this usage
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  
  // Balance tracking
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// RESTAURANT LOYALTY/FIDELITY GROUPS
// ============================================

// Restaurant loyalty groups with discount tiers (different from cashback)
export const loyaltyGroups = pgTable("loyalty_groups", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  
  // Group details
  name: text("name").notNull(),
  description: text("description"),
  
  // Discount settings
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(), // e.g., 10.00 for 10%
  
  // Tier thresholds
  minSpendThreshold: decimal("min_spend_threshold", { precision: 10, scale: 2 }).default("0.00"), // minimum spend to be in this tier
  maxSpendThreshold: decimal("max_spend_threshold", { precision: 10, scale: 2 }), // null = no max (top tier)
  
  // Auto-upgrade settings
  autoUpgradeEnabled: boolean("auto_upgrade_enabled").default(true),
  upgradeToGroupId: integer("upgrade_to_group_id"), // which group to upgrade to when max is exceeded
  
  // Display order (for showing tiers in order)
  tierLevel: integer("tier_level").default(1), // 1 = lowest tier, higher = better
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer enrollment in loyalty groups
export const customerLoyaltyEnrollments = pgTable("customer_loyalty_enrollments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  groupId: integer("group_id").references(() => loyaltyGroups.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  
  // Enrollment details
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  enrolledBy: varchar("enrolled_by"), // "restaurant_scan", "auto_upgrade", "manual"
  enrolledByUserId: integer("enrolled_by_user_id"),
  
  // Progress tracking
  totalSpentAtRestaurant: decimal("total_spent_at_restaurant", { precision: 10, scale: 2 }).default("0.00"),
  totalDiscountReceived: decimal("total_discount_received", { precision: 10, scale: 2 }).default("0.00"),
  orderCount: integer("order_count").default(0),
  
  // Status
  isActive: boolean("is_active").default(true),
  upgradedFromGroupId: integer("upgraded_from_group_id"), // if auto-upgraded, previous group
  upgradedAt: timestamp("upgraded_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// INSERT SCHEMAS FOR NEW TABLES
// ============================================

export const insertCashbackGroupSchema = createInsertSchema(cashbackGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerCashbackEnrollmentSchema = createInsertSchema(customerCashbackEnrollments).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerCashbackBalanceSchema = createInsertSchema(customerCashbackBalance).omit({
  id: true,
  updatedAt: true,
});

export const insertCustomerRestaurantCashbackSchema = createInsertSchema(customerRestaurantCashback).omit({
  id: true,
  updatedAt: true,
});

export const insertCashbackTransactionSchema = createInsertSchema(cashbackTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertCreditTypeSchema = createInsertSchema(creditTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerCreditAccountSchema = createInsertSchema(customerCreditAccount).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyGroupSchema = createInsertSchema(loyaltyGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerLoyaltyEnrollmentSchema = createInsertSchema(customerLoyaltyEnrollments).omit({
  id: true,
  createdAt: true,
});

// ============================================
// TYPE EXPORTS FOR NEW TABLES
// ============================================

export type CashbackGroup = typeof cashbackGroups.$inferSelect;
export type InsertCashbackGroup = z.infer<typeof insertCashbackGroupSchema>;

export type CustomerCashbackEnrollment = typeof customerCashbackEnrollments.$inferSelect;
export type InsertCustomerCashbackEnrollment = z.infer<typeof insertCustomerCashbackEnrollmentSchema>;

export type CustomerCashbackBalance = typeof customerCashbackBalance.$inferSelect;
export type InsertCustomerCashbackBalance = z.infer<typeof insertCustomerCashbackBalanceSchema>;

export type CustomerRestaurantCashback = typeof customerRestaurantCashback.$inferSelect;
export type InsertCustomerRestaurantCashback = z.infer<typeof insertCustomerRestaurantCashbackSchema>;

export type CashbackTransaction = typeof cashbackTransactions.$inferSelect;
export type InsertCashbackTransaction = z.infer<typeof insertCashbackTransactionSchema>;

export type CreditType = typeof creditTypes.$inferSelect;
export type InsertCreditType = z.infer<typeof insertCreditTypeSchema>;

export type CustomerCreditAccount = typeof customerCreditAccount.$inferSelect;
export type InsertCustomerCreditAccount = z.infer<typeof insertCustomerCreditAccountSchema>;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

export type LoyaltyGroup = typeof loyaltyGroups.$inferSelect;
export type InsertLoyaltyGroup = z.infer<typeof insertLoyaltyGroupSchema>;

export type CustomerLoyaltyEnrollment = typeof customerLoyaltyEnrollments.$inferSelect;
export type InsertCustomerLoyaltyEnrollment = z.infer<typeof insertCustomerLoyaltyEnrollmentSchema>;

// ============================================
// MOBILE FILTERS (Dynamic filters for mobile home)
// ============================================

export const mobileFilters = pgTable("mobile_filters", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Display name (e.g., "Pizza", "Burger")
  icon: varchar("icon", { length: 50 }).notNull(), // Emoji or lucide icon name
  filterType: varchar("filter_type", { length: 50 }).notNull(), // cuisine, mainProduct, dietCategory, conceptType, experienceType, deals
  filterValues: text("filter_values").array().notNull(), // Array of values to match
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMobileFilterSchema = createInsertSchema(mobileFilters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MobileFilter = typeof mobileFilters.$inferSelect;
export type InsertMobileFilter = z.infer<typeof insertMobileFilterSchema>;

// ============================================
// EATOFF LOYALTY TIERS PER MARKETPLACE (Bronze, Silver, Gold, Platinum, Black)
// Each marketplace has its own tiers with thresholds in local currency
// ============================================

export const eatoffLoyaltyTiers = pgTable("eatoff_loyalty_tiers", {
  id: serial("id").primaryKey(),
  marketplaceId: integer("marketplace_id").references(() => marketplaces.id), // null = global default, specific marketplace overrides
  name: varchar("name", { length: 50 }).notNull(), // Bronze, Silver, Gold, Platinum, Black (unique per marketplace)
  displayName: varchar("display_name", { length: 100 }).notNull(),
  cashbackPercentage: decimal("cashback_percentage", { precision: 5, scale: 2 }).notNull(), // e.g., 2.00 for 2%
  minTransactionVolume: decimal("min_transaction_volume", { precision: 12, scale: 2 }).notNull(), // In marketplace currency
  maxTransactionVolume: decimal("max_transaction_volume", { precision: 12, scale: 2 }), // null = no max (top tier)
  color: varchar("color", { length: 20 }).default("#808080"), // Display color
  icon: varchar("icon", { length: 50 }), // Emoji or icon
  tierLevel: integer("tier_level").notNull(), // 1 = Bronze (lowest), 5 = Black (highest)
  benefits: text("benefits").array(), // Array of benefit descriptions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEatoffLoyaltyTierSchema = createInsertSchema(eatoffLoyaltyTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EatoffLoyaltyTier = typeof eatoffLoyaltyTiers.$inferSelect;
export type InsertEatoffLoyaltyTier = z.infer<typeof insertEatoffLoyaltyTierSchema>;

// ============================================
// RESTAURANT SETTLEMENTS (Weekly payouts to restaurants)
// ============================================

export const restaurantSettlements = pgTable("restaurant_settlements", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  
  // Settlement period (Friday to Friday)
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Financial details
  grossAmount: decimal("gross_amount", { precision: 12, scale: 2 }).notNull(), // Total transaction value
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(), // EatOff commission
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // Rate used for this settlement
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(), // Amount to pay restaurant
  transactionCount: integer("transaction_count").notNull(),
  
  // Status tracking
  status: varchar("status", { length: 30 }).default("pending"), // pending, processing, paid, failed
  
  // Payment details
  paymentMethod: varchar("payment_method", { length: 30 }), // stripe_connect, bank_transfer, manual
  paymentReference: varchar("payment_reference", { length: 100 }), // Stripe payout ID or bank reference
  paidAt: timestamp("paid_at"),
  paidBy: integer("paid_by"), // Admin user who processed payment
  
  // PDF invoice
  invoicePdfUrl: text("invoice_pdf_url"),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  invoiceSentAt: timestamp("invoice_sent_at"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRestaurantSettlementSchema = createInsertSchema(restaurantSettlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RestaurantSettlement = typeof restaurantSettlements.$inferSelect;
export type InsertRestaurantSettlement = z.infer<typeof insertRestaurantSettlementSchema>;

// ============================================
// USER WALLET ADJUSTMENTS (Manual adjustments by admin)
// ============================================

export const walletAdjustments = pgTable("wallet_adjustments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  
  adjustmentType: varchar("adjustment_type", { length: 30 }).notNull(), // credit, debit, bonus, correction
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  
  reason: text("reason").notNull(), // Required reason for audit
  adminId: integer("admin_id"), // Admin who made the adjustment
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWalletAdjustmentSchema = createInsertSchema(walletAdjustments).omit({
  id: true,
  createdAt: true,
});

export type WalletAdjustment = typeof walletAdjustments.$inferSelect;
export type InsertWalletAdjustment = z.infer<typeof insertWalletAdjustmentSchema>;

export const marketingDeals = pgTable("marketing_deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  discountText: text("discount_text").notNull(),
  emoji: text("emoji").default("🎉"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  marketplaceId: integer("marketplace_id").references(() => marketplaces.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketingDealSchema = createInsertSchema(marketingDeals).omit({
  id: true,
  createdAt: true,
});

export type MarketingDeal = typeof marketingDeals.$inferSelect;
export type InsertMarketingDeal = z.infer<typeof insertMarketingDealSchema>;

export const marketingDealRestaurants = pgTable("marketing_deal_restaurants", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => marketingDeals.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
});

export const insertMarketingDealRestaurantSchema = createInsertSchema(marketingDealRestaurants).omit({
  id: true,
});

export type MarketingDealRestaurant = typeof marketingDealRestaurants.$inferSelect;
export type InsertMarketingDealRestaurant = z.infer<typeof insertMarketingDealRestaurantSchema>;
