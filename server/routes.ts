import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import Stripe from "stripe";
import { storage } from "./storage";
import restaurantRoutes from "./restaurantRoutes";
import { registerOrderRoutes } from "./orderRoutes";
import { registerAdminRoutes } from "./adminRoutes";
import { pointsRoutes } from "./pointsRoutes";
import { registerUserAuthRoutes } from "./userAuth";
import { registerDietaryRoutes } from "./dietaryRoutes";
import { walletRoutes } from "./walletRoutes";
import { registerReservationRoutes } from "./reservationRoutes";
import orderCreationRoutes from "./orderCreationRoutes";
import { loyaltyRoutes } from "./loyaltyRoutes";
import { insertVoucherPackageSchema, insertPurchasedVoucherSchema, insertUserAddressSchema, insertRestaurantEnrollmentSchema, restaurantEnrollments } from "@shared/schema";
import { nanoid } from "nanoid";
import { setupMultiAuth, isAuthenticated } from "./multiAuth";
import { getAIAssistantResponse, getRestaurantRecommendations, explainVoucherPackage } from "./aiAssistant";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const qr = require("qr-image");
import { db } from "./db";
import { sql } from "drizzle-orm";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Initialize Stripe only if the secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
}

// Financial tracking functions for restaurant payments and EatOff commission
export async function updateRestaurantFinancials(restaurantId: number, amount: number, paymentType: 'cash' | 'points') {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const commissionRate = 0.0550; // 5.5% commission rate formatted for numeric(5,4)
  const commissionAmount = Math.round(amount * commissionRate * 100) / 100; // Round to 2 decimal places
  const netAmount = Math.round((amount - commissionAmount) * 100) / 100; // Round to 2 decimal places
  
  console.log(`Financial update: restaurant=${restaurantId}, amount=${amount}, type=${paymentType}`);
  console.log(`Calculated: rate=${commissionRate}, commission=${commissionAmount}, net=${netAmount}`);

  try {
    if (paymentType === 'points') {
      await db.execute(sql`
        INSERT INTO restaurant_financials (restaurant_id, date, points_earned, commission_rate, commission_amount, net_amount)
        VALUES (${restaurantId}, ${today}, ${amount}, ${commissionRate}, ${commissionAmount}, ${netAmount})
        ON CONFLICT (restaurant_id, date) 
        DO UPDATE SET 
          points_earned = restaurant_financials.points_earned + ${amount},
          commission_amount = restaurant_financials.commission_amount + ${commissionAmount},
          net_amount = restaurant_financials.net_amount + ${netAmount}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO restaurant_financials (restaurant_id, date, cash_earned, commission_rate, commission_amount, net_amount)
        VALUES (${restaurantId}, ${today}, ${amount}, ${commissionRate}, ${commissionAmount}, ${netAmount})
        ON CONFLICT (restaurant_id, date) 
        DO UPDATE SET 
          cash_earned = restaurant_financials.cash_earned + ${amount},
          commission_amount = restaurant_financials.commission_amount + ${commissionAmount},
          net_amount = restaurant_financials.net_amount + ${netAmount}
      `);
    }
  } catch (error) {
    console.error('Error updating restaurant financials:', error);
  }
}

export async function updateEatOffDailySummary(date: Date, amount: number, paymentType: 'cash' | 'points') {
  const dateStr = date.toISOString().split('T')[0];
  const commissionEarned = Math.round(amount * 0.0550 * 100) / 100; // 5.5% commission, rounded to 2 decimal places
  const amountOwedToRestaurant = Math.round((amount - commissionEarned) * 100) / 100; // Rounded to 2 decimal places

  try {
    if (paymentType === 'points') {
      await db.execute(sql`
        INSERT INTO eatoff_daily_summary (date, total_orders, total_points_paid, total_commission_earned, total_amount_owed_to_restaurants)
        VALUES (${dateStr}, 1, ${amount}, ${commissionEarned}, ${amountOwedToRestaurant})
        ON CONFLICT (date) 
        DO UPDATE SET 
          total_orders = eatoff_daily_summary.total_orders + 1,
          total_points_paid = eatoff_daily_summary.total_points_paid + ${amount},
          total_commission_earned = eatoff_daily_summary.total_commission_earned + ${commissionEarned},
          total_amount_owed_to_restaurants = eatoff_daily_summary.total_amount_owed_to_restaurants + ${amountOwedToRestaurant}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO eatoff_daily_summary (date, total_orders, total_cash_paid, total_commission_earned, total_amount_owed_to_restaurants)
        VALUES (${dateStr}, 1, ${amount}, ${commissionEarned}, ${amountOwedToRestaurant})
        ON CONFLICT (date) 
        DO UPDATE SET 
          total_orders = eatoff_daily_summary.total_orders + 1,
          total_cash_paid = eatoff_daily_summary.total_cash_paid + ${amount},
          total_commission_earned = eatoff_daily_summary.total_commission_earned + ${commissionEarned},
          total_amount_owed_to_restaurants = eatoff_daily_summary.total_amount_owed_to_restaurants + ${amountOwedToRestaurant}
      `);
    }
  } catch (error) {
    console.error('Error updating EatOff daily summary:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup session middleware first
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const MemStore = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    store: new MemStore({
      checkPeriod: sessionTtl
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false, // Allow frontend access
      secure: false, // Set to false for development
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
    name: 'eatoff.sid',
  }));
  
  // Register user authentication routes AFTER session setup
  registerUserAuthRoutes(app);
  
  // Setup OAuth routes (without conflicting session)
  await setupMultiAuth(app);

  // Auth routes handled by userAuth.ts

  // Restaurant portal routes
  app.use('/api/restaurant-portal', restaurantRoutes);

  // Admin management routes
  registerAdminRoutes(app);

  // Points system routes
  app.use('/api', pointsRoutes);

  // Wallet system routes
  app.use('/api', walletRoutes);

  // Loyalty system routes
  app.use('/api/loyalty', loyaltyRoutes);

  // Dietary recommendation routes
  registerDietaryRoutes(app);

  // Register order routes
  registerOrderRoutes(app);

  // Register order creation routes
  app.use('/', orderCreationRoutes);

  // Register reservation routes
  registerReservationRoutes(app);

  // Basic wallet endpoints
  app.get("/api/customers/:id/wallet", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await storage.getCustomerById(customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get active vouchers
      const vouchers = await storage.getPurchasedVouchersByCustomer(customerId);
      const activeVouchers = vouchers.filter(v => v.status === "active");

      // Mock general vouchers for now
      const generalVouchers: any[] = [];

      // Mock transactions
      const transactions = [
        {
          id: 1,
          customerId,
          transactionType: "deposit",
          amount: "50.00",
          description: "Wallet top-up",
          balanceBefore: "0.00",
          balanceAfter: "50.00",
          createdAt: new Date().toISOString()
        }
      ];

      const totalVoucherValue = activeVouchers.reduce((sum, voucher) => {
        const remainingMeals = voucher.totalMeals - (voucher.usedMeals || 0);
        const mealValue = parseFloat(voucher.purchasePrice) / voucher.totalMeals;
        return sum + (remainingMeals * mealValue);
      }, 0);

      const estimatedValue = parseFloat(customer.balance || "0") + 
                           (customer.loyaltyPoints || 0) / 100 + 
                           totalVoucherValue;

      res.json({
        wallet: {
          id: 1,
          customerId,
          cashBalance: customer.balance || "0.00",
          loyaltyPoints: customer.loyaltyPoints || 0,
          totalPointsEarned: customer.totalPointsEarned || 0,
          isActive: true
        },
        vouchers: activeVouchers,
        generalVouchers,
        transactions,
        summary: {
          totalCashBalance: customer.balance || "0.00",
          totalLoyaltyPoints: customer.loyaltyPoints || 0,
          totalVouchers: activeVouchers.length,
          totalGeneralVouchers: 0,
          estimatedValue: estimatedValue.toFixed(2)
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching wallet: " + error.message });
    }
  });

  // Add cash to wallet
  app.post("/api/customers/:id/wallet/add-cash", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const customer = await storage.getCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const currentBalance = parseFloat(customer.balance || "0");
      const newBalance = currentBalance + parseFloat(amount);

      const updatedCustomer = await storage.updateCustomer(customerId, {
        balance: newBalance.toFixed(2)
      });

      res.json({
        success: true,
        previousBalance: currentBalance.toFixed(2),
        newBalance: newBalance.toFixed(2),
        amountAdded: amount,
        wallet: {
          id: 1,
          customerId,
          cashBalance: newBalance.toFixed(2),
          loyaltyPoints: customer.loyaltyPoints || 0,
          totalPointsEarned: customer.totalPointsEarned || 0,
          isActive: true
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error adding cash to wallet: " + error.message });
    }
  });

  // Get sample general vouchers
  app.get("/api/general-vouchers", async (req, res) => {
    try {
      const sampleVouchers = [
        {
          id: 1,
          name: "Universal 10% Off",
          description: "Get 10% off at any participating restaurant",
          voucherType: "percentage",
          discountValue: "10.00",
          price: "5.00",
          originalValue: "10.00",
          savingsPercentage: "50.00",
          validityDays: 90,
          isActive: true,
          stockQuantity: 100,
          soldQuantity: 15
        },
        {
          id: 2,
          name: "€15 Dining Credit",
          description: "€15 credit towards any meal over €30",
          voucherType: "fixed_amount",
          discountValue: "15.00",
          price: "12.00",
          originalValue: "15.00",
          savingsPercentage: "20.00",
          validityDays: 60,
          isActive: true,
          stockQuantity: 50,
          soldQuantity: 8
        },
        {
          id: 3,
          name: "Weekend Special",
          description: "Buy one entrée, get one 50% off on weekends",
          voucherType: "buy_one_get_one",
          discountValue: "50.00",
          price: "8.00",
          originalValue: "15.00",
          savingsPercentage: "46.67",
          validityDays: 30,
          isActive: true,
          stockQuantity: 75,
          soldQuantity: 22
        }
      ];

      res.json(sampleVouchers);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching general vouchers: " + error.message });
    }
  });

  // Generate QR code for payment
  app.post("/api/customers/:id/generate-payment-qr", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { restaurantId, amount, paymentMethod } = req.body;

      if (!restaurantId || !amount) {
        return res.status(400).json({ message: "Restaurant ID and amount are required" });
      }

      const customer = await storage.getCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const restaurant = await storage.getRestaurantById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Generate payment data
      const paymentData = {
        customerId,
        customerName: customer.name,
        restaurantId,
        restaurantName: restaurant.name,
        amount,
        paymentMethod,
        timestamp: Date.now(),
        nonce: nanoid(16)
      };

      const qrCodeData = `EATOFF_PAYMENT:${Buffer.from(JSON.stringify(paymentData)).toString('base64')}`;
      
      // Generate actual QR code image using qr-image
      const qrPng = qr.image(qrCodeData, { type: 'png', size: 6 });
      const chunks: Buffer[] = [];
      
      qrPng.on('data', (chunk: Buffer) => chunks.push(chunk));
      qrPng.on('end', () => {
        const qrImageBuffer = Buffer.concat(chunks);
        const qrImageBase64 = `data:image/png;base64,${qrImageBuffer.toString('base64')}`;
        
        res.json({
          qrCode: qrCodeData,
          qrCodeImage: qrImageBase64,
          paymentDetails: {
            customerName: customer.name,
            restaurantName: restaurant.name,
            amount,
            paymentMethod,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
          }
        });
      });

      qrPng.on('error', (error: any) => {
        console.error('QR code generation error:', error);
        res.status(500).json({ message: "Error generating QR code: " + error.message });
      });

    } catch (error: any) {
      res.status(500).json({ message: "Error generating payment QR: " + error.message });
    }
  });

  // Process QR payment for restaurants
  app.post("/api/restaurants/:id/process-qr-payment", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const { qrCodeData } = req.body;

      if (!qrCodeData) {
        return res.status(400).json({ message: "QR code data is required" });
      }

      // Parse payment data
      let paymentData;
      try {
        const base64Data = qrCodeData.replace('EATOFF_PAYMENT:', '');
        paymentData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
      } catch {
        return res.status(400).json({ message: "Invalid QR code format" });
      }

      const { customerId, amount, paymentMethod, voucherId, generalVoucherId } = paymentData;

      // Verify restaurant matches
      if (paymentData.restaurantId !== restaurantId) {
        return res.status(400).json({ message: "QR code not valid for this restaurant" });
      }

      // Check QR expiry (5 minutes)
      if (Date.now() - paymentData.timestamp > 5 * 60 * 1000) {
        return res.status(400).json({ message: "QR code has expired" });
      }

      // Get customer
      const customer = await storage.getCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const totalAmount = parseFloat(amount);
      let paymentBreakdown = {
        voucherValue: 0,
        pointsUsed: 0,
        cashUsed: 0,
        generalVoucherDiscount: 0
      };

      // Process payment based on method
      let paymentValid = false;

      if (paymentMethod === 'wallet') {
        // Check customer balance
        const customerBalance = parseFloat(customer.balance || "0");
        
        if (customerBalance >= totalAmount) {
          // Deduct from customer balance
          const newBalance = customerBalance - totalAmount;
          await storage.updateCustomer(customerId, {
            balance: newBalance.toFixed(2)
          });
          
          paymentBreakdown.cashUsed = totalAmount;
          paymentValid = true;
        } else {
          return res.status(400).json({ 
            message: `Insufficient wallet balance. Available: €${customerBalance.toFixed(2)}, Required: €${totalAmount.toFixed(2)}` 
          });
        }
      } else if (paymentMethod === 'voucher' && voucherId) {
        // Process voucher payment
        const vouchers = await storage.getPurchasedVouchersByCustomer(customerId);
        const voucher = vouchers.find(v => v.id === voucherId && v.status === 'active');
        
        if (!voucher) {
          return res.status(400).json({ message: "Voucher not found or inactive" });
        }

        if ((voucher.usedMeals || 0) >= voucher.totalMeals) {
          return res.status(400).json({ message: "Voucher fully used" });
        }

        // Get package details for meal value calculation
        const pkg = await storage.getPackageById(voucher.packageId);
        if (pkg) {
          const mealValue = parseFloat(pkg.pricePerMeal);
          const discountApplied = mealValue * (parseFloat(pkg.discountPercentage) / 100);
          
          if (totalAmount <= mealValue) {
            // Update voucher usage
            await storage.updateVoucherUsage(voucherId, (voucher.usedMeals || 0) + 1);
            paymentBreakdown.voucherValue = totalAmount;
            paymentValid = true;
          } else {
            return res.status(400).json({ 
              message: `Amount exceeds voucher meal value of €${mealValue.toFixed(2)}` 
            });
          }
        }
      } else if (paymentMethod === 'points') {
        // Process points payment (100 points = €1)
        const pointsNeeded = Math.ceil(totalAmount * 100);
        const customerPoints = customer.loyaltyPoints || 0;
        
        if (customerPoints >= pointsNeeded) {
          // Deduct points
          await storage.updateCustomer(customerId, {
            loyaltyPoints: customerPoints - pointsNeeded
          });
          
          paymentBreakdown.pointsUsed = pointsNeeded;
          paymentValid = true;
        } else {
          return res.status(400).json({ 
            message: `Insufficient loyalty points. Available: ${customerPoints}, Required: ${pointsNeeded}` 
          });
        }
      }

      if (!paymentValid) {
        return res.status(400).json({ message: "Payment processing failed" });
      }

      // Create transaction record
      const transactionId = nanoid(16);
      const transaction = {
        id: transactionId,
        customerId,
        restaurantId,
        amount: totalAmount.toFixed(2),
        paymentMethod,
        status: 'completed',
        createdAt: new Date(),
        paymentBreakdown
      };

      // Award loyalty points for payment (1 point per €1)
      if (paymentMethod !== 'points') {
        const pointsToAward = Math.floor(totalAmount);
        const currentPoints = customer.loyaltyPoints || 0;
        const totalPointsEarned = customer.totalPointsEarned || 0;
        
        await storage.updateCustomer(customerId, {
          loyaltyPoints: currentPoints + pointsToAward,
          totalPointsEarned: totalPointsEarned + pointsToAward
        });
      }

      // Calculate and record commission for EatOff
      const defaultCommissionRate = 5.5; // 5.5% default commission rate
      const commissionAmount = totalAmount * (defaultCommissionRate / 100);
      
      // Record commission transaction
      const commissionRecord = {
        transactionId,
        restaurantId,
        customerId,
        transactionAmount: totalAmount,
        commissionRate: defaultCommissionRate,
        commissionAmount,
        paymentMethod,
        transactionType: 'qr_payment',
        status: 'pending',
        processedAt: new Date(),
        notes: `QR payment commission for ${totalAmount.toFixed(2)} EUR transaction`
      };

      // Add commission details to response
      const responseData = {
        success: true,
        transaction: {
          ...transaction,
          commissionAmount: commissionAmount.toFixed(2),
          commissionRate: defaultCommissionRate,
          netRestaurantAmount: (totalAmount - commissionAmount).toFixed(2)
        },
        paymentBreakdown,
        commission: {
          rate: defaultCommissionRate,
          amount: commissionAmount.toFixed(2),
          description: "EatOff platform commission"
        },
        message: "Payment processed successfully"
      };

      res.json(responseData);

    } catch (error: any) {
      console.error('QR payment processing error:', error);
      res.status(500).json({ message: "Error processing QR payment: " + error.message });
    }
  });

  // Restaurant endpoints
  
  // Create new restaurant (for restaurant owners)
  app.post("/api/restaurants", async (req, res) => {
    try {
      // This endpoint should be protected by restaurant owner authentication
      // For now, we'll use ownerId from session if available, otherwise set to null for admin approval
      const ownerId = req.session?.ownerId || null;
      
      const restaurantData = {
        ...req.body,
        ownerId,
        isApproved: false, // Requires admin approval
        isActive: true,
        rating: "4.0", // Default rating
        totalReviews: 0,
        isPopular: false
      };

      const newRestaurant = await storage.createRestaurant(restaurantData);
      res.status(201).json(newRestaurant);
    } catch (error: any) {
      console.error("Error creating restaurant:", error);
      res.status(500).json({ message: "Error creating restaurant: " + error.message });
    }
  });

  app.get("/api/restaurants", async (req, res) => {
    try {
      const { location, cuisine, priceRange, minDiscount } = req.query;
      
      const filters = {
        location: location as string,
        cuisine: cuisine as string,
        priceRange: priceRange as string,
        minDiscount: minDiscount ? parseInt(minDiscount as string) : undefined
      };

      const restaurants = await storage.getRestaurantsByFilters(filters);
      
      res.json(restaurants);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching restaurants: " + error.message });
    }
  });

  // Public endpoint for EatOff vouchers (available to all users including guests)
  app.get("/api/eatoff-vouchers", async (req, res) => {
    try {
      const vouchers = await storage.getEatoffVouchers();
      const activeVouchers = vouchers.filter(v => v.isActive);
      res.json(activeVouchers);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching vouchers: " + error.message });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurantById(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching restaurant: " + error.message });
    }
  });

  // Combined endpoint for restaurant with menu - optimized for fast loading
  app.get("/api/restaurants/:id/full", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Fetch restaurant and menu items in parallel for better performance
      const [restaurant, menuItems] = await Promise.all([
        storage.getRestaurantById(id),
        storage.getMenuItemsByRestaurant(id)
      ]);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json({
        restaurant,
        menuItems: menuItems || []
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching restaurant data: " + error.message });
    }
  });

  // Voucher package endpoints
  app.get("/api/restaurants/:id/packages", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const packages = await storage.getPackagesByRestaurant(restaurantId);
      
      // Get active EatOff vouchers to display first
      const eatoffVouchers = await storage.getEatoffVouchers();
      const activeEatoffVouchers = eatoffVouchers.filter(voucher => voucher.isActive);
      
      // Transform EatOff vouchers to look like regular packages for marketplace display
      const transformedEatoffVouchers = activeEatoffVouchers.map(voucher => ({
        id: `eatoff-${voucher.id}`,
        type: 'eatoff',
        name: voucher.name,
        description: voucher.description,
        mealCount: voucher.mealCount,
        pricePerMeal: voucher.pricePerMeal,
        totalValue: voucher.totalValue,
        discountPercentage: voucher.discountPercentage,
        validityMonths: voucher.validityMonths,
        isActive: voucher.isActive,
        restaurantId: restaurantId, // For compatibility
        imageUrl: voucher.imageUrl,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt
      }));
      
      // Combine EatOff vouchers (first) with restaurant-specific packages
      const allPackages = [...transformedEatoffVouchers, ...packages];
      
      res.json(allPackages);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching packages: " + error.message });
    }
  });

  app.post("/api/restaurants/:id/packages", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const packageData = insertVoucherPackageSchema.parse({
        ...req.body,
        restaurantId
      });
      
      const newPackage = await storage.createPackage(packageData);
      res.status(201).json(newPackage);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating package: " + error.message });
    }
  });

  app.put("/api/packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedPackage = await storage.updatePackage(id, updates);
      
      if (!updatedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      res.json(updatedPackage);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating package: " + error.message });
    }
  });

  // Menu endpoints
  app.get("/api/restaurants/:id/menu", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const menuItems = await storage.getMenuItemsByRestaurant(restaurantId);
      res.json(menuItems);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching menu: " + error.message });
    }
  });

  app.post("/api/restaurants/:id/menu", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const menuItemData = {
        ...req.body,
        restaurantId
      };
      
      const newMenuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(newMenuItem);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating menu item: " + error.message });
    }
  });

  app.put("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedMenuItem = await storage.updateMenuItem(id, updates);
      
      if (!updatedMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(updatedMenuItem);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating menu item: " + error.message });
    }
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMenuItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json({ message: "Menu item deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Error deleting menu item: " + error.message });
    }
  });

  app.delete("/api/packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePackage(id);
      
      if (!success) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting package: " + error.message });
    }
  });

  // Customer endpoints
  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching customer: " + error.message });
    }
  });

  // Update customer profile
  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const updateData = req.body;
      
      const customer = await storage.updateCustomer(customerId, updateData);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating customer: " + error.message });
    }
  });

  // Get restaurant recommendations for customer
  app.get("/api/customers/:id/recommendations", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await storage.getCustomerById(customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get all restaurants and filter based on customer profile
      const allRestaurants = await storage.getRestaurants();
      
      // Recommendation logic based on dietary preferences and health goals
      const recommendations = allRestaurants.filter(restaurant => {
        // Check dietary compatibility
        if (customer.dietaryPreferences && customer.dietaryPreferences.length > 0) {
          const hasCompatibleOptions = customer.dietaryPreferences.some(pref => 
            restaurant.dietaryOptions?.includes(pref.toLowerCase()) ||
            restaurant.cuisine?.toLowerCase().includes(pref.toLowerCase())
          );
          if (!hasCompatibleOptions) return false;
        }

        // Check allergy safety
        if (customer.allergies && customer.allergies.length > 0) {
          const hasSafeOptions = customer.allergies.every(allergy => 
            !restaurant.allergenInfo?.includes(`contains_${allergy.toLowerCase()}`)
          );
          if (!hasSafeOptions) return false;
        }

        // Health goal matching
        if (customer.healthGoal === 'weight_loss' && !restaurant.healthFocused) {
          return false;
        }

        return true;
      });

      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching recommendations: " + error.message });
    }
  });

  // Get menu items for a restaurant
  app.get("/api/restaurants/:id/menu", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const menuItems = await storage.getMenuItemsByRestaurant(restaurantId);
      res.json(menuItems);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching menu: " + error.message });
    }
  });

  // Create order from menu items
  app.post("/api/create-order-payment", async (req, res) => {
    try {
      const { restaurantId, items, customerInfo, total } = req.body;
      
      if (!restaurantId || !items || !customerInfo || !total) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create payment intent with Stripe (if available)
      let paymentIntent = null;
      if (stripe) {
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100), // Convert to cents
            currency: 'eur',
            payment_method_types: ['card', 'google_pay', 'apple_pay', 'klarna'],
            metadata: {
              restaurantId: restaurantId.toString(),
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              itemCount: items.length.toString()
            }
          });
        } catch (error: any) {
          if (error.code === 'payment_intent_invalid_parameter') {
            console.log('Some payment methods not enabled, using card only');
            paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(total * 100), // Convert to cents
              currency: 'eur',
              payment_method_types: ['card'],
              metadata: {
                restaurantId: restaurantId.toString(),
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                itemCount: items.length.toString()
              }
            });
          } else {
            throw error;
          }
        }
      }

      res.json({
        clientSecret: paymentIntent?.client_secret || "mock_client_secret_for_development",
        paymentIntentId: paymentIntent?.id || `mock_${Date.now()}`
      });

    } catch (error: any) {
      console.error("Order payment creation error:", error);
      res.status(500).json({ message: "Error creating order payment: " + error.message });
    }
  });

  // Complete menu order
  app.post("/api/complete-menu-order", async (req, res) => {
    try {
      const { paymentIntentId, restaurantId, items, customerInfo } = req.body;
      
      if (!paymentIntentId || !restaurantId || !items || !customerInfo) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Calculate total
      const totalAmount = items.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.unitPrice) * item.quantity), 0);

      // Create customer if not exists
      let customer = await storage.getCustomerByEmail(customerInfo.email);
      if (!customer) {
        customer = await storage.createCustomer({
          email: customerInfo.email,
          name: customerInfo.name,
          phone: customerInfo.phone || null,
          balance: "0.00",
          age: null,
          weight: null,
          height: null,
          activityLevel: null,
          healthGoal: null,
          dietaryPreferences: null,
          allergies: null,
          dislikes: null,
          healthConditions: null
        });
      }

      // Create order
      const order = await storage.createOrder({
        restaurantId: parseInt(restaurantId),
        customerId: customer.id,
        status: "confirmed",
        orderNumber,
        totalAmount: totalAmount.toFixed(2),
        paymentIntentId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone || "",
        customerEmail: customerInfo.email,
        deliveryAddress: customerInfo.address || "",
        specialInstructions: customerInfo.notes || "",
        estimatedReadyTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes
      });

      // Create order items
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
          specialRequests: item.specialRequests || null
        });
      }

      res.json({ 
        success: true, 
        orderId: order.id,
        orderNumber: order.orderNumber,
        estimatedReadyTime: order.estimatedReadyTime
      });

    } catch (error: any) {
      console.error("Order completion error:", error);
      res.status(500).json({ message: "Error completing order: " + error.message });
    }
  });

  app.get("/api/customers/:id/vouchers", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const vouchers = await storage.getPurchasedVouchersByCustomer(customerId);
      
      // Enrich vouchers with restaurant and package info
      const enrichedVouchers = await Promise.all(
        vouchers.map(async (voucher) => {
          const restaurant = await storage.getRestaurantById(voucher.restaurantId);
          const pkg = await storage.getPackageById(voucher.packageId);
          return {
            ...voucher,
            restaurant,
            package: pkg
          };
        })
      );
      
      res.json(enrichedVouchers);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching vouchers: " + error.message });
    }
  });

  // Complete purchase for Pay Later vouchers after setup intent confirmation
  app.post("/api/complete-pay-later-purchase", async (req, res) => {
    try {
      const { setupIntentId, customerId, eatoffVoucherId } = req.body;

      if (!setupIntentId || !customerId || !eatoffVoucherId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const voucher = await storage.getEatoffVoucherById(eatoffVoucherId);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      // Retrieve the setup intent to get payment method
      if (stripe) {
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        
        if (setupIntent.status !== 'succeeded') {
          return res.status(400).json({ message: "Payment method authorization failed" });
        }

        // Calculate payment schedule
        const paymentTermDays = voucher.paymentTermDays || 30;
        const scheduledChargeDate = new Date();
        scheduledChargeDate.setDate(scheduledChargeDate.getDate() + paymentTermDays);

        const originalAmount = parseFloat(voucher.totalValue) * (1 - parseFloat(voucher.discountPercentage) / 100);
        const bonusAmount = originalAmount * (parseFloat(voucher.bonusPercentage) / 100);
        const totalVoucherValue = originalAmount + bonusAmount;

        // Create deferred payment record
        const deferredPayment = await storage.createDeferredPayment({
          customerId: customerId.toString(),
          eatoffVoucherId,
          paymentMethodId: setupIntent.payment_method,
          originalAmount: originalAmount.toFixed(2),
          bonusAmount: bonusAmount.toFixed(2),
          totalVoucherValue: totalVoucherValue.toFixed(2),
          paymentTermDays,
          scheduledChargeDate,
          status: 'pending',
          setupIntentId: setupIntentId
        });

        // Create the voucher purchase record with bonus value
        const purchasedVoucher = await storage.createPurchasedVoucher({
          customerId: parseInt(customerId),
          restaurantId: 1, // General EatOff voucher
          voucherPackageId: null,
          totalMeals: voucher.mealCount || 0,
          purchasePrice: totalVoucherValue.toFixed(2), // Full value including bonus
          discountPercentage: "0.00", // Already applied
          paymentMethod: "pay_later",
          voucherType: "pay_later",
          eatoffVoucherId: eatoffVoucherId,
          deferredPaymentId: deferredPayment.id
        });

        res.json({
          success: true,
          voucherId: purchasedVoucher.id,
          totalValue: totalVoucherValue.toFixed(2),
          bonusAmount: bonusAmount.toFixed(2),
          paymentDueDate: scheduledChargeDate.toISOString(),
          deferredPaymentId: deferredPayment.id
        });
      } else {
        return res.status(503).json({ message: "Payment processing unavailable" });
      }
    } catch (error: any) {
      console.error("Error completing Pay Later purchase:", error);
      res.status(500).json({ message: "Error completing purchase: " + error.message });
    }
  });

  // Payment endpoint for voucher purchase
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is currently unavailable. Please contact support." });
      }

      const { amount, packageId, customerId, eatoffVoucherId, voucherType } = req.body;
      
      if (!customerId || (!packageId && !eatoffVoucherId)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Handle Pay Later vouchers with setup intent for authorization
      if (voucherType === 'pay_later' && eatoffVoucherId) {
        const voucher = await storage.getEatoffVoucherById(eatoffVoucherId);
        if (!voucher) {
          return res.status(404).json({ message: "Voucher not found" });
        }

        const setupIntent = await stripe.setupIntents.create({
          payment_method_types: ['card'],
          usage: 'off_session',
          metadata: {
            eatoffVoucherId: eatoffVoucherId.toString(),
            customerId: customerId.toString(),
            voucherType: 'pay_later',
            bonusPercentage: voucher.bonusPercentage?.toString() || '0',
            paymentTermDays: voucher.paymentTermDays?.toString() || '30'
          }
        });

        return res.json({ 
          clientSecret: setupIntent.client_secret,
          isPayLater: true,
          payLaterDetails: {
            bonusPercentage: voucher.bonusPercentage || 0,
            paymentTermDays: voucher.paymentTermDays || 30,
            originalAmount: amount
          }
        });
      }

      // Regular payment intent for immediate payments
      if (!amount) {
        return res.status(400).json({ message: "Amount is required for immediate payments" });
      }

      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "eur",
          payment_method_types: ['card', 'google_pay', 'apple_pay', 'klarna'],
          metadata: {
            packageId: packageId?.toString() || "",
            eatoffVoucherId: eatoffVoucherId?.toString() || "",
            customerId: customerId.toString(),
            voucherType: voucherType || 'immediate'
          }
        });
      } catch (error: any) {
        if (error.code === 'payment_intent_invalid_parameter') {
          console.log('Some payment methods not enabled, using card only');
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: "eur",
            payment_method_types: ['card'],
            metadata: {
              packageId: packageId?.toString() || "",
              eatoffVoucherId: eatoffVoucherId?.toString() || "",
              customerId: customerId.toString(),
              voucherType: voucherType || 'immediate'
            }
          });
        } else {
          throw error;
        }
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Complete voucher purchase after payment
  app.post("/api/complete-voucher-purchase", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is currently unavailable. Please contact support." });
      }

      const { paymentIntentId, packageId, customerId } = req.body;
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      const pkg = await storage.getPackageById(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      const regularPrice = parseFloat(pkg.pricePerMeal) * pkg.mealCount;
      const discountAmount = regularPrice * (parseFloat(pkg.discountPercentage) / 100);
      const purchasePrice = regularPrice - discountAmount;

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (pkg.validityMonths || 12));

      // Generate QR code data for voucher
      const qrCodeId = nanoid(16);
      const qrCodeData = `EATOFF_VOUCHER:${customerId}:${pkg.restaurantId}:${qrCodeId}:${Date.now()}`;
      
      const voucherData = {
        customerId,
        packageId,
        restaurantId: pkg.restaurantId,
        totalMeals: pkg.mealCount,
        usedMeals: 0,
        purchasePrice: purchasePrice.toFixed(2),
        discountReceived: discountAmount.toFixed(2),
        expiryDate,
        status: "active",
        qrCode: qrCodeData
      };

      const voucher = await storage.createPurchasedVoucher(voucherData);
      res.status(201).json(voucher);
    } catch (error: any) {
      res.status(500).json({ message: "Error completing purchase: " + error.message });
    }
  });

  // Get QR code image for voucher
  app.get("/api/vouchers/:id/qr-code", async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      const voucher = await storage.getPurchasedVoucherById(voucherId);
      
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      if (!voucher.qrCode) {
        return res.status(404).json({ message: "QR code not found for this voucher" });
      }

      // Generate QR code image using qr-image library
      try {
        // Generate QR code as PNG buffer
        const qrBuffer = qr.imageSync(voucher.qrCode, { 
          type: 'png',
          size: 10,
          margin: 2,
          ec_level: 'M'
        });
        
        // Convert buffer to base64 data URL
        const qrCodeImage = `data:image/png;base64,${qrBuffer.toString('base64')}`;
        
        res.json({
          qrCodeImage,
          qrCodeData: voucher.qrCode,
          voucherId: voucher.id
        });
        
      } catch (error) {
        console.error("QR Code generation error:", error);
        res.status(500).json({ message: "Failed to generate QR code image" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error generating QR code: " + error.message });
    }
  });

  // Voucher redemption endpoint
  app.post("/api/vouchers/:id/redeem", async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      const voucher = await storage.getPurchasedVoucherById(voucherId);
      
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      if (voucher.status !== "active") {
        return res.status(400).json({ message: "Voucher is not active" });
      }

      if ((voucher.usedMeals || 0) >= voucher.totalMeals) {
        return res.status(400).json({ message: "Voucher fully used" });
      }

      if (new Date() > new Date(voucher.expiryDate)) {
        return res.status(400).json({ message: "Voucher expired" });
      }

      const pkg = await storage.getPackageById(voucher.packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      const mealValue = parseFloat(pkg.pricePerMeal);
      const discountApplied = mealValue * (parseFloat(pkg.discountPercentage) / 100);

      // Create redemption record
      await storage.createRedemption({
        voucherId,
        restaurantId: voucher.restaurantId,
        customerId: voucher.customerId,
        mealValue: mealValue.toFixed(2),
        discountApplied: discountApplied.toFixed(2)
      });

      // Update voucher usage
      const updatedVoucher = await storage.updateVoucherUsage(voucherId, (voucher.usedMeals || 0) + 1);
      
      res.json({
        voucher: updatedVoucher,
        redemption: {
          mealValue,
          discountApplied,
          remainingMeals: voucher.totalMeals - ((voucher.usedMeals || 0) + 1)
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error redeeming voucher: " + error.message });
    }
  });

  // Restaurant analytics endpoint
  app.get("/api/restaurants/:id/analytics", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const analytics = await storage.getRestaurantAnalytics(restaurantId);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching analytics: " + error.message });
    }
  });

  // AI Assistant endpoints
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context, language } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await getAIAssistantResponse(message, context, language || 'en');
      res.json(response);
    } catch (error: any) {
      console.error("AI Chat error:", error);
      res.status(500).json({ message: "AI assistant is temporarily unavailable" });
    }
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { preferences } = req.body;
      
      const recommendations = await getRestaurantRecommendations(preferences || {});
      res.json(recommendations);
    } catch (error: any) {
      console.error("AI Recommendations error:", error);
      res.status(500).json({ message: "Unable to get recommendations right now" });
    }
  });

  app.post("/api/ai/explain-package", async (req, res) => {
    try {
      const { packageData } = req.body;
      
      if (!packageData) {
        return res.status(400).json({ message: "Package data is required" });
      }

      const explanation = await explainVoucherPackage(packageData);
      res.json({ explanation });
    } catch (error: any) {
      console.error("Package explanation error:", error);
      res.status(500).json({ message: "Unable to explain package right now" });
    }
  });

  // Complete order after successful payment
  app.post("/api/complete-order", async (req, res) => {
    try {
      const { paymentIntentId, restaurantId, items, customerInfo } = req.body;

      if (!paymentIntentId || !restaurantId || !items || !customerInfo) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify payment with Stripe if available
      if (stripe) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ message: "Payment not completed" });
        }
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        const menuItem = await storage.getMenuItemById(item.menuItemId);
        if (menuItem) {
          totalAmount += parseFloat(menuItem.price) * item.quantity;
        }
      }

      // Create order in database
      const order = await storage.createOrder({
        customerId: 1, // Default customer for now
        restaurantId,
        orderNumber,
        totalAmount: totalAmount.toFixed(2),
        paymentIntentId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        deliveryAddress: customerInfo.deliveryAddress || null,
        orderType: customerInfo.orderType || 'pickup',
        status: "confirmed"
      });

      // Create order items
      for (const item of items) {
        const menuItem = await storage.getMenuItemById(item.menuItemId);
        if (menuItem) {
          await storage.createOrderItem({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: (parseFloat(menuItem.price) * item.quantity).toFixed(2),
            specialRequests: item.specialRequests || null
          });
        }
      }

      res.json({ 
        success: true, 
        orderNumber,
        orderId: order.id,
        message: "Order completed successfully" 
      });

    } catch (error: any) {
      res.status(500).json({ message: "Error completing order: " + error.message });
    }
  });

  // User Address endpoints
  app.get("/api/user/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching addresses: " + error.message });
    }
  });

  app.post("/api/user/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addressData = insertUserAddressSchema.parse({
        ...req.body,
        userId
      });
      
      const newAddress = await storage.createUserAddress(addressData);
      res.json(newAddress);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating address: " + error.message });
    }
  });

  app.put("/api/user/addresses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addressId = parseInt(req.params.id);
      
      // Verify ownership
      const existingAddress = await storage.getUserAddressById(addressId);
      if (!existingAddress || existingAddress.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      const addressData = insertUserAddressSchema.partial().parse(req.body);
      const updatedAddress = await storage.updateUserAddress(addressId, addressData);
      
      if (!updatedAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json(updatedAddress);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating address: " + error.message });
    }
  });

  app.delete("/api/user/addresses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addressId = parseInt(req.params.id);
      
      // Verify ownership
      const existingAddress = await storage.getUserAddressById(addressId);
      if (!existingAddress || existingAddress.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      const success = await storage.deleteUserAddress(addressId);
      if (!success) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json({ message: "Address deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting address: " + error.message });
    }
  });

  app.post("/api/user/addresses/:id/set-default", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addressId = parseInt(req.params.id);
      
      // Verify ownership
      const existingAddress = await storage.getUserAddressById(addressId);
      if (!existingAddress || existingAddress.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      await storage.setDefaultAddress(userId, addressId);
      res.json({ message: "Default address set successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error setting default address: " + error.message });
    }
  });

  // EatOff Admin Financial Dashboard API endpoints
  app.get("/api/admin/financial-overview", async (req, res) => {
    try {
      // Get daily financial summary for last 30 days
      const dailySummary = await db.execute(sql`
        SELECT date, total_orders, total_cash_paid, total_points_paid, 
               total_commission_earned, total_amount_owed_to_restaurants
        FROM eatoff_daily_summary
        WHERE date >= (CURRENT_DATE - INTERVAL '30 days')
        ORDER BY date DESC
      `);

      // Get today's totals
      const today = new Date().toISOString().split('T')[0];
      const todaysSummary = await db.execute(sql`
        SELECT * FROM eatoff_daily_summary WHERE date = ${today}
      `);

      // Get restaurant financial breakdown
      const restaurantBreakdown = await db.execute(sql`
        SELECT rf.restaurant_id, r.name as restaurant_name,
               SUM(rf.cash_earned) as total_cash_earned,
               SUM(rf.points_earned) as total_points_earned,
               SUM(rf.commission_amount) as total_commission_earned,
               SUM(rf.net_amount) as total_amount_owed,
               COUNT(*) as transaction_count
        FROM restaurant_financials rf
        JOIN restaurants r ON rf.restaurant_id = r.id
        WHERE rf.date >= (CURRENT_DATE - INTERVAL '30 days')
        GROUP BY rf.restaurant_id, r.name
        ORDER BY total_amount_owed DESC
      `);

      res.json({
        dailySummary: dailySummary.rows,
        todaysSummary: todaysSummary.rows[0] || null,
        restaurantBreakdown: restaurantBreakdown.rows,
        summary: {
          totalOrdersLast30Days: dailySummary.rows.reduce((sum: number, day: any) => sum + (parseInt(day.total_orders) || 0), 0),
          totalCommissionEarned: dailySummary.rows.reduce((sum: number, day: any) => sum + (parseFloat(day.total_commission_earned) || 0), 0),
          totalOwedToRestaurants: dailySummary.rows.reduce((sum: number, day: any) => sum + (parseFloat(day.total_amount_owed_to_restaurants) || 0), 0)
        }
      });
    } catch (error: any) {
      console.error('Error fetching financial overview:', error);
      res.status(500).json({ message: "Error fetching financial data: " + error.message });
    }
  });

  app.get("/api/admin/restaurant-payments", async (req, res) => {
    try {
      // Get all restaurants with pending payments
      const pendingPayments = await db.execute(sql`
        SELECT rf.restaurant_id, r.name as restaurant_name, r.email,
               SUM(rf.net_amount) as total_pending_amount,
               MIN(rf.date) as earliest_transaction_date,
               MAX(rf.date) as latest_transaction_date,
               COUNT(*) as pending_transaction_count
        FROM restaurant_financials rf
        JOIN restaurants r ON rf.restaurant_id = r.id
        WHERE rf.payout_status = 'pending'
        GROUP BY rf.restaurant_id, r.name, r.email
        ORDER BY total_pending_amount DESC
      `);

      // Get payment history (last 10 payouts)
      const paymentHistory = await db.execute(sql`
        SELECT rf.restaurant_id, r.name as restaurant_name,
               rf.net_amount, rf.payout_date, rf.payout_status,
               rf.date as transaction_date
        FROM restaurant_financials rf
        JOIN restaurants r ON rf.restaurant_id = r.id
        WHERE rf.payout_status IN ('completed', 'processing')
        ORDER BY rf.payout_date DESC
        LIMIT 10
      `);

      res.json({
        pendingPayments: pendingPayments.rows,
        paymentHistory: paymentHistory.rows,
        totalPendingAmount: pendingPayments.rows.reduce((sum, restaurant) => sum + (parseFloat(restaurant.total_pending_amount) || 0), 0)
      });
    } catch (error: any) {
      console.error('Error fetching restaurant payments:', error);
      res.status(500).json({ message: "Error fetching payment data: " + error.message });
    }
  });

  app.post("/api/admin/process-restaurant-payment", async (req, res) => {
    try {
      const { restaurantId, amount } = req.body;
      
      if (!restaurantId || !amount) {
        return res.status(400).json({ message: "Restaurant ID and amount are required" });
      }

      // Mark restaurant payments as processing
      await db.execute(sql`
        UPDATE restaurant_financials 
        SET payout_status = 'processing', payout_date = NOW()
        WHERE restaurant_id = ${restaurantId} AND payout_status = 'pending'
      `);

      res.json({ 
        success: true, 
        message: `Payment of €${amount} marked as processing for restaurant ${restaurantId}` 
      });
    } catch (error: any) {
      console.error('Error processing restaurant payment:', error);
      res.status(500).json({ message: "Error processing payment: " + error.message });
    }
  });

  // Debug authentication endpoint to test session state
  app.get("/api/debug/auth", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      session: req.session,
      sessionID: req.sessionID
    });
  });

  // Test page for dietary profile debugging
  app.get("/test-dietary.html", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Test Dietary Profile</title>
</head>
<body>
    <h2>Test Dietary Profile Saving</h2>
    <button onclick="testAuth()">Check Auth Status</button>
    <button onclick="testProfileSave()">Test Profile Save</button>
    <button onclick="testProfileGet()">Test Profile Get</button>
    <div id="results"></div>

    <script>
        const results = document.getElementById('results');
        
        async function testAuth() {
            try {
                const response = await fetch('/api/auth/user', {
                    credentials: 'include'
                });
                const data = await response.json();
                results.innerHTML = \`<p>Auth Status: \${response.status}</p><pre>\${JSON.stringify(data, null, 2)}</pre>\`;
            } catch (error) {
                results.innerHTML = \`<p>Auth Error: \${error.message}</p>\`;
            }
        }
        
        async function testProfileGet() {
            try {
                const response = await fetch('/api/dietary/profile', {
                    credentials: 'include'
                });
                const data = await response.json();
                results.innerHTML = \`<p>Profile Get: \${response.status}</p><pre>\${JSON.stringify(data, null, 2)}</pre>\`;
            } catch (error) {
                results.innerHTML = \`<p>Profile Get Error: \${error.message}</p>\`;
            }
        }
        
        async function testProfileSave() {
            try {
                const profileData = {
                    age: 30,
                    height: 175,
                    weight: "70",
                    gender: "male",
                    activityLevel: "moderate",
                    healthGoal: "weight_loss",
                    targetWeight: "65",
                    dietaryPreferences: ["vegetarian"],
                    allergies: ["nuts"],
                    foodIntolerances: ["lactose"],
                    dislikedIngredients: ["mushrooms"],
                    preferredCuisines: ["italian", "mediterranean"],
                    healthConditions: [],
                    calorieTarget: 2000,
                    proteinTarget: 120,
                    carbTarget: 200,
                    fatTarget: 70,
                    budgetRange: "medium",
                    diningFrequency: "weekly"
                };
                
                const response = await fetch('/api/dietary/profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(profileData)
                });
                
                const data = await response.json();
                results.innerHTML = \`<p>Profile Save: \${response.status}</p><pre>\${JSON.stringify(data, null, 2)}</pre>\`;
            } catch (error) {
                results.innerHTML = \`<p>Profile Save Error: \${error.message}</p>\`;
            }
        }
    </script>
</body>
</html>`);
  });

  // Restaurant enrollment endpoint
  app.post("/api/restaurant-enrollment", async (req, res) => {
    try {
      const enrollmentData = insertRestaurantEnrollmentSchema.parse(req.body);
      
      // Insert enrollment application into database
      const [enrollment] = await db
        .insert(restaurantEnrollments)
        .values(enrollmentData)
        .returning();
      
      res.status(201).json({
        message: "Restaurant enrollment application submitted successfully",
        enrollmentId: enrollment.id
      });
    } catch (error: any) {
      console.error("Restaurant enrollment error:", error);
      res.status(400).json({ 
        message: "Error submitting enrollment application: " + error.message 
      });
    }
  });

  // Complete order with mixed payment (points + card)
  app.post("/api/create-mixed-payment-order", async (req: any, res) => {
    try {
      const { restaurantId, items, customerInfo, pointsUsed, cardAmount, totalAmount } = req.body;
      
      // Check session-based authentication
      if (!req.session?.ownerId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get the user from the database using session ownerId
      const user = await storage.getCustomer(req.session.ownerId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Generate order number
      const orderNumber = `EO${Date.now().toString().slice(-8)}`;

      // Create order
      const order = await storage.createOrder({
        restaurantId: parseInt(restaurantId),
        customerId: user.id,
        status: "confirmed",
        orderNumber,
        totalAmount: totalAmount.toFixed(2),
        paymentIntentId: `mixed_${Date.now()}`,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone || "",
        customerEmail: customerInfo.email,
        deliveryAddress: customerInfo.deliveryAddress || "",
        specialInstructions: customerInfo.specialInstructions || "",
        estimatedReadyTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes
        completedAt: null
      });

      // Create order items
      for (const item of items) {
        const menuItem = await storage.getMenuItemById(item.menuItemId);
        if (menuItem) {
          await storage.createOrderItem({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: (parseFloat(menuItem.price) * item.quantity).toFixed(2),
            specialRequests: item.specialRequests || null
          });
        }
      }

      // Handle points payment portion
      if (pointsUsed > 0) {
        await storage.createPointsTransaction({
          customerId: user.id,
          orderId: order.id,
          transactionType: "redeemed",
          pointsAmount: pointsUsed,
          description: `Mixed payment - points portion: ${orderNumber}`
        });

        // Update financial tracking for points portion
        const pointsValue = pointsUsed / 100; // 100 points = €1
        await updateRestaurantFinancials(restaurantId, pointsValue, 'points');
        await updateEatOffDailySummary(new Date(), pointsValue, 'points');
      }

      // Handle card payment portion
      if (cardAmount > 0) {
        // Update financial tracking for card portion
        await updateRestaurantFinancials(restaurantId, cardAmount, 'cash');
        await updateEatOffDailySummary(new Date(), cardAmount, 'cash');
      }

      // Award points for the total purchase (1 point per euro spent)
      await storage.createPointsTransaction({
        customerId: user.id,
        orderId: order.id,
        transactionType: "earned",
        pointsAmount: Math.floor(totalAmount),
        description: `Points earned from mixed payment order: ${orderNumber}`
      });

      res.json({ 
        success: true, 
        orderId: order.id,
        orderNumber: order.orderNumber,
        pointsUsed: pointsUsed,
        cardAmount: cardAmount,
        totalAmount: totalAmount,
        pointsEarned: Math.floor(totalAmount),
        estimatedReadyTime: order.estimatedReadyTime
      });

    } catch (error: any) {
      console.error("Mixed payment error:", error);
      res.status(500).json({ message: "Error processing mixed payment: " + error.message });
    }
  });

  // Complete order with points payment
  app.post("/api/complete-order-with-points", async (req: any, res) => {
    try {
      const { restaurantId, items, customerInfo, pointsToUse, totalAmount } = req.body;
      
      // Check session-based authentication
      if (!req.session?.ownerId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get the user from the database using session ownerId
      const user = await storage.getCustomer(req.session.ownerId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Fetch user's current points
      const pointsData = await storage.getCustomerPointsData(user.id);
      const currentPoints = pointsData?.currentPoints || 0;
      
      // Validate points availability
      const requiredPoints = Math.ceil(totalAmount * 100); // 100 points = €1
      if (currentPoints < requiredPoints) {
        return res.status(400).json({ 
          message: `Insufficient points. Required: ${requiredPoints}, Available: ${currentPoints}` 
        });
      }

      // Generate order number
      const orderNumber = `EO${Date.now().toString().slice(-8)}`;

      // Create order
      const order = await storage.createOrder({
        restaurantId: parseInt(restaurantId),
        customerId: user.id,
        status: "confirmed",
        orderNumber,
        totalAmount: totalAmount.toFixed(2),
        paymentIntentId: `points_${Date.now()}`,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone || "",
        customerEmail: customerInfo.email,
        deliveryAddress: customerInfo.deliveryAddress || "",
        specialInstructions: customerInfo.specialInstructions || "",
        estimatedReadyTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes
        completedAt: null
      });

      // Create order items
      for (const item of items) {
        const menuItem = await storage.getMenuItemById(item.menuItemId);
        if (menuItem) {
          await storage.createOrderItem({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: (parseFloat(menuItem.price) * item.quantity).toFixed(2),
            specialRequests: item.specialRequests || null
          });
        }
      }

      // Deduct points from user account
      await storage.createPointsTransaction({
        customerId: user.id,
        orderId: order.id,
        transactionType: "redeemed",
        pointsAmount: requiredPoints,
        description: `Order payment: ${orderNumber}`
      });

      // Award points for the purchase (1 point per euro spent)
      await storage.createPointsTransaction({
        customerId: user.id,
        orderId: order.id,
        transactionType: "earned",
        pointsAmount: Math.floor(totalAmount),
        description: `Points earned from order: ${orderNumber}`
      });

      // Transfer financial data to restaurant and EatOff tracking
      await updateRestaurantFinancials(restaurantId, totalAmount, 'points');
      await updateEatOffDailySummary(new Date(), totalAmount, 'points');

      res.json({ 
        success: true, 
        orderId: order.id,
        orderNumber: order.orderNumber,
        pointsUsed: requiredPoints,
        pointsEarned: Math.floor(totalAmount),
        estimatedReadyTime: order.estimatedReadyTime
      });

    } catch (error: any) {
      console.error("Points payment error:", error);
      res.status(500).json({ message: "Error processing points payment: " + error.message });
    }
  });

  // Register order routes
  registerOrderRoutes(app);

  // Note: restaurant portal routes are already registered at /api/restaurant-portal
  // The public /api/restaurants endpoint is defined above without requireAuth

  // Object storage routes to serve uploaded files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
