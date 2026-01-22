import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { insertLoyaltyCategorySchema, insertPaymentRequestSchema } from "@shared/schema";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const qr = require("qr-image");

export const loyaltyRoutes = Router();

// ==================== LOYALTY CATEGORIES ====================

loyaltyRoutes.get("/restaurants/:restaurantId/loyalty-categories", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const categories = await storage.getLoyaltyCategoriesByRestaurant(restaurantId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching loyalty categories:", error);
    res.status(500).json({ error: "Failed to fetch loyalty categories" });
  }
});

loyaltyRoutes.post("/restaurants/:restaurantId/loyalty-categories", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const parsed = insertLoyaltyCategorySchema.parse({ ...req.body, restaurantId });
    const category = await storage.createLoyaltyCategory(parsed);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating loyalty category:", error);
    res.status(500).json({ error: "Failed to create loyalty category" });
  }
});

loyaltyRoutes.put("/loyalty-categories/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await storage.updateLoyaltyCategory(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating loyalty category:", error);
    res.status(500).json({ error: "Failed to update loyalty category" });
  }
});

loyaltyRoutes.delete("/loyalty-categories/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteLoyaltyCategory(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting loyalty category:", error);
    res.status(500).json({ error: "Failed to delete loyalty category" });
  }
});

// ==================== LOYAL CUSTOMERS ====================

loyaltyRoutes.get("/restaurants/:restaurantId/loyal-customers", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const loyalCustomers = await storage.getLoyalCustomersByRestaurant(restaurantId);
    
    const enrichedCustomers = await Promise.all(
      loyalCustomers.map(async (lc) => {
        const customer = await storage.getCustomerById(lc.customerId);
        const category = lc.categoryId ? await storage.getLoyaltyCategoryById(lc.categoryId) : null;
        return {
          ...lc,
          customer,
          category
        };
      })
    );
    
    res.json(enrichedCustomers);
  } catch (error) {
    console.error("Error fetching loyal customers:", error);
    res.status(500).json({ error: "Failed to fetch loyal customers" });
  }
});

loyaltyRoutes.get("/customers/:customerId/loyalty", async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const loyalRelations = await storage.getLoyalCustomersByCustomer(customerId);
    
    const enrichedRelations = await Promise.all(
      loyalRelations.map(async (lr) => {
        const restaurant = await storage.getRestaurantById(lr.restaurantId);
        const category = lr.categoryId ? await storage.getLoyaltyCategoryById(lr.categoryId) : null;
        return {
          ...lr,
          restaurant,
          category
        };
      })
    );
    
    res.json(enrichedRelations);
  } catch (error) {
    console.error("Error fetching customer loyalty:", error);
    res.status(500).json({ error: "Failed to fetch customer loyalty" });
  }
});

loyaltyRoutes.post("/enroll-customer", async (req: Request, res: Response) => {
  try {
    const { customerCode, restaurantId } = req.body;
    
    if (!customerCode || !restaurantId) {
      return res.status(400).json({ error: "Customer code and restaurant ID required" });
    }
    
    const loyalCustomer = await storage.enrollCustomerToRestaurant(customerCode, parseInt(restaurantId));
    
    if (!loyalCustomer) {
      return res.status(404).json({ error: "Customer not found with this code" });
    }
    
    const customer = await storage.getCustomerByCode(customerCode);
    res.status(201).json({ ...loyalCustomer, customer });
  } catch (error) {
    console.error("Error enrolling customer:", error);
    res.status(500).json({ error: "Failed to enroll customer" });
  }
});

loyaltyRoutes.put("/loyal-customers/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await storage.updateLoyalCustomer(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Loyal customer not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating loyal customer:", error);
    res.status(500).json({ error: "Failed to update loyal customer" });
  }
});

// ==================== CUSTOMER CODES & QR ====================

loyaltyRoutes.post("/customers/:customerId/generate-code", async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const customer = await storage.getCustomerById(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    if (customer.customerCode) {
      return res.json({ 
        customerCode: customer.customerCode,
        message: "Customer already has a code" 
      });
    }
    
    const code = await storage.generateCustomerCode(customerId);
    
    const qrSvg = qr.imageSync(`EATOFF:${code}`, { type: 'svg' });
    const qrBase64 = Buffer.from(qrSvg).toString('base64');
    
    res.json({ 
      customerCode: code, 
      qrCode: `data:image/svg+xml;base64,${qrBase64}` 
    });
  } catch (error) {
    console.error("Error generating customer code:", error);
    res.status(500).json({ error: "Failed to generate customer code" });
  }
});

loyaltyRoutes.get("/customers/:customerId/qr-code", async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const customer = await storage.getCustomerById(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    if (!customer.customerCode) {
      return res.status(400).json({ error: "Customer does not have a code yet" });
    }
    
    const qrSvg = qr.imageSync(`EATOFF:${customer.customerCode}`, { type: 'svg' });
    const qrBase64 = Buffer.from(qrSvg).toString('base64');
    
    res.json({ 
      customerCode: customer.customerCode,
      qrCode: `data:image/svg+xml;base64,${qrBase64}` 
    });
  } catch (error) {
    console.error("Error getting customer QR code:", error);
    res.status(500).json({ error: "Failed to get customer QR code" });
  }
});

loyaltyRoutes.get("/lookup-code/:code", async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    const customer = await storage.getCustomerByCode(code);
    
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    res.json({ 
      id: customer.id,
      name: customer.name,
      email: customer.email,
      customerCode: customer.customerCode,
      membershipTier: customer.membershipTier
    });
  } catch (error) {
    console.error("Error looking up customer code:", error);
    res.status(500).json({ error: "Failed to lookup customer code" });
  }
});

