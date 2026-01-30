import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import * as qr from "qr-image";
import Stripe from "stripe";
import { db } from "./db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { 
  insertCustomerWalletSchema,
  insertGeneralVoucherSchema,
  insertCustomerGeneralVoucherSchema,
  insertPaymentTransactionSchema,
  insertWalletTransactionSchema,
  insertQrCodeSchema,
  cashbackGroups,
  customerCashbackEnrollments,
  customerCashbackBalance,
  customerRestaurantCashback,
  cashbackTransactions,
  customerCreditAccount,
  creditTransactions,
  loyaltyGroups,
  customerLoyaltyEnrollments,
  customers,
  insertCashbackGroupSchema,
  insertLoyaltyGroupSchema,
  creditTypes,
  insertCreditTypeSchema
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const router = Router();

// Get customer wallet information
router.get("/customers/:id/wallet", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    const customer = await storage.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Get or create wallet
    let wallet = await storage.getCustomerWallet(customerId);
    if (!wallet) {
      wallet = await storage.createCustomerWallet({
        customerId,
        cashBalance: "0.00",
        loyaltyPoints: customer.loyaltyPoints || 0,
        totalPointsEarned: customer.totalPointsEarned || 0,
        isActive: true
      });
    }

    // Get active vouchers
    const vouchers = await storage.getPurchasedVouchersByCustomer(customerId);
    const activeVouchers = vouchers.filter(v => v.status === "active");

    // Get general vouchers
    const generalVouchers = await storage.getCustomerGeneralVouchers(customerId);
    const activeGeneralVouchers = generalVouchers.filter(v => v.status === "active");

    // Get recent transactions
    const transactions = await storage.getWalletTransactions(customerId, 20);

    res.json({
      wallet,
      vouchers: activeVouchers,
      generalVouchers: activeGeneralVouchers,
      transactions,
      summary: {
        totalCashBalance: wallet.cashBalance,
        totalLoyaltyPoints: wallet.loyaltyPoints,
        totalVouchers: activeVouchers.length,
        totalGeneralVouchers: activeGeneralVouchers.length,
        estimatedValue: calculateTotalWalletValue(wallet, activeVouchers, activeGeneralVouchers)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching wallet: " + error.message });
  }
});

// Create payment intent for wallet top-up
router.post("/customers/:id/wallet/create-payment-intent", async (req, res) => {
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

    // Create Stripe PaymentIntent for wallet top-up to EatOff account
    // Try with all payment methods, fallback to enabled ones only
    let paymentIntent;
    try {
      // First try with all payment methods
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: "eur",
        payment_method_types: ['card', 'google_pay', 'apple_pay', 'klarna'],
        metadata: {
          type: "wallet_topup",
          customerId: customerId.toString(),
          customerEmail: customer.email || "",
          customerName: customer.name || ""
        },
        description: `EatOff Wallet Top-up - ${customer.name}`,
        receipt_email: customer.email || undefined
      });
    } catch (error: any) {
      if (error.code === 'payment_intent_invalid_parameter') {
        // Fallback to card payments only
        console.log('Some payment methods not enabled, using card only');
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          currency: "eur",
          payment_method_types: ['card'],
          metadata: {
            type: "wallet_topup",
            customerId: customerId.toString(),
            customerEmail: customer.email || "",
            customerName: customer.name || ""
          },
          description: `EatOff Wallet Top-up - ${customer.name}`,
          receipt_email: customer.email || undefined
        });
      } else {
        throw error;
      }
    }

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ message: "Error creating payment intent: " + error.message });
  }
});

// Complete wallet top-up after successful Stripe payment
router.post("/customers/:id/wallet/complete-topup", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment intent ID is required" });
    }

    const customer = await storage.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    if (paymentIntent.metadata.customerId !== customerId.toString()) {
      return res.status(400).json({ message: "Payment does not belong to this customer" });
    }

    const amount = (paymentIntent.amount / 100).toFixed(2); // Convert from cents

    // Get or create wallet
    let wallet = await storage.getCustomerWallet(customerId);
    if (!wallet) {
      wallet = await storage.createCustomerWallet({
        customerId,
        cashBalance: "0.00",
        loyaltyPoints: customer.loyaltyPoints || 0,
        totalPointsEarned: customer.totalPointsEarned || 0,
        isActive: true
      });
    }

    const previousBalance = parseFloat(wallet.cashBalance);
    const newBalance = previousBalance + parseFloat(amount);

    // Update wallet balance
    const updatedWallet = await storage.updateWalletBalance(customerId, newBalance.toFixed(2));

    // Record transaction
    await storage.createWalletTransaction({
      customerId,
      transactionType: "deposit",
      amount: amount,
      description: `Wallet top-up via Stripe - Payment to EatOff`,
      balanceBefore: previousBalance.toFixed(2),
      balanceAfter: newBalance.toFixed(2)
    });

    res.json({
      success: true,
      previousBalance: previousBalance.toFixed(2),
      newBalance: newBalance.toFixed(2),
      amountAdded: amount,
      wallet: updatedWallet,
      paymentIntentId
    });
  } catch (error: any) {
    console.error("Error completing wallet top-up:", error);
    res.status(500).json({ message: "Error completing wallet top-up: " + error.message });
  }
});

// Get available general vouchers to purchase
router.get("/general-vouchers", async (req, res) => {
  try {
    const { category, minDiscount, maxPrice } = req.query;
    
    const filters = {
      category: category as string,
      minDiscount: minDiscount ? parseInt(minDiscount as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
    };

    const vouchers = await storage.getAvailableGeneralVouchers(filters);
    res.json(vouchers);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching general vouchers: " + error.message });
  }
});

// Purchase a general voucher
router.post("/customers/:id/purchase-general-voucher", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { generalVoucherId, paymentMethod } = req.body;

    if (!generalVoucherId) {
      return res.status(400).json({ message: "General voucher ID is required" });
    }

    const customer = await storage.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const voucher = await storage.getGeneralVoucherById(generalVoucherId);
    if (!voucher || !voucher.isActive) {
      return res.status(404).json({ message: "Voucher not found or inactive" });
    }

    // Check availability
    if (voucher.soldQuantity >= voucher.stockQuantity) {
      return res.status(400).json({ message: "Voucher out of stock" });
    }

    const wallet = await storage.getCustomerWallet(customerId);
    if (!wallet) {
      return res.status(400).json({ message: "Customer wallet not found" });
    }

    // Check if customer has enough balance
    const walletBalance = parseFloat(wallet.cashBalance);
    const voucherPrice = parseFloat(voucher.price);

    if (paymentMethod === "wallet" && walletBalance < voucherPrice) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Generate QR code
    const qrCodeData = `EATOFF_GENERAL_VOUCHER:${nanoid(32)}`;
    
    // Create customer general voucher
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + voucher.validityDays);

    const customerVoucher = await storage.createCustomerGeneralVoucher({
      customerId,
      generalVoucherId,
      purchasePrice: voucher.price,
      expiryDate,
      qrCode: qrCodeData,
      status: "active"
    });

    // Process payment
    if (paymentMethod === "wallet") {
      const newBalance = walletBalance - voucherPrice;
      await storage.updateWalletBalance(customerId, newBalance.toFixed(2));
      
      // Record wallet transaction
      await storage.createWalletTransaction({
        customerId,
        transactionType: "voucher_purchase",
        amount: `-${voucherPrice.toFixed(2)}`,
        description: `Purchased general voucher: ${voucher.name}`,
        balanceBefore: walletBalance.toFixed(2),
        balanceAfter: newBalance.toFixed(2)
      });
    }

    // Update voucher stock
    await storage.updateGeneralVoucherStock(generalVoucherId, voucher.soldQuantity + 1);

    // Create QR code record
    await storage.createQrCode({
      qrCodeData,
      qrCodeType: "general_voucher",
      customerId,
      generalVoucherId: customerVoucher.id,
      isActive: true,
      expiresAt: expiryDate
    });

    res.json({
      success: true,
      customerVoucher,
      qrCode: qrCodeData,
      message: `Successfully purchased ${voucher.name}`
    });

  } catch (error: any) {
    res.status(500).json({ message: "Error purchasing general voucher: " + error.message });
  }
});

