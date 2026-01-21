import type { Express } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { storage } from "./storage";
import { sendOrderNotificationToRestaurant, sendOrderConfirmationToCustomer } from "./emailService";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const createOrderSchema = z.object({
  restaurantId: z.number(),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  customerEmail: z.string().email("Valid email is required"),
  orderType: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  specialInstructions: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.number(),
    quantity: z.number().min(1),
    specialRequests: z.string().optional(),
  })).min(1, "At least one item is required"),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

export function registerOrderRoutes(app: Express) {
  // Create order and payment intent
  app.post("/api/orders/create", async (req, res) => {
    try {
      const orderData = createOrderSchema.parse(req.body);
      
      // Get restaurant details
      const restaurant = await storage.getRestaurantById(orderData.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Calculate total amount
      let totalAmount = 0;
      const itemsWithPrices = [];

      for (const item of orderData.items) {
        const menuItem = await storage.getMenuItemById(item.menuItemId);
        if (!menuItem) {
          return res.status(404).json({ message: `Menu item ${item.menuItemId} not found` });
        }
        
        const itemPrice = parseFloat(menuItem.price);
        const itemTotal = itemPrice * item.quantity;
        totalAmount += itemTotal;

        itemsWithPrices.push({
          ...item,
          menuItem,
          unitPrice: itemPrice,
          totalPrice: itemTotal,
        });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: "eur",
        metadata: {
          restaurantId: orderData.restaurantId.toString(),
          restaurantName: restaurant.name,
          orderType: orderData.orderType,
        },
      });

      // Generate order number
      const orderNumber = generateOrderNumber();

      // Create order in database
      const order = await storage.createOrder({
        customerId: 1, // For now, using a default customer ID
        restaurantId: orderData.restaurantId,
        orderNumber,
        totalAmount: totalAmount.toFixed(2),
        paymentIntentId: paymentIntent.id,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        deliveryAddress: orderData.deliveryAddress,
        orderType: orderData.orderType,
        specialInstructions: orderData.specialInstructions,
        status: "pending",
      });

      // Create order items
      for (const item of itemsWithPrices) {
        await storage.createOrderItem({
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: item.totalPrice.toFixed(2),
          specialRequests: item.specialRequests,
        });
      }

      res.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        clientSecret: paymentIntent.client_secret,
        totalAmount: totalAmount.toFixed(2),
      });

    } catch (error: any) {
      console.error("Error creating order:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order: " + error.message });
    }
  });

  // Confirm order after successful payment
  app.post("/api/orders/:orderId/confirm", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      // Get order with details
      const orderWithDetails = await storage.getOrderWithDetails(orderId);
      if (!orderWithDetails) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify payment with Stripe
      if (orderWithDetails.paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(orderWithDetails.paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ message: "Payment not completed" });
        }
      }

      // Update order status
      const updatedOrder = await storage.updateOrderStatus(orderId, "confirmed");
      if (!updatedOrder) {
        return res.status(500).json({ message: "Failed to update order status" });
      }

      // Send email notifications
      try {
        // Send notification to restaurant
        await sendOrderNotificationToRestaurant(orderWithDetails);
        
        // Send confirmation to customer
        await sendOrderConfirmationToCustomer(orderWithDetails);
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError);
        // Continue execution even if emails fail
      }

      res.json({
        message: "Order confirmed successfully",
        order: updatedOrder,
      });

    } catch (error: any) {
      console.error("Error confirming order:", error);
      res.status(500).json({ message: "Failed to confirm order: " + error.message });
    }
  });

  // Get order details
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrderWithDetails(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error: any) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order: " + error.message });
    }
  });

  // Get orders by restaurant (for restaurant portal)
  app.get("/api/restaurants/:restaurantId/orders", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const orders = await storage.getOrdersByRestaurant(restaurantId);
      
      res.json(orders);
    } catch (error: any) {
      console.error("Error fetching restaurant orders:", error);
      res.status(500).json({ message: "Failed to fetch orders: " + error.message });
    }
  });

  // Update order status (for restaurant portal)
  app.patch("/api/orders/:orderId/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { status, estimatedReadyTime } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // TODO: Send status update notification to customer

      res.json(updatedOrder);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status: " + error.message });
    }
  });

  // Restaurant API webhook endpoint for external integrations
  app.post("/api/restaurants/:restaurantId/webhook", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      
      // Verify restaurant exists
      const restaurant = await storage.getRestaurantById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Get pending orders for the restaurant
      const orders = await storage.getOrdersByRestaurant(restaurantId);
      const pendingOrders = orders.filter(order => order.status === 'confirmed');

      res.json({
        restaurantId,
        restaurantName: restaurant.name,
        pendingOrders: pendingOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: order.totalAmount,
          orderType: order.orderType,
          orderDate: order.orderDate,
          specialInstructions: order.specialInstructions,
        })),
      });
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Webhook processing failed: " + error.message });
    }
  });
}