import { Router } from "express";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import * as qr from "qr-image";
import Stripe from "stripe";
import { 
  insertCustomerWalletSchema,
  insertGeneralVoucherSchema,
  insertCustomerGeneralVoucherSchema,
  insertPaymentTransactionSchema,
  insertWalletTransactionSchema,
  insertQrCodeSchema
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

export { router as walletRoutes };