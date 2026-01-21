import express from 'express';
import { storage } from './storage';
import { orders, orderItems } from '../shared/schema';

const router = express.Router();

// Endpoint to create a new order
router.post('/api/orders/create', async (req, res) => {
  try {
    const { restaurantId, items, customerInfo, orderType, specialInstructions } = req.body;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      // Get menu item to calculate price
      const menuItem = await storage.getMenuItemById(item.menuItemId);
      if (menuItem) {
        const itemPrice = parseFloat(menuItem.price.replace('€', ''));
        totalAmount += itemPrice * item.quantity;
      }
    }

    // Create order
    const newOrder = {
      restaurantId,
      customerId: 1, // Using a default customer for testing
      orderNumber,
      status: 'pending',
      totalAmount: totalAmount.toFixed(2),
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      orderType,
      specialInstructions,
      orderDate: new Date(),
      estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      paymentIntentId: null,
      deliveryAddress: null,
      completedAt: null
    };

    // Insert order into database
    const createdOrder = await storage.createOrder(newOrder);

    // Create order items
    for (const item of items) {
      const menuItem = await storage.getMenuItemById(item.menuItemId);
      if (menuItem) {
        const itemPrice = parseFloat(menuItem.price.replace('€', ''));
        const orderItem = {
          orderId: createdOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: itemPrice.toFixed(2),
          totalPrice: (itemPrice * item.quantity).toFixed(2),
          specialRequests: item.specialRequests || null
        };
        await storage.createOrderItem(orderItem);
      }
    }

    res.status(201).json({
      success: true,
      order: createdOrder,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;