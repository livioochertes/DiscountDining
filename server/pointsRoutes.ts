import { Router } from "express";
import { storage } from "./storage";
import { 
  insertPointsTransactionSchema,
  insertPointsRedemptionSchema
} from "@shared/schema";

const router = Router();

// Get customer points balance and transactions
router.get("/customers/:id/points", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    const customer = await storage.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const transactions = await storage.getPointsTransactionsByCustomer(customerId);
    
    res.json({
      customerId,
      currentPoints: customer.loyaltyPoints || 0,
      totalEarned: customer.totalPointsEarned || 0,
      membershipTier: customer.membershipTier || "bronze",
      transactions: transactions.slice(0, 50) // Limit to recent 50 transactions
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching points: " + error.message });
  }
});

// Award points to customer (for completed orders, voucher purchases, etc.)
router.post("/customers/:id/points/award", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { points, description, restaurantId, orderId, voucherId } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ message: "Invalid points amount" });
    }

    // Create points transaction
    const transaction = await storage.createPointsTransaction({
      customerId,
      restaurantId: restaurantId || null,
      orderId: orderId || null,
      voucherId: voucherId || null,
      transactionType: "earned",
      pointsAmount: points,
      description: description || "Points earned"
    });

    // Update customer points
    const updatedCustomer = await storage.updateCustomerPoints(customerId, points);

    res.json({
      transaction,
      newBalance: updatedCustomer?.loyaltyPoints || 0,
      message: `Awarded ${points} points successfully`
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error awarding points: " + error.message });
  }
});

// Redeem points for payment
router.post("/customers/:id/points/redeem", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { pointsToRedeem, restaurantId, orderId } = req.body;
    
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({ message: "Invalid points amount" });
    }

    const customer = await storage.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if ((customer.loyaltyPoints || 0) < pointsToRedeem) {
      return res.status(400).json({ message: "Insufficient points balance" });
    }

    // Redeem points
    const redemption = await storage.redeemPointsForPayment(
      customerId, 
      restaurantId, 
      pointsToRedeem, 
      orderId
    );

    const cashValue = storage.calculatePointsValue(pointsToRedeem);

    res.json({
      redemption,
      pointsRedeemed: pointsToRedeem,
      cashValue,
      message: `Redeemed ${pointsToRedeem} points for €${cashValue.toFixed(2)}`
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error redeeming points: " + error.message });
  }
});

// Get points redemption history
router.get("/customers/:id/points/redemptions", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    const redemptions = await storage.getPointsRedemptionsByCustomer(customerId);
    
    res.json(redemptions);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching redemptions: " + error.message });
  }
});

// Get points value calculation
router.get("/points/value/:points", async (req, res) => {
  try {
    const points = parseInt(req.params.points);
    
    if (!points || points <= 0) {
      return res.status(400).json({ message: "Invalid points amount" });
    }

    const cashValue = storage.calculatePointsValue(points);
    
    res.json({
      points,
      cashValue,
      exchangeRate: "100 points = €1.00" // Standard rate
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error calculating points value: " + error.message });
  }
});

// Get customer statistics for dashboard
router.get("/customers/:id/stats", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    const customer = await storage.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Get vouchers data
    const vouchers = await storage.getPurchasedVouchersByCustomer(customerId);
    const activeVouchers = vouchers.filter(v => v.status === 'active');
    
    // Calculate total spent on vouchers
    const totalVoucherSpent = vouchers.reduce((total, voucher) => total + (parseFloat(voucher.purchasePrice) || 0), 0);
    
    // Get orders data (placeholder for now since orders might be in different storage)
    // TODO: Replace with actual order queries when order storage is implemented
    let totalOrderSpent = 0;
    let totalOrders = 0;
    
    try {
      // Try to get order data if it exists
      const orders = await storage.getOrdersByCustomer ? await storage.getOrdersByCustomer(customerId) : [];
      totalOrders = orders.length;
      totalOrderSpent = orders.reduce((total: number, order: any) => total + (parseFloat(order.totalAmount) || 0), 0);
    } catch (error) {
      // Orders functionality not implemented yet, use placeholder values
      console.log("Orders not yet implemented, using placeholder values");
    }

    const totalSpent = totalVoucherSpent + totalOrderSpent;
    const remainingVoucherValue = activeVouchers.reduce((total, voucher) => {
      const mealsRemaining = voucher.totalMeals - voucher.usedMeals;
      const valuePerMeal = parseFloat(voucher.purchasePrice) / voucher.totalMeals;
      return total + (mealsRemaining * valuePerMeal);
    }, 0);

    res.json({
      totalOrders,
      totalSpent,
      pointsEarned: customer.totalPointsEarned || 0,
      vouchersOwned: activeVouchers.length,
      favoriteRestaurants: 0, // Placeholder
      membershipTier: customer.membershipTier || "bronze",
      voucherValue: totalVoucherSpent,
      orderValue: totalOrderSpent,
      remainingValue: remainingVoucherValue
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching customer stats: " + error.message });
  }
});

// Get recent orders for dashboard
router.get("/customers/:id/orders/recent", async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    const customer = await storage.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Placeholder recent orders - replace with actual order queries when implemented
    let recentOrders: any[] = [];
    
    try {
      // Try to get order data if it exists
      if (storage.getOrdersByCustomer) {
        const orders = await storage.getOrdersByCustomer(customerId);
        recentOrders = orders.slice(0, 5).map((order: any) => ({
          id: order.id,
          restaurantName: order.restaurantName || "Restaurant",
          orderNumber: order.orderNumber || `ORD-${order.id}`,
          totalAmount: `€${parseFloat(order.totalAmount || 0).toFixed(2)}`,
          status: order.status || "completed",
          orderDate: order.orderDate || order.createdAt,
          items: order.items?.length || 1
        }));
      } else {
        // Use placeholder data for now
        recentOrders = [];
      }
    } catch (error) {
      console.log("Orders not yet implemented, returning empty array");
      recentOrders = [];
    }

    res.json(recentOrders);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching recent orders: " + error.message });
  }
});

export { router as pointsRoutes };