// Generate QR code for payment
router.post("/customers/:id/generate-payment-qr", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { restaurantId, amount, paymentMethod, voucherId, generalVoucherId } = req.body;

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

    // Generate unique payment QR code
    const paymentData = {
      customerId,
      restaurantId,
      amount,
      paymentMethod,
      voucherId: voucherId || null,
      generalVoucherId: generalVoucherId || null,
      timestamp: Date.now(),
      nonce: nanoid(16)
    };

    // Create simplified data string for QR code
    const simpleData = `PAY:${customerId}:${restaurantId}:${amount}:${Date.now()}`;
    const qrCodeData = `EATOFF_PAYMENT:${Buffer.from(JSON.stringify(paymentData)).toString('base64')}`;
    
    // Generate QR code with qr-image library
    let qrCodeImage;
    try {
      console.log("Generating QR for simple data:", simpleData);
      
      // Generate QR code as PNG buffer
      const qrBuffer = qr.imageSync(simpleData, { 
        type: 'png',
        size: 10,
        margin: 2,
        ec_level: 'M'
      });
      
      // Convert buffer to base64 data URL
      qrCodeImage = `data:image/png;base64,${qrBuffer.toString('base64')}`;
      
      console.log("QR Code generated successfully with length:", qrCodeImage.length);
      console.log("QR Image starts:", qrCodeImage.substring(0, 30));
      
    } catch (error) {
      console.error("QR Code generation error:", error);
      throw new Error("Failed to generate QR code");
    }
    
    console.log("QR Code Data length:", simpleData.length);
    console.log("QR Code Image starts with:", qrCodeImage.substring(0, 50));

    // Create QR code record with expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Skip database storage for now since storage methods are not implemented
    // await storage.createQrCode({
    //   qrCodeData,
    //   qrCodeType: "payment_request", 
    //   customerId,
    //   restaurantId,
    //   isActive: true,
    //   expiresAt
    // });

    res.json({
      qrCode: simpleData,
      qrCodeImage,
      paymentDetails: {
        customerName: customer.name,
        restaurantName: restaurant.name,
        amount,
        paymentMethod,
        expiresAt
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: "Error generating payment QR: " + error.message });
  }
});

// Process QR code payment (restaurant endpoint)
router.post("/restaurants/:id/process-qr-payment", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const { qrCodeData, verifiedBy } = req.body;

    if (!qrCodeData) {
      return res.status(400).json({ message: "QR code data is required" });
    }

    // Verify QR code
    const qrRecord = await storage.getQrCodeByData(qrCodeData);
    if (!qrRecord || !qrRecord.isActive) {
      return res.status(400).json({ message: "Invalid or expired QR code" });
    }

    // Check expiry
    if (qrRecord.expiresAt && new Date() > qrRecord.expiresAt) {
      return res.status(400).json({ message: "QR code has expired" });
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

    // Get customer and wallet
    const customer = await storage.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const wallet = await storage.getCustomerWallet(customerId);
    if (!wallet) {
      return res.status(400).json({ message: "Customer wallet not found" });
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

    if (paymentMethod === "voucher" && voucherId) {
      const voucher = await storage.getPurchasedVoucherById(voucherId);
      if (voucher && voucher.customerId === customerId && voucher.status === "active") {
        const mealValue = parseFloat(voucher.purchasePrice) / voucher.totalMeals;
        if (mealValue >= totalAmount) {
          paymentBreakdown.voucherValue = totalAmount;
          paymentValid = true;
          
          // Update voucher usage
          await storage.updateVoucherUsage(voucherId, voucher.usedMeals + 1);
        }
      }
    } else if (paymentMethod === "points") {
      const pointsNeeded = Math.ceil(totalAmount * 100); // 100 points = €1
      if (wallet.loyaltyPoints >= pointsNeeded) {
        paymentBreakdown.pointsUsed = pointsNeeded;
        paymentValid = true;
        
        // Deduct points
        await storage.updateCustomerPoints(customerId, -pointsNeeded);
      }
    } else if (paymentMethod === "cash") {
      const walletBalance = parseFloat(wallet.cashBalance);
      if (walletBalance >= totalAmount) {
        paymentBreakdown.cashUsed = totalAmount;
        paymentValid = true;
        
        // Deduct cash
        await storage.updateWalletBalance(customerId, (walletBalance - totalAmount).toFixed(2));
      }
    } else if (paymentMethod === "general_voucher" && generalVoucherId) {
      const genVoucher = await storage.getCustomerGeneralVoucherById(generalVoucherId);
      if (genVoucher && genVoucher.customerId === customerId && genVoucher.status === "active") {
        const discount = calculateGeneralVoucherDiscount(genVoucher, totalAmount);
        paymentBreakdown.generalVoucherDiscount = discount;
        paymentBreakdown.cashUsed = totalAmount - discount;
        paymentValid = true;
        
        // Mark voucher as used if single use
        const voucher = await storage.getGeneralVoucherById(genVoucher.generalVoucherId);
        if (voucher?.usageLimit === 1) {
          await storage.updateCustomerGeneralVoucherStatus(generalVoucherId, "used");
        }
      }
    }

    if (!paymentValid) {
      return res.status(400).json({ message: "Payment method insufficient or invalid" });
    }

    // Calculate platform commission (5%)
    const platformCommission = totalAmount * 0.05;
    const restaurantReceives = totalAmount - platformCommission;

    // Create payment transaction
    const transaction = await storage.createPaymentTransaction({
      customerId,
      restaurantId,
      transactionType: paymentMethod === "voucher" ? "voucher_payment" : 
                      paymentMethod === "general_voucher" ? "general_voucher_payment" : "menu_payment",
      amount: totalAmount.toFixed(2),
      paymentMethod,
      voucherValue: paymentBreakdown.voucherValue.toFixed(2),
      pointsUsed: paymentBreakdown.pointsUsed,
      cashUsed: paymentBreakdown.cashUsed.toFixed(2),
      generalVoucherDiscount: paymentBreakdown.generalVoucherDiscount.toFixed(2),
      platformCommission: platformCommission.toFixed(2),
      restaurantReceives: restaurantReceives.toFixed(2),
      qrCodeScanned: qrCodeData,
      transactionStatus: "completed",
      voucherId: voucherId || null,
      generalVoucherId: generalVoucherId || null,
      processedAt: new Date(),
      verifiedBy: verifiedBy || null
    });

    // Deactivate QR code
    await storage.deactivateQrCode(qrRecord.id);

    // Create wallet transaction for record
    await storage.createWalletTransaction({
      customerId,
      transactionType: "payment",
      amount: `-${paymentBreakdown.cashUsed.toFixed(2)}`,
      description: `Payment to ${(await storage.getRestaurantById(restaurantId))?.name}`,
      balanceBefore: wallet.cashBalance,
      balanceAfter: (parseFloat(wallet.cashBalance) - paymentBreakdown.cashUsed).toFixed(2),
      restaurantId,
      paymentTransactionId: transaction.id
    });

    res.json({
      success: true,
      transaction,
      paymentBreakdown,
      message: "Payment processed successfully"
    });

  } catch (error: any) {
    res.status(500).json({ message: "Error processing QR payment: " + error.message });
  }
});