// ==================== PAYMENT REQUESTS ====================

loyaltyRoutes.post("/payment-requests", async (req: Request, res: Response) => {
  try {
    const { restaurantId, customerCode, amount, description } = req.body;
    
    if (!restaurantId || !customerCode || !amount) {
      return res.status(400).json({ error: "Restaurant ID, customer code, and amount required" });
    }
    
    const customer = await storage.getCustomerByCode(customerCode);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    const loyalCustomer = await storage.getLoyalCustomer(customer.id, parseInt(restaurantId));
    let discountPercentage = 0;
    
    if (loyalCustomer?.categoryId) {
      const category = await storage.getLoyaltyCategoryById(loyalCustomer.categoryId);
      if (category) {
        discountPercentage = parseFloat(category.discountPercentage || "0");
      }
    }
    
    const originalAmount = parseFloat(amount);
    const discountAmount = (originalAmount * discountPercentage) / 100;
    const finalAmount = originalAmount - discountAmount;
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    const paymentRequest = await storage.createPaymentRequest({
      restaurantId: parseInt(restaurantId),
      customerId: customer.id,
      amount: amount.toString(),
      description,
      status: "pending",
      customerCode,
      loyaltyDiscountApplied: discountAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      expiresAt
    });
    
    const restaurant = await storage.getRestaurantById(parseInt(restaurantId));
    
    res.status(201).json({
      ...paymentRequest,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      restaurant,
      discountApplied: discountPercentage > 0,
      discountPercentage
    });
  } catch (error) {
    console.error("Error creating payment request:", error);
    res.status(500).json({ error: "Failed to create payment request" });
  }
});

loyaltyRoutes.get("/restaurants/:restaurantId/payment-requests", async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const requests = await storage.getPaymentRequestsByRestaurant(restaurantId);
    
    const enrichedRequests = await Promise.all(
      requests.map(async (pr) => {
        const customer = await storage.getCustomerById(pr.customerId);
        return { ...pr, customer };
      })
    );
    
    res.json(enrichedRequests);
  } catch (error) {
    console.error("Error fetching payment requests:", error);
    res.status(500).json({ error: "Failed to fetch payment requests" });
  }
});

loyaltyRoutes.get("/customers/:customerId/payment-requests", async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const requests = await storage.getPaymentRequestsByCustomer(customerId);
    
    const enrichedRequests = await Promise.all(
      requests.map(async (pr) => {
        const restaurant = await storage.getRestaurantById(pr.restaurantId);
        return { ...pr, restaurant };
      })
    );
    
    res.json(enrichedRequests);
  } catch (error) {
    console.error("Error fetching customer payment requests:", error);
    res.status(500).json({ error: "Failed to fetch payment requests" });
  }
});

loyaltyRoutes.get("/customers/:customerId/pending-payments", async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const requests = await storage.getPendingPaymentRequestsByCustomer(customerId);
    
    const enrichedRequests = await Promise.all(
      requests.map(async (pr) => {
        const restaurant = await storage.getRestaurantById(pr.restaurantId);
        return { ...pr, restaurant };
      })
    );
    
    res.json(enrichedRequests);
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({ error: "Failed to fetch pending payments" });
  }
});

loyaltyRoutes.put("/payment-requests/:id/confirm", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { paymentMethod } = req.body;
    
    const request = await storage.getPaymentRequestById(id);
    if (!request) {
      return res.status(404).json({ error: "Payment request not found" });
    }
    
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Payment request is no longer pending" });
    }
    
    if (new Date() > new Date(request.expiresAt)) {
      await storage.updatePaymentRequest(id, { status: "expired" });
      return res.status(400).json({ error: "Payment request has expired" });
    }
    
    const updated = await storage.updatePaymentRequest(id, {
      status: "confirmed",
      paymentMethod,
      confirmedAt: new Date()
    });
    
    res.json(updated);
  } catch (error) {
    console.error("Error confirming payment request:", error);
    res.status(500).json({ error: "Failed to confirm payment request" });
  }
});

loyaltyRoutes.put("/payment-requests/:id/reject", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const request = await storage.getPaymentRequestById(id);
    if (!request) {
      return res.status(404).json({ error: "Payment request not found" });
    }
    
    const updated = await storage.updatePaymentRequest(id, { status: "rejected" });
    res.json(updated);
  } catch (error) {
    console.error("Error rejecting payment request:", error);
    res.status(500).json({ error: "Failed to reject payment request" });
  }
});

loyaltyRoutes.put("/payment-requests/:id/complete", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { stripePaymentIntentId } = req.body;
    
    const request = await storage.getPaymentRequestById(id);
    if (!request) {
      return res.status(404).json({ error: "Payment request not found" });
    }
    
    if (request.status !== "confirmed") {
      return res.status(400).json({ error: "Payment must be confirmed first" });
    }
    
    const updated = await storage.updatePaymentRequest(id, {
      status: "completed",
      stripePaymentIntentId,
      completedAt: new Date()
    });
    
    if (updated) {
      const loyalCustomer = await storage.getLoyalCustomer(request.customerId, request.restaurantId);
      if (loyalCustomer) {
        await storage.updateLoyalCustomer(loyalCustomer.id, {
          totalVisits: (loyalCustomer.totalVisits || 0) + 1,
          totalSpend: (parseFloat(loyalCustomer.totalSpend?.toString() || "0") + parseFloat(request.finalAmount || "0")).toFixed(2),
          lastVisitAt: new Date()
        });
      }
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error completing payment request:", error);
    res.status(500).json({ error: "Failed to complete payment request" });
  }
});