// Get payment transactions for restaurant
router.get("/restaurants/:id/transactions", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const { page = 1, limit = 50, status, type } = req.query;
    
    const filters = {
      status: status as string,
      type: type as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const transactions = await storage.getRestaurantTransactions(restaurantId, filters);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching transactions: " + error.message });
  }
});

// Helper functions
function calculateTotalWalletValue(wallet: any, vouchers: any[], generalVouchers: any[]): string {
  let total = parseFloat(wallet.cashBalance);
  total += (wallet.loyaltyPoints / 100); // Points value
  
  vouchers.forEach(voucher => {
    const remainingMeals = voucher.totalMeals - voucher.usedMeals;
    const mealValue = parseFloat(voucher.purchasePrice) / voucher.totalMeals;
    total += remainingMeals * mealValue;
  });
  
  generalVouchers.forEach(gv => {
    total += parseFloat(gv.purchasePrice);
  });
  
  return total.toFixed(2);
}

function calculateGeneralVoucherDiscount(customerVoucher: any, orderAmount: number): number {
  // This would implement the actual discount calculation based on voucher type
  // For now, simplified implementation
  return Math.min(orderAmount * 0.1, parseFloat(customerVoucher.purchasePrice)); // 10% or voucher value
}

// ============================================
// CASHBACK & CREDIT SYSTEM ROUTES
// ============================================

// Helper to get customer ID from various auth sources
const getAuthCustomerId = async (req: Request): Promise<number | null> => {
  const mobileUser = (req as any).mobileUser;
  const user = (req as any).user;
  const authUser = mobileUser || user;
  
  console.log('[WalletRoutes] getAuthCustomerId called');
  console.log('[WalletRoutes] mobileUser:', mobileUser ? { id: mobileUser.id, email: mobileUser.email, customerId: mobileUser.customerId } : null);
  console.log('[WalletRoutes] user:', user ? { id: user.id, email: user.email, customerId: user.customerId } : null);
  
  if (authUser) {
    // Check if customerId is directly available
    if (typeof authUser.customerId === 'number') {
      console.log('[WalletRoutes] Found customerId directly:', authUser.customerId);
      return authUser.customerId;
    }
    if (typeof authUser.id === 'number') {
      console.log('[WalletRoutes] Found numeric id:', authUser.id);
      return authUser.id;
    }
    
    // For OAuth users (Apple/Google), look up or create customer by email
    if (authUser.email && typeof authUser.id === 'string') {
      console.log('[WalletRoutes] OAuth user, looking up customer by email:', authUser.email);
      
      let [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.email, authUser.email))
        .limit(1);
      
      // If customer doesn't exist, create one
      if (!customer) {
        console.log('[WalletRoutes] Customer not found, creating one for:', authUser.email);
        const fullName = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || 'User';
        const [newCustomer] = await db
          .insert(customers)
          .values({
            name: fullName,
            email: authUser.email,
            phone: null,
            passwordHash: null,
            balance: "0.00",
            loyaltyPoints: 0,
            totalPointsEarned: 0,
            membershipTier: "Bronze"
          })
          .returning({ id: customers.id });
        console.log('[WalletRoutes] Customer created with ID:', newCustomer?.id);
        customer = newCustomer;
      }
      
      if (customer) {
        console.log('[WalletRoutes] Found/created customer ID:', customer.id);
        return customer.id;
      }
    }
  }
  
  const sessionOwnerId = (req.session as any)?.ownerId;
  if (typeof sessionOwnerId === 'number') {
    console.log('[WalletRoutes] Found sessionOwnerId:', sessionOwnerId);
    return sessionOwnerId;
  }
  
  console.log('[WalletRoutes] No customer ID found');
  return null;
};

// Get complete wallet overview with cashback and credit info
router.get("/wallet/overview", async (req: Request, res: Response) => {
  console.log('[WalletOverview] Request received');
  try {
    console.log('[WalletOverview] Getting customerId...');
    const customerId = await getAuthCustomerId(req);
    console.log('[WalletOverview] CustomerId:', customerId);
    
    if (!customerId) {
      console.log('[WalletOverview] No customerId, returning 401');
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Fetch personal balance from customers table
    let personalBalance = "0.00";
    try {
      const [customer] = await db
        .select({ balance: customers.balance })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);
      personalBalance = customer?.balance || "0.00";
    } catch (dbErr) {
      console.error('[WalletOverview] Error fetching personal balance:', dbErr);
    }
    
    // Fetch cashback balance
    let cashbackBalance: any = null;
    try {
      const result = await db
        .select()
        .from(customerCashbackBalance)
        .where(eq(customerCashbackBalance.customerId, customerId))
        .limit(1);
      cashbackBalance = result[0];
    } catch (dbErr) {
      console.error('[WalletOverview] Error fetching cashback balance:', dbErr);
    }
    
    console.log('[WalletOverview] Fetching credit account...');
    let creditAccount: any = null;
    try {
      const result = await db
        .select()
        .from(customerCreditAccount)
        .where(eq(customerCreditAccount.customerId, customerId))
        .limit(1);
      creditAccount = result[0];
      console.log('[WalletOverview] Credit account fetched:', !!creditAccount);
    } catch (dbErr) {
      console.error('[WalletOverview] Error fetching credit account:', dbErr);
    }
    
    console.log('[WalletOverview] Fetching cashback enrollments...');
    let cashbackEnrollments: any[] = [];
    try {
      cashbackEnrollments = await db
        .select({
          enrollment: customerCashbackEnrollments,
          group: cashbackGroups
        })
        .from(customerCashbackEnrollments)
        .leftJoin(cashbackGroups, eq(customerCashbackEnrollments.groupId, cashbackGroups.id))
        .where(and(
          eq(customerCashbackEnrollments.customerId, customerId),
          eq(customerCashbackEnrollments.isActive, true)
        ));
      console.log('[WalletOverview] Cashback enrollments fetched:', cashbackEnrollments.length);
    } catch (dbErr) {
      console.error('[WalletOverview] Error fetching cashback enrollments:', dbErr);
    }
    
    console.log('[WalletOverview] Fetching loyalty enrollments...');
    let loyaltyEnrollments: any[] = [];
    try {
      loyaltyEnrollments = await db
        .select({
          enrollment: customerLoyaltyEnrollments,
          group: loyaltyGroups
        })
        .from(customerLoyaltyEnrollments)
        .leftJoin(loyaltyGroups, eq(customerLoyaltyEnrollments.groupId, loyaltyGroups.id))
        .where(and(
          eq(customerLoyaltyEnrollments.customerId, customerId),
          eq(customerLoyaltyEnrollments.isActive, true)
        ));
      console.log('[WalletOverview] Loyalty enrollments fetched:', loyaltyEnrollments.length);
    } catch (dbErr) {
      console.error('[WalletOverview] Error fetching loyalty enrollments:', dbErr);
    }
    
    console.log('[WalletOverview] Fetching restaurant cashbacks...');
    let restaurantCashbacks: any[] = [];
    try {
      restaurantCashbacks = await db
        .select()
        .from(customerRestaurantCashback)
        .where(eq(customerRestaurantCashback.customerId, customerId));
      console.log('[WalletOverview] Restaurant cashbacks fetched:', restaurantCashbacks.length);
    } catch (dbErr) {
      console.error('[WalletOverview] Error fetching restaurant cashbacks:', dbErr);
    }
    
    const response = {
      personalBalance,
      cashback: cashbackBalance || {
        eatoffCashbackBalance: "0.00",
        totalCashbackBalance: "0.00",
        totalCashbackEarned: "0.00",
        totalCashbackUsed: "0.00"
      },
      credit: creditAccount || {
        status: "not_requested",
        creditLimit: "0.00",
        availableCredit: "0.00",
        usedCredit: "0.00",
        defaultDisplayLimit: "1000.00"
      },
      cashbackEnrollments,
      loyaltyEnrollments,
      restaurantCashbacks
    };
    
    console.log('[WalletOverview] Sending response');
    res.json(response);
  } catch (error: any) {
    console.error('[WalletOverview] Fatal error:', error.message, error.stack);
    res.status(500).json({ message: "Failed to fetch wallet overview: " + error.message });
  }
});

// Request credit on account
router.post("/wallet/credit/request", async (req: Request, res: Response) => {
  try {
    const customerId = await getAuthCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const { requestedAmount } = req.body;
    
    // Check if customer already has a credit account
    const [existing] = await db
      .select()
      .from(customerCreditAccount)
      .where(eq(customerCreditAccount.customerId, customerId))
      .limit(1);
    
    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ message: "Credit request already pending" });
      }
      if (existing.status === "approved") {
        return res.status(400).json({ message: "Credit already approved" });
      }
      
      // Update existing request
      const [updated] = await db
        .update(customerCreditAccount)
        .set({
          status: "pending",
          requestedAt: new Date(),
          requestedAmount: requestedAmount || "1000.00",
          rejectedAt: null,
          rejectionReason: null,
          updatedAt: new Date()
        })
        .where(eq(customerCreditAccount.id, existing.id))
        .returning();
      
      return res.json(updated);
    }
    
    // Create new credit account request
    const [creditAccount] = await db
      .insert(customerCreditAccount)
      .values({
        customerId,
        status: "pending",
        requestedAt: new Date(),
        requestedAmount: requestedAmount || "1000.00",
        defaultDisplayLimit: "1000.00"
      })
      .returning();
    
    res.json(creditAccount);
  } catch (error) {
    console.error("Error requesting credit:", error);
    res.status(500).json({ message: "Failed to request credit" });
  }
});

// Get credit account status
router.get("/wallet/credit", async (req: Request, res: Response) => {
  try {
    const customerId = await getAuthCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const [creditAccount] = await db
      .select()
      .from(customerCreditAccount)
      .where(eq(customerCreditAccount.customerId, customerId))
      .limit(1);
    
    res.json(creditAccount || {
      status: "not_requested",
      creditLimit: "0.00",
      availableCredit: "0.00",
      usedCredit: "0.00",
      defaultDisplayLimit: "1000.00"
    });
  } catch (error) {
    console.error("Error fetching credit:", error);
    res.status(500).json({ message: "Failed to fetch credit" });
  }
});

// Get cashback transactions
router.get("/wallet/cashback/transactions", async (req: Request, res: Response) => {
  try {
    const customerId = await getAuthCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const transactions = await db
      .select()
      .from(cashbackTransactions)
      .where(eq(cashbackTransactions.customerId, customerId))
      .orderBy(desc(cashbackTransactions.createdAt))
      .limit(50);
    
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching cashback transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// Get credit transactions
router.get("/wallet/credit/transactions", async (req: Request, res: Response) => {
  try {
    const customerId = await getAuthCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.customerId, customerId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(50);
    
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching credit transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// ============================================
// ADMIN ROUTES FOR CASHBACK GROUPS
// ============================================

// Get all EatOff cashback groups
router.get("/admin/cashback-groups", async (req: Request, res: Response) => {
  try {
    const groups = await db
      .select()
      .from(cashbackGroups)
      .where(isNull(cashbackGroups.restaurantId))
      .orderBy(desc(cashbackGroups.priority));
    
    res.json(groups);
  } catch (error) {
    console.error("Error fetching cashback groups:", error);
    res.status(500).json({ message: "Failed to fetch cashback groups" });
  }
});

// Create EatOff cashback group
router.post("/admin/cashback-groups", async (req: Request, res: Response) => {
  try {
    const data = insertCashbackGroupSchema.parse(req.body);
    
    const [group] = await db
      .insert(cashbackGroups)
      .values({
        ...data,
        restaurantId: null // EatOff group
      })
      .returning();
    
    res.json(group);
  } catch (error) {
    console.error("Error creating cashback group:", error);
    res.status(500).json({ message: "Failed to create cashback group" });
  }
});

// Update EatOff cashback group
router.patch("/admin/cashback-groups/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    
    const [group] = await db
      .update(cashbackGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(cashbackGroups.id, id), isNull(cashbackGroups.restaurantId)))
      .returning();
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    res.json(group);
  } catch (error) {
    console.error("Error updating cashback group:", error);
    res.status(500).json({ message: "Failed to update cashback group" });
  }
});

// Get all pending credit requests
router.get("/admin/credit-requests", async (req: Request, res: Response) => {
  try {
    const requests = await db
      .select({
        creditAccount: customerCreditAccount,
        customer: customers
      })
      .from(customerCreditAccount)
      .leftJoin(customers, eq(customerCreditAccount.customerId, customers.id))
      .where(eq(customerCreditAccount.status, "pending"))
      .orderBy(customerCreditAccount.requestedAt);
    
    res.json(requests);
  } catch (error) {
    console.error("Error fetching credit requests:", error);
    res.status(500).json({ message: "Failed to fetch credit requests" });
  }
});

// Approve credit request
router.post("/admin/credit-requests/:id/approve", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { creditLimit, interestRate, paymentTermDays, approvedBy } = req.body;
    
    const [updated] = await db
      .update(customerCreditAccount)
      .set({
        status: "approved",
        creditLimit: creditLimit || "1000.00",
        availableCredit: creditLimit || "1000.00",
        interestRate: interestRate || "0.00",
        paymentTermDays: paymentTermDays || 30,
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date()
      })
      .where(eq(customerCreditAccount.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ message: "Credit request not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error approving credit:", error);
    res.status(500).json({ message: "Failed to approve credit" });
  }
});

// Reject credit request
router.post("/admin/credit-requests/:id/reject", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { rejectionReason } = req.body;
    
    const [updated] = await db
      .update(customerCreditAccount)
      .set({
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || "Request not approved",
        updatedAt: new Date()
      })
      .where(eq(customerCreditAccount.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ message: "Credit request not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error rejecting credit:", error);
    res.status(500).json({ message: "Failed to reject credit" });
  }
});

// ============================================
// RESTAURANT ROUTES FOR CASHBACK & LOYALTY
// ============================================

// Get restaurant cashback groups
router.get("/restaurant/:restaurantId/cashback-groups", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    
    const groups = await db
      .select()
      .from(cashbackGroups)
      .where(eq(cashbackGroups.restaurantId, restaurantId))
      .orderBy(desc(cashbackGroups.priority));
    
    res.json(groups);
  } catch (error) {
    console.error("Error fetching restaurant cashback groups:", error);
    res.status(500).json({ message: "Failed to fetch cashback groups" });
  }
});

// Create restaurant cashback group
router.post("/restaurant/:restaurantId/cashback-groups", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const data = insertCashbackGroupSchema.parse(req.body);
    
    const [group] = await db
      .insert(cashbackGroups)
      .values({
        ...data,
        restaurantId
      })
      .returning();
    
    res.json(group);
  } catch (error) {
    console.error("Error creating restaurant cashback group:", error);
    res.status(500).json({ message: "Failed to create cashback group" });
  }
});

// Update restaurant cashback group
router.patch("/restaurant/:restaurantId/cashback-groups/:id", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const id = parseInt(req.params.id);
    const data = req.body;
    
    const [group] = await db
      .update(cashbackGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(cashbackGroups.id, id), eq(cashbackGroups.restaurantId, restaurantId)))
      .returning();
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    res.json(group);
  } catch (error) {
    console.error("Error updating restaurant cashback group:", error);
    res.status(500).json({ message: "Failed to update cashback group" });
  }
});

// Get restaurant loyalty groups
router.get("/restaurant/:restaurantId/loyalty-groups", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    
    const groups = await db
      .select()
      .from(loyaltyGroups)
      .where(eq(loyaltyGroups.restaurantId, restaurantId))
      .orderBy(loyaltyGroups.tierLevel);
    
    res.json(groups);
  } catch (error) {
    console.error("Error fetching loyalty groups:", error);
    res.status(500).json({ message: "Failed to fetch loyalty groups" });
  }
});

// Create restaurant loyalty group
router.post("/restaurant/:restaurantId/loyalty-groups", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const data = insertLoyaltyGroupSchema.parse(req.body);
    
    const [group] = await db
      .insert(loyaltyGroups)
      .values({
        ...data,
        restaurantId
      })
      .returning();
    
    res.json(group);
  } catch (error) {
    console.error("Error creating loyalty group:", error);
    res.status(500).json({ message: "Failed to create loyalty group" });
  }
});

// Update restaurant loyalty group
router.patch("/restaurant/:restaurantId/loyalty-groups/:id", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const id = parseInt(req.params.id);
    const data = req.body;
    
    const [group] = await db
      .update(loyaltyGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(loyaltyGroups.id, id), eq(loyaltyGroups.restaurantId, restaurantId)))
      .returning();
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    res.json(group);
  } catch (error) {
    console.error("Error updating loyalty group:", error);
    res.status(500).json({ message: "Failed to update loyalty group" });
  }
});

// ============================================
// CUSTOMER ENROLLMENT (via QR scan)
// ============================================

// Enroll customer in cashback group
router.post("/restaurant/:restaurantId/enroll-customer/cashback", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { customerId, groupId, enrolledByUserId } = req.body;
    
    // Verify the group belongs to this restaurant
    const [group] = await db
      .select()
      .from(cashbackGroups)
      .where(and(eq(cashbackGroups.id, groupId), eq(cashbackGroups.restaurantId, restaurantId)))
      .limit(1);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found for this restaurant" });
    }
    
    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(customerCashbackEnrollments)
      .where(and(
        eq(customerCashbackEnrollments.customerId, customerId),
        eq(customerCashbackEnrollments.groupId, groupId)
      ))
      .limit(1);
    
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ message: "Customer already enrolled in this group" });
      }
      // Reactivate
      const [updated] = await db
        .update(customerCashbackEnrollments)
        .set({ isActive: true, deactivatedAt: null })
        .where(eq(customerCashbackEnrollments.id, existing.id))
        .returning();
      return res.json(updated);
    }
    
    // Create enrollment
    const [enrollment] = await db
      .insert(customerCashbackEnrollments)
      .values({
        customerId,
        groupId,
        enrolledBy: "restaurant_scan",
        enrolledByUserId
      })
      .returning();
    
    // Initialize restaurant cashback tracking if not exists
    const [existingCashback] = await db
      .select()
      .from(customerRestaurantCashback)
      .where(and(
        eq(customerRestaurantCashback.customerId, customerId),
        eq(customerRestaurantCashback.restaurantId, restaurantId)
      ))
      .limit(1);
    
    if (!existingCashback) {
      await db.insert(customerRestaurantCashback).values({
        customerId,
        restaurantId
      });
    }
    
    res.json(enrollment);
  } catch (error) {
    console.error("Error enrolling customer:", error);
    res.status(500).json({ message: "Failed to enroll customer" });
  }
});

// Enroll customer in loyalty group
router.post("/restaurant/:restaurantId/enroll-customer/loyalty", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { customerId, groupId, enrolledByUserId } = req.body;
    
    // Verify the group belongs to this restaurant
    const [group] = await db
      .select()
      .from(loyaltyGroups)
      .where(and(eq(loyaltyGroups.id, groupId), eq(loyaltyGroups.restaurantId, restaurantId)))
      .limit(1);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found for this restaurant" });
    }
    
    // Check if already enrolled in any loyalty group for this restaurant
    const [existing] = await db
      .select()
      .from(customerLoyaltyEnrollments)
      .where(and(
        eq(customerLoyaltyEnrollments.customerId, customerId),
        eq(customerLoyaltyEnrollments.restaurantId, restaurantId),
        eq(customerLoyaltyEnrollments.isActive, true)
      ))
      .limit(1);
    
    if (existing) {
      // Update to new group
      const [updated] = await db
        .update(customerLoyaltyEnrollments)
        .set({ 
          groupId,
          upgradedFromGroupId: existing.groupId,
          upgradedAt: new Date()
        })
        .where(eq(customerLoyaltyEnrollments.id, existing.id))
        .returning();
      return res.json(updated);
    }
    
    // Create enrollment
    const [enrollment] = await db
      .insert(customerLoyaltyEnrollments)
      .values({
        customerId,
        groupId,
        restaurantId,
        enrolledBy: "restaurant_scan",
        enrolledByUserId
      })
      .returning();
    
    res.json(enrollment);
  } catch (error) {
    console.error("Error enrolling customer in loyalty:", error);
    res.status(500).json({ message: "Failed to enroll customer" });
  }
});

// Get customer info by ID (for restaurant scanning)
router.get("/restaurant/:restaurantId/customer/:customerId", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const customerId = parseInt(req.params.customerId);
    
    // Get customer basic info
    const [customer] = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        profilePicture: customers.profilePicture
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    // Get customer's cashback enrollments for this restaurant
    const cashbackEnrollmentsList = await db
      .select({
        enrollment: customerCashbackEnrollments,
        group: cashbackGroups
      })
      .from(customerCashbackEnrollments)
      .leftJoin(cashbackGroups, eq(customerCashbackEnrollments.groupId, cashbackGroups.id))
      .where(and(
        eq(customerCashbackEnrollments.customerId, customerId),
        eq(cashbackGroups.restaurantId, restaurantId),
        eq(customerCashbackEnrollments.isActive, true)
      ));
    
    // Get customer's loyalty enrollment for this restaurant
    const [loyaltyEnrollment] = await db
      .select({
        enrollment: customerLoyaltyEnrollments,
        group: loyaltyGroups
      })
      .from(customerLoyaltyEnrollments)
      .leftJoin(loyaltyGroups, eq(customerLoyaltyEnrollments.groupId, loyaltyGroups.id))
      .where(and(
        eq(customerLoyaltyEnrollments.customerId, customerId),
        eq(customerLoyaltyEnrollments.restaurantId, restaurantId),
        eq(customerLoyaltyEnrollments.isActive, true)
      ))
      .limit(1);
    
    // Get restaurant cashback balance
    const [restaurantCashback] = await db
      .select()
      .from(customerRestaurantCashback)
      .where(and(
        eq(customerRestaurantCashback.customerId, customerId),
        eq(customerRestaurantCashback.restaurantId, restaurantId)
      ))
      .limit(1);
    
    res.json({
      customer,
      cashbackEnrollments: cashbackEnrollmentsList,
      loyaltyEnrollment,
      restaurantCashback: restaurantCashback || { cashbackBalance: "0.00", totalSpent: "0.00" }
    });
  } catch (error) {
    console.error("Error fetching customer info:", error);
    res.status(500).json({ message: "Failed to fetch customer info" });
  }
});

// ============================================================
// ADMIN ENDPOINTS FOR WALLET MANAGEMENT
// ============================================================

// Get all EatOff cashback groups (admin)
router.get("/admin/eatoff-cashback-groups", async (req, res) => {
  try {
    const groups = await db
      .select()
      .from(cashbackGroups)
      .where(isNull(cashbackGroups.restaurantId))
      .orderBy(desc(cashbackGroups.createdAt));
    
    res.json(groups);
  } catch (error) {
    console.error("Error fetching EatOff cashback groups:", error);
    res.status(500).json({ message: "Failed to fetch cashback groups" });
  }
});

// Create EatOff cashback group (admin)
router.post("/admin/eatoff-cashback-groups", async (req, res) => {
  try {
    const { name, description, cashbackPercentage } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }
    
    const [group] = await db.insert(cashbackGroups).values({
      name,
      description: description || null,
      cashbackPercentage: cashbackPercentage || "3.00",
      restaurantId: null, // EatOff-wide group
      isActive: true,
    }).returning();
    
    res.json(group);
  } catch (error) {
    console.error("Error creating EatOff cashback group:", error);
    res.status(500).json({ message: "Failed to create cashback group" });
  }
});

// Update EatOff cashback group (admin)
router.patch("/admin/eatoff-cashback-groups/:id", async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { name, description, cashbackPercentage, isActive } = req.body;
    
    const [group] = await db.update(cashbackGroups)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(cashbackPercentage !== undefined && { cashbackPercentage }),
        ...(isActive !== undefined && { isActive }),
      })
      .where(eq(cashbackGroups.id, groupId))
      .returning();
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    res.json(group);
  } catch (error) {
    console.error("Error updating EatOff cashback group:", error);
    res.status(500).json({ message: "Failed to update cashback group" });
  }
});

// Get all credit requests (admin)
router.get("/admin/credit-requests", async (req, res) => {
  try {
    const requests = await db
      .select({
        id: customerCreditAccount.id,
        customerId: customerCreditAccount.customerId,
        requestedAmount: customerCreditAccount.creditLimit,
        status: customerCreditAccount.status,
        createdAt: customerCreditAccount.createdAt,
        customer: {
          name: customers.name,
          email: customers.email,
        }
      })
      .from(customerCreditAccount)
      .leftJoin(customers, eq(customerCreditAccount.customerId, customers.id))
      .orderBy(desc(customerCreditAccount.createdAt));
    
    res.json(requests);
  } catch (error) {
    console.error("Error fetching credit requests:", error);
    res.status(500).json({ message: "Failed to fetch credit requests" });
  }
});

// Approve credit request (admin)
router.post("/admin/credit-requests/:id/approve", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    const [creditAccount] = await db.update(customerCreditAccount)
      .set({
        status: "approved",
        approvedAt: new Date(),
      })
      .where(eq(customerCreditAccount.id, requestId))
      .returning();
    
    if (!creditAccount) {
      return res.status(404).json({ message: "Credit request not found" });
    }
    
    res.json({ message: "Credit approved", creditAccount });
  } catch (error) {
    console.error("Error approving credit request:", error);
    res.status(500).json({ message: "Failed to approve credit request" });
  }
});

// Reject credit request (admin)
router.post("/admin/credit-requests/:id/reject", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    const [creditAccount] = await db.update(customerCreditAccount)
      .set({
        status: "rejected",
      })
      .where(eq(customerCreditAccount.id, requestId))
      .returning();
    
    if (!creditAccount) {
      return res.status(404).json({ message: "Credit request not found" });
    }
    
    res.json({ message: "Credit rejected", creditAccount });
  } catch (error) {
    console.error("Error rejecting credit request:", error);
    res.status(500).json({ message: "Failed to reject credit request" });
  }
});

// ============================================
// CREDIT TYPES CRUD (Admin)
// ============================================

// Get all credit types (public - for customer credit request form)
router.get("/credit-types", async (req, res) => {
  try {
    const types = await db
      .select()
      .from(creditTypes)
      .where(eq(creditTypes.isActive, true))
      .orderBy(creditTypes.displayOrder);
    
    res.json(types);
  } catch (error) {
    console.error("Error fetching credit types:", error);
    res.status(500).json({ message: "Failed to fetch credit types" });
  }
});

// Get all credit types (admin - includes inactive)
router.get("/admin/credit-types", async (req, res) => {
  try {
    const types = await db
      .select()
      .from(creditTypes)
      .orderBy(creditTypes.displayOrder);
    
    res.json(types);
  } catch (error) {
    console.error("Error fetching credit types:", error);
    res.status(500).json({ message: "Failed to fetch credit types" });
  }
});

// Create credit type (admin)
router.post("/admin/credit-types", async (req, res) => {
  try {
    const validatedData = insertCreditTypeSchema.parse(req.body);
    
    const [newType] = await db.insert(creditTypes).values(validatedData).returning();
    
    res.status(201).json(newType);
  } catch (error) {
    console.error("Error creating credit type:", error);
    res.status(500).json({ message: "Failed to create credit type" });
  }
});

// Update credit type (admin)
router.patch("/admin/credit-types/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const [updated] = await db
      .update(creditTypes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(creditTypes.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ message: "Credit type not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating credit type:", error);
    res.status(500).json({ message: "Failed to update credit type" });
  }
});

// Delete credit type (admin)
router.delete("/admin/credit-types/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Soft delete - just mark as inactive
    const [updated] = await db
      .update(creditTypes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(creditTypes.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ message: "Credit type not found" });
    }
    
    res.json({ message: "Credit type deleted" });
  } catch (error) {
    console.error("Error deleting credit type:", error);
    res.status(500).json({ message: "Failed to delete credit type" });
  }
});

// ============================================
// CUSTOMER CREDIT REQUEST WITH PERSONAL DATA
// ============================================

// Submit credit request with personal data
router.post("/credit-request", async (req: Request, res: Response) => {
  try {
    // Get user from session
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Trebuie să fiți autentificat" });
    }
    
    // Find customer by user ID
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1);
    
    if (!customer) {
      return res.status(404).json({ message: "Profilul clientului nu a fost găsit" });
    }
    
    const customerId = customer.id;
    
    const {
      creditTypeId,
      requestedAmount, // For custom amount
      fullName,
      cnp,
      phone,
      email,
      address,
      city,
      county,
      postalCode,
      employmentStatus,
      monthlyIncome,
      employer
    } = req.body;
    
    // Validate CNP format (13 digits for Romania)
    if (!cnp || !/^\d{13}$/.test(cnp)) {
      return res.status(400).json({ message: "CNP invalid. Trebuie să conțină exact 13 cifre." });
    }
    
    // Validate required fields
    if (!fullName || !phone || !address || !city || !county) {
      return res.status(400).json({ message: "Toate câmpurile obligatorii trebuie completate." });
    }
    
    // Get credit type details
    let finalAmount = requestedAmount;
    if (creditTypeId) {
      const [creditType] = await db
        .select()
        .from(creditTypes)
        .where(eq(creditTypes.id, creditTypeId))
        .limit(1);
      
      if (!creditType) {
        return res.status(400).json({ message: "Tip credit invalid" });
      }
      
      if (creditType.isCustomAmount) {
        // Validate custom amount is within limits
        const min = parseFloat(creditType.minCustomAmount || '100');
        const max = parseFloat(creditType.maxCustomAmount || '10000');
        if (!requestedAmount || requestedAmount < min || requestedAmount > max) {
          return res.status(400).json({ 
            message: `Suma trebuie să fie între ${min} și ${max} RON` 
          });
        }
      } else {
        finalAmount = parseFloat(creditType.amount);
      }
    }
    
    // Check if customer already has a credit account
    const [existingAccount] = await db
      .select()
      .from(customerCreditAccount)
      .where(eq(customerCreditAccount.customerId, customerId))
      .limit(1);
    
    if (existingAccount) {
      if (existingAccount.status === 'pending') {
        return res.status(400).json({ message: "Aveți deja o cerere de credit în așteptare." });
      }
      if (existingAccount.status === 'approved') {
        return res.status(400).json({ message: "Aveți deja un credit aprobat." });
      }
      
      // Update existing account (for rejected -> resubmit)
      const [updated] = await db.update(customerCreditAccount)
        .set({
          status: 'pending',
          creditTypeId,
          requestedAmount: finalAmount.toString(),
          fullName,
          cnp,
          phone,
          email,
          address,
          city,
          county,
          postalCode,
          employmentStatus,
          monthlyIncome: monthlyIncome?.toString(),
          employer,
          requestedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null,
          updatedAt: new Date()
        })
        .where(eq(customerCreditAccount.id, existingAccount.id))
        .returning();
      
      return res.json({ message: "Cerere de credit reînnoită", creditAccount: updated });
    }
    
    // Create new credit account with request
    const [newAccount] = await db.insert(customerCreditAccount).values({
      customerId,
      creditTypeId,
      status: 'pending',
      requestedAmount: finalAmount.toString(),
      fullName,
      cnp,
      phone,
      email,
      address,
      city,
      county,
      postalCode,
      employmentStatus,
      monthlyIncome: monthlyIncome?.toString(),
      employer,
      requestedAt: new Date()
    }).returning();
    
    res.status(201).json({ message: "Cerere de credit înregistrată", creditAccount: newAccount });
  } catch (error) {
    console.error("Error submitting credit request:", error);
    res.status(500).json({ message: "Failed to submit credit request" });
  }
});

// Shared function to check and perform loyalty tier upgrade
async function checkAndUpgradeLoyaltyTier(restaurantId: number, customerId: number) {
  // Get customer's current loyalty enrollment
  const [currentEnrollment] = await db
    .select({
      enrollment: customerLoyaltyEnrollments,
      currentGroup: loyaltyGroups
    })
    .from(customerLoyaltyEnrollments)
    .leftJoin(loyaltyGroups, eq(customerLoyaltyEnrollments.groupId, loyaltyGroups.id))
    .where(and(
      eq(customerLoyaltyEnrollments.customerId, customerId),
      eq(customerLoyaltyEnrollments.restaurantId, restaurantId),
      eq(customerLoyaltyEnrollments.isActive, true)
    ))
    .limit(1);
  
  // Get customer's spending at this restaurant
  const [customerSpending] = await db
    .select()
    .from(customerRestaurantCashback)
    .where(and(
      eq(customerRestaurantCashback.customerId, customerId),
      eq(customerRestaurantCashback.restaurantId, restaurantId)
    ))
    .limit(1);
  
  const totalSpent = parseFloat(customerSpending?.totalSpent || '0');
  const visitCount = customerSpending?.visitCount || 0;
  
  // Get all loyalty groups for this restaurant, ordered by tier level ascending
  // This ensures we find the highest tier the customer qualifies for
  const allGroups = await db
    .select()
    .from(loyaltyGroups)
    .where(and(
      eq(loyaltyGroups.restaurantId, restaurantId),
      eq(loyaltyGroups.isActive, true),
      eq(loyaltyGroups.autoUpgradeEnabled, true)
    ))
    .orderBy(loyaltyGroups.tierLevel);
  
  // Find the highest tier the customer qualifies for
  let bestQualifyingGroup = null;
  for (const group of allGroups) {
    const minSpend = parseFloat(group.minSpendThreshold || '0');
    
    // Customer qualifies if they meet the minimum spend threshold
    if (totalSpent >= minSpend) {
      bestQualifyingGroup = group; // Keep updating to get highest qualifying tier
    }
  }
  
  if (!bestQualifyingGroup) {
    return { upgraded: false, message: "No tier upgrade available", currentTier: currentEnrollment?.currentGroup?.tierLevel || 0 };
  }
  
  const currentTierLevel = currentEnrollment?.currentGroup?.tierLevel || 0;
  
  // Check if upgrade is needed
  if (bestQualifyingGroup.tierLevel > currentTierLevel) {
    // Deactivate current enrollment if exists
    if (currentEnrollment) {
      await db.update(customerLoyaltyEnrollments)
        .set({ isActive: false })
        .where(eq(customerLoyaltyEnrollments.id, currentEnrollment.enrollment.id));
    }
    
    // Create new enrollment at higher tier
    const [newEnrollment] = await db.insert(customerLoyaltyEnrollments).values({
      customerId,
      restaurantId,
      groupId: bestQualifyingGroup.id,
      currentTierLevel: bestQualifyingGroup.tierLevel,
      totalSpentAtRestaurant: totalSpent.toString(),
      visitCount,
      isActive: true,
    }).returning();
    
    return {
      upgraded: true,
      previousTier: currentTierLevel,
      newTier: bestQualifyingGroup.tierLevel,
      groupName: bestQualifyingGroup.name,
      discountPercentage: bestQualifyingGroup.discountPercentage,
      enrollment: newEnrollment
    };
  }
  
  return {
    upgraded: false,
    currentTier: currentTierLevel,
    message: "Customer already at this tier or higher"
  };
}

// Auto-upgrade customer loyalty tier based on spending/visits
router.post("/restaurant/:restaurantId/check-loyalty-upgrade/:customerId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const customerId = parseInt(req.params.customerId);
    
    // TODO: Add auth check for restaurant owner
    
    const result = await checkAndUpgradeLoyaltyTier(restaurantId, customerId);
    res.json(result);
  } catch (error) {
    console.error("Error checking loyalty upgrade:", error);
    res.status(500).json({ message: "Failed to check loyalty upgrade" });
  }
});

// Update customer spending and check for tier upgrade after purchase
router.post("/restaurant/:restaurantId/record-purchase/:customerId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const customerId = parseInt(req.params.customerId);
    const { amount, description } = req.body;
    
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: "Valid amount is required" });
    }
    
    const purchaseAmount = parseFloat(amount);
    
    // Update or create restaurant cashback record
    const [existingRecord] = await db
      .select()
      .from(customerRestaurantCashback)
      .where(and(
        eq(customerRestaurantCashback.customerId, customerId),
        eq(customerRestaurantCashback.restaurantId, restaurantId)
      ))
      .limit(1);
    
    if (existingRecord) {
      await db.update(customerRestaurantCashback)
        .set({
          totalSpent: (parseFloat(existingRecord.totalSpent) + purchaseAmount).toFixed(2),
          visitCount: (existingRecord.visitCount || 0) + 1,
          lastVisitAt: new Date(),
        })
        .where(eq(customerRestaurantCashback.id, existingRecord.id));
    } else {
      await db.insert(customerRestaurantCashback).values({
        customerId,
        restaurantId,
        cashbackBalance: "0.00",
        totalSpent: purchaseAmount.toFixed(2),
        visitCount: 1,
        lastVisitAt: new Date(),
      });
    }
    
    // Calculate and add cashback if enrolled in cashback group
    const [cashbackEnrollment] = await db
      .select({
        enrollment: customerCashbackEnrollments,
        group: cashbackGroups
      })
      .from(customerCashbackEnrollments)
      .leftJoin(cashbackGroups, eq(customerCashbackEnrollments.groupId, cashbackGroups.id))
      .where(and(
        eq(customerCashbackEnrollments.customerId, customerId),
        eq(cashbackGroups.restaurantId, restaurantId),
        eq(customerCashbackEnrollments.isActive, true)
      ))
      .limit(1);
    
    let cashbackEarned = 0;
    if (cashbackEnrollment?.group) {
      const percentage = parseFloat(cashbackEnrollment.group.cashbackPercentage);
      cashbackEarned = purchaseAmount * (percentage / 100);
      
      // Update restaurant-specific cashback balance
      const [updatedRecord] = await db
        .select()
        .from(customerRestaurantCashback)
        .where(and(
          eq(customerRestaurantCashback.customerId, customerId),
          eq(customerRestaurantCashback.restaurantId, restaurantId)
        ))
        .limit(1);
      
      if (updatedRecord) {
        await db.update(customerRestaurantCashback)
          .set({
            cashbackBalance: (parseFloat(updatedRecord.cashbackBalance) + cashbackEarned).toFixed(2),
          })
          .where(eq(customerRestaurantCashback.id, updatedRecord.id));
      }
      
      // Record cashback transaction
      await db.insert(cashbackTransactions).values({
        customerId,
        restaurantId,
        amount: cashbackEarned.toFixed(2),
        type: "earned",
        description: description || `Cashback for purchase of ${purchaseAmount.toFixed(2)} RON`,
      });
    }
    
    // Check for loyalty tier upgrade using shared function
    const upgradeResult = await checkAndUpgradeLoyaltyTier(restaurantId, customerId);
    
    res.json({
      message: "Purchase recorded",
      amount: purchaseAmount,
      cashbackEarned,
      loyaltyUpgrade: upgradeResult.upgraded ? upgradeResult : null
    });
  } catch (error) {
    console.error("Error recording purchase:", error);
    res.status(500).json({ message: "Failed to record purchase" });
  }
});

// Enroll customer in EatOff cashback group (admin)
router.post("/admin/enroll-customer/cashback", async (req, res) => {
  try {
    const { customerId, groupId } = req.body;
    
    if (!customerId || !groupId) {
      return res.status(400).json({ message: "Customer ID and Group ID are required" });
    }
    
    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(customerCashbackEnrollments)
      .where(and(
        eq(customerCashbackEnrollments.customerId, customerId),
        eq(customerCashbackEnrollments.groupId, groupId),
        eq(customerCashbackEnrollments.isActive, true)
      ))
      .limit(1);
    
    if (existing) {
      return res.status(400).json({ message: "Customer already enrolled in this group" });
    }
    
    const [enrollment] = await db.insert(customerCashbackEnrollments).values({
      customerId,
      groupId,
      restaurantId: null, // EatOff-wide enrollment
      isActive: true,
    }).returning();
    
    // Create or update cashback balance
    const [existingBalance] = await db
      .select()
      .from(customerCashbackBalance)
      .where(eq(customerCashbackBalance.customerId, customerId))
      .limit(1);
    
    if (!existingBalance) {
      await db.insert(customerCashbackBalance).values({
        customerId,
        cashbackBalance: "0.00",
        totalCashbackEarned: "0.00",
        totalCashbackUsed: "0.00",
      });
    }
    
    res.json({ message: "Customer enrolled successfully", enrollment });
  } catch (error) {
    console.error("Error enrolling customer in cashback group:", error);
    res.status(500).json({ message: "Failed to enroll customer" });
  }
});

export { router as walletRoutes